import { spawn, execSync, type ChildProcess } from 'node:child_process';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { readdirSync, existsSync, appendFileSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import type { McpServerConfig } from '../types/agents.js';

const LOG_FILE = join(homedir(), '.devin-team-controller.log');

function log(message: string): void {
	const line = `[${new Date().toISOString()}] ${message}\n`;
	try {
		appendFileSync(LOG_FILE, line);
	} catch {
		// Logging is best-effort
	}
}

export interface AcpSessionUpdate {
	sessionUpdate: string;
	content?: { text?: string };
	title?: string;
	status?: string;
	[key: string]: unknown;
}

export interface AcpInitializeResult {
	protocolVersion: number;
	agentCapabilities: Record<string, unknown>;
	authMethods: Array<{ id: string; name: string; description?: string }>;
}

export interface AcpPromptResult {
	stopReason: string;
}

type UpdateHandler = (update: AcpSessionUpdate) => void;
type ExitHandler = (code: number | null, signal: NodeJS.Signals | null) => void;
type PermissionHandler = (params: { requestId: string; options: Array<{ optionId: string; name: string }> }) => { outcome: { outcome: string; optionId: string } };

interface PendingRequest {
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
}

export class AcpClient {
	#process: ChildProcess | null = null;
	#buffer = '';
	#nextId = 1;
	#pending: Map<number, PendingRequest> = new Map();
	#handlers: Map<string, UpdateHandler> = new Map();
	#exitHandlers: ExitHandler[] = [];
	#permissionHandler: PermissionHandler | null = null;
	#sessionId: string | null = null;
	#agentRole: string;
	#cwd: string;

	constructor(agentRole: string, cwd: string) {
		this.#agentRole = agentRole;
		this.#cwd = cwd;
	}

	get agentRole(): string {
		return this.#agentRole;
	}

	get sessionId(): string | null {
		return this.#sessionId;
	}

	get isRunning(): boolean {
		return this.#process !== null && !this.#process.killed;
	}

	// resumeSessionId: pass to use --resume <id> (session resume path)
	async start(model: string, permissionMode: string, resumeSessionId?: string): Promise<AcpInitializeResult> {
		const binaryPath = findDevinBinary();
		// Top-level flags must come before the 'acp' subcommand
		const args = ['--model', model, '--permission-mode', permissionMode];
		if (resumeSessionId) {
			args.push('--resume', resumeSessionId);
		}
		args.push('acp');

		log(`[${this.#agentRole}] Spawning: ${binaryPath} ${args.join(' ')}`);

		this.#process = spawnAgent(binaryPath, args, this.#cwd);

		this.#process.stdout?.setEncoding('utf-8');
		this.#process.stdout?.on('data', (chunk: string) => this.#onData(chunk));

		this.#process.stderr?.setEncoding('utf-8');
		this.#process.stderr?.on('data', (chunk: string) => {
			for (const line of chunk.split('\n')) {
				const trimmed = line.trim();
				if (trimmed) {
					log(`[${this.#agentRole}] stderr: ${trimmed}`);
				}
			}
		});

		this.#process.on('exit', (code, signal) => {
			for (const [id, { reject }] of this.#pending) {
				reject(new Error(`Process exited (code=${code}, signal=${signal})`));
			}
			this.#pending.clear();
			for (const handler of this.#exitHandlers) {
				handler(code, signal);
			}
		});

		return this.initialize();
	}

	async initialize(): Promise<AcpInitializeResult> {
		log(`[${this.#agentRole}] Sending initialize`);
		const result = (await this.request('initialize', {
			protocolVersion: 1,
			clientCapabilities: {
				fs: { readTextFile: true, writeTextFile: true },
				terminal: true,
				auth: { terminal: true }
			}
		})) as AcpInitializeResult;

		log(`[${this.#agentRole}] Initialize success: protocolVersion=${result.protocolVersion}`);
		return result;
	}

	async newSession(mcpServers: McpServerConfig[] = []): Promise<string> {
		log(`[${this.#agentRole}] Sending session/new with mcpServers=${JSON.stringify(mcpServers)}`);
		const result = (await this.request('session/new', {
			cwd: this.#cwd,
			mcpServers
		})) as { sessionId: string };

		this.#sessionId = result.sessionId;
		log(`[${this.#agentRole}] Session created: ${result.sessionId}`);
		return result.sessionId;
	}

	// Called after --resume spawn succeeds: sets the known sessionId without a session/new round-trip.
	resumeSession(sessionId: string): void {
		this.#sessionId = sessionId;
	}

	async loadSession(sessionId: string): Promise<void> {
		await this.request('session/load', { sessionId });
		this.#sessionId = sessionId;
	}

	async prompt(text: string): Promise<AcpPromptResult> {
		if (!this.#sessionId) {
			throw new Error('No active session');
		}
		const result = (await this.request('session/prompt', {
			sessionId: this.#sessionId,
			prompt: [{ type: 'text', text }]
		})) as AcpPromptResult;
		return result;
	}

	cancel(): void {
		if (this.#sessionId) {
			// Best-effort: some Devin CLI versions return "Method not found" for session/cancel.
			// The kill() call that follows will terminate the process regardless.
			this.notify('session/cancel', { sessionId: this.#sessionId });
		}
	}

	// SIGTERM with SIGKILL escalation after timeoutMs if the process hasn't exited.
	kill(timeoutMs = 5_000): void {
		if (!this.#process || this.#process.killed) {
			return;
		}
		this.#process.kill('SIGTERM');
		const escalate = setTimeout(() => {
			if (this.#process && !this.#process.killed) {
				this.#process.kill('SIGKILL');
			}
		}, timeoutMs);
		this.#process.once('exit', () => clearTimeout(escalate));
	}

	onSessionUpdate(handler: UpdateHandler): void {
		this.#handlers.set('session/update', handler);
	}

	onExit(handler: ExitHandler): void {
		this.#exitHandlers.push(handler);
	}

	setPermissionHandler(handler: PermissionHandler): void {
		this.#permissionHandler = handler;
	}

	#onData(chunk: string): void {
		this.#buffer += chunk;
		let newlineIdx: number;
		while ((newlineIdx = this.#buffer.indexOf('\n')) !== -1) {
			const line = this.#buffer.slice(0, newlineIdx).trim();
			this.#buffer = this.#buffer.slice(newlineIdx + 1);
			if (line) {
				try {
					const message = JSON.parse(line);
					this.#handleMessage(message);
				} catch {
					// Skip unparseable lines
				}
			}
		}
	}

	#handleMessage(message: Record<string, unknown>): void {
		if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
			const pending = this.#pending.get(message.id as number);
			if (pending) {
				this.#pending.delete(message.id as number);
				if (message.error) {
					const errMsg = (message.error as { message?: string }).message ?? JSON.stringify(message.error);
					log(`[${this.#agentRole}] RPC error id=${message.id}: ${errMsg}`);
					pending.reject(new Error(errMsg));
				} else {
					pending.resolve(message.result);
				}
			}
		} else if (message.method) {
			const method = message.method as string;
			if (method === 'session/update') {
				const handler = this.#handlers.get('session/update');
				if (handler) {
					handler(message.params as AcpSessionUpdate);
				}
			} else if (method === 'session/request_permission') {
				if (this.#permissionHandler && message.id !== undefined) {
					const result = this.#permissionHandler(
						message.params as {
							requestId: string;
							options: Array<{ optionId: string; name: string }>;
						}
					);
					this.#send({
						jsonrpc: '2.0',
						id: message.id,
						result
					});
				}
			} else if (method === 'readTextFile' || method === 'fs/readTextFile') {
				if (message.id !== undefined) {
					const filePath = (message.params as { path?: string }).path ?? '';
					let content = '';
					try {
						content = readFileSync(filePath, 'utf-8');
					} catch {
						// File not found or unreadable — return empty content
					}
					this.#send({ jsonrpc: '2.0', id: message.id, result: { content } });
				}
			} else if (method === 'writeTextFile' || method === 'fs/writeTextFile') {
				if (message.id !== undefined) {
					const params = message.params as { path?: string; content?: string };
					try {
						const filePath = params.path ?? '';
						mkdirSync(dirname(filePath), { recursive: true });
						writeFileSync(filePath, params.content ?? '', 'utf-8');
					} catch (err) {
						log(`[${this.#agentRole}] writeTextFile failed: ${err}`);
					}
					this.#send({ jsonrpc: '2.0', id: message.id, result: {} });
				}
			} else if (message.id !== undefined) {
				this.#send({
					jsonrpc: '2.0',
					id: message.id,
					error: { code: -32601, message: `Method not found: ${method}` }
				});
			}
		}
	}

	request(method: string, params: Record<string, unknown>): Promise<unknown> {
		const id = this.#nextId++;
		return new Promise((resolve, reject) => {
			this.#pending.set(id, { resolve, reject });
			this.#send({ jsonrpc: '2.0', id, method, params });
		});
	}

	notify(method: string, params: Record<string, unknown>): void {
		this.#send({ jsonrpc: '2.0', method, params });
	}

	#send(message: Record<string, unknown>): void {
		if (this.#process?.stdin?.writable) {
			this.#process.stdin.write(JSON.stringify(message) + '\n');
		}
	}
}

function spawnAgent(binaryPath: string, args: string[], cwd: string): ReturnType<typeof spawn> {
	if (process.platform === 'win32') {
		return spawn(binaryPath, args, {
			cwd,
			stdio: ['pipe', 'pipe', 'pipe'],
			shell: true,
			env: { ...process.env }
		});
	}

	// Use login shell on Linux/macOS so the user's PATH is loaded (nvm, homebrew, devin install dirs).
	const shell = process.env.SHELL ?? '/bin/bash';
	const supportsLoginFlag = /bash|zsh|ksh/.test(shell);
	const escaped = [binaryPath, ...args].map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
	const shellArgs = supportsLoginFlag ? ['-l', '-c', escaped] : ['-c', escaped];

	return spawn(shell, shellArgs, {
		cwd,
		stdio: ['pipe', 'pipe', 'pipe'],
		env: { ...process.env }
	});
}

export function findDevinBinary(): string {
	// Check PATH first (platform-aware)
	const whichCmd = process.platform === 'win32' ? 'where' : 'which';
	try {
		const result = execSync(`${whichCmd} devin`, { encoding: 'utf-8' }).trim().split('\n')[0].trim();
		if (result) {
			return result;
		}
	} catch {
		// Not on PATH, search devin-server
	}

	// Search in devin-server extensions (installed by Devin Desktop)
	const devinServerDir = join(homedir(), '.devin-server', 'bin');
	const binaryName = process.platform === 'win32' ? 'devin.exe' : 'devin';
	try {
		const commits = readdirSync(devinServerDir);
		for (const commit of commits) {
			const candidate = join(devinServerDir, commit, 'extensions', 'windsurf', 'devin', 'bin', binaryName);
			if (existsSync(candidate)) {
				return candidate;
			}
		}
	} catch {
		// devin-server not found
	}

	throw new Error('Could not find devin binary. Ensure Devin Desktop is installed and run "devin auth login".');
}
