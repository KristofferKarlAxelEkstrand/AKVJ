import { AcpClient, type AcpSessionUpdate } from './AcpClient.js';
import type { AgentConfig, AgentRole } from '../types/agents.js';
import { join } from 'node:path';
import type { StateStore } from '../core/StateStore.js';
import type { ApplicationEventBus } from '../core/eventBus.js';
import { appendFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const LOG_FILE = join(homedir(), '.devin-team-controller.log');

function log(message: string): void {
	const line = `[${new Date().toISOString()}] ${message}\n`;
	try {
		appendFileSync(LOG_FILE, line);
	} catch {
		// Best-effort
	}
}

export type AgentStatus = 'stopped' | 'starting' | 'idle' | 'busy' | 'crashed';

type ActivityType = 'started' | 'stopped' | 'crashed' | 'prompt_sent' | 'prompt_completed' | 'prompt_failed' | 'restarting';

export interface AgentState {
	role: AgentRole;
	status: AgentStatus;
	sessionId: string | null;
	lastPromptTime: number | null;
	lastStopReason: string | null;
	restartCount: number;
}

export interface AcpClientPoolOptions {
	workspaceRoot: string;
	eventBus: ApplicationEventBus;
}

export class AcpClientPool {
	#clients: Map<AgentRole, AcpClient> = new Map();
	#states: Map<AgentRole, AgentState> = new Map();
	#configs: Map<AgentRole, AgentConfig> = new Map();
	#workspaceRoot: string;
	#promptsDir: string;
	#stateStore: StateStore | null = null;
	#eventBus: ApplicationEventBus;

	constructor(options: AcpClientPoolOptions) {
		this.#workspaceRoot = options.workspaceRoot;
		this.#promptsDir = join(options.workspaceRoot, '.agents', 'workflows', 'developer-team', 'prompts');
		this.#eventBus = options.eventBus;
	}

	setStateStore(stateStore: StateStore): void {
		this.#stateStore = stateStore;
	}

	getAgentState(role: AgentRole): AgentState | undefined {
		return this.#states.get(role);
	}

	getAllStates(): AgentState[] {
		return Array.from(this.#states.values());
	}

	async startAgent(config: AgentConfig): Promise<void> {
		if (this.#clients.has(config.role)) {
			return;
		}

		this.#configs.set(config.role, config);
		this.#setStatus(config.role, 'starting');

		const promptFilePath = join(this.#promptsDir, config.promptFile);

		const savedState = await this.#stateStore?.load();
		const savedAgent = savedState?.agentStates.find(a => a.role === config.role);
		const savedSessionId = savedAgent?.sessionId ?? undefined;

		if (savedSessionId) {
			const resumed = await this.#tryResumeAgent(config, promptFilePath, savedSessionId);
			if (resumed) {
				return;
			}
		}

		await this.#startFreshAgent(config, promptFilePath);
	}

	async #tryResumeAgent(config: AgentConfig, _promptFilePath: string, sessionId: string): Promise<boolean> {
		const client = this.#makeClient(config);
		log(`[Pool] Trying resume for ${config.role}: sessionId=${sessionId}`);
		try {
			await client.start(config.model, config.permissionMode, sessionId);
			client.resumeSession(sessionId);
			this.#setStatus(config.role, 'idle');
			this.#logActivity(config.role, 'started', `Resumed session ${sessionId}`);
			this.#clients.set(config.role, client);
			return true;
		} catch (error) {
			console.warn(`[AcpClientPool] Session resume failed for ${config.role}, falling back to fresh start:`, error);
			client.kill();
			return false;
		}
	}

	async #startFreshAgent(config: AgentConfig, promptFilePath: string): Promise<void> {
		const client = this.#makeClient(config);
		try {
			log(`[Pool] Starting fresh agent ${config.role}: model=${config.model}, permissionMode=${config.permissionMode}, promptFile=${promptFilePath}`);
			await client.start(config.model, config.permissionMode);
			await client.newSession(config.mcpServers ?? []);

			let promptContent: string;
			try {
				promptContent = readFileSync(promptFilePath, 'utf-8');
			} catch {
				promptContent = `You are the ${config.role} agent in the AKVJ developer team.`;
				log(`[Pool] Could not read prompt file for ${config.role}: ${promptFilePath}`);
			}
			await client.prompt(promptContent);

			const state = this.#states.get(config.role);
			if (state) {
				state.sessionId = client.sessionId;
				state.restartCount = 0;
				await this.#persistAgentState(config.role);
			}

			this.#setStatus(config.role, 'idle');
			this.#logActivity(config.role, 'started', `Session ${client.sessionId}`);
			this.#clients.set(config.role, client);
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			log(`[Pool] Failed to start agent ${config.role}: ${errorMsg}`);
			console.error(`[AcpClientPool] Failed to start agent ${config.role}:`, error);
			client.kill();
			this.#setStatus(config.role, 'crashed');
			this.#logActivity(config.role, 'crashed', `Start failed: ${errorMsg}`);
		}
	}

	#makeClient(config: AgentConfig): AcpClient {
		const client = new AcpClient(config.role, this.#workspaceRoot);

		client.onSessionUpdate(update => {
			this.#eventBus.emitEvent({
				type: 'agent-update',
				role: config.role,
				update
			});
		});

		client.onExit((code, signal) => {
			console.error(`[AcpClientPool] Agent ${config.role} exited: code=${code} signal=${signal}`);
			this.#clients.delete(config.role);
			const state = this.#states.get(config.role);
			if (state && state.status !== 'stopped') {
				this.#setStatus(config.role, 'crashed');
				this.#logActivity(config.role, 'crashed', `Exit code=${code} signal=${signal}`);
				this.#maybeRestart(config);
			}
		});

		client.setPermissionHandler((params: { requestId: string; options: Array<{ optionId: string; name: string }> }) => {
			log(`[${config.role}] Permission request: ${JSON.stringify(params)}`);
			const allowOption = params.options?.find(o => o.optionId === 'allow') ?? params.options?.[0];
			return {
				outcome: { outcome: 'selected', optionId: allowOption?.optionId ?? 'allow' }
			};
		});

		return client;
	}

	async sendPrompt(role: AgentRole, text: string): Promise<{ stopReason: string }> {
		const client = this.#clients.get(role);
		if (!client || !client.isRunning) {
			throw new Error(`Agent ${role} is not running`);
		}

		this.#setStatus(role, 'busy');
		this.#logActivity(role, 'prompt_sent', text.slice(0, 100));
		try {
			const result = await client.prompt(text);
			const state = this.#states.get(role);
			if (state) {
				state.lastPromptTime = Date.now();
				state.lastStopReason = result.stopReason;
			}
			this.#setStatus(role, 'idle');
			this.#logActivity(role, 'prompt_completed', `stopReason: ${result.stopReason}`);
			return result;
		} catch (error) {
			console.error(`[AcpClientPool] Prompt failed for ${role}:`, error);
			this.#setStatus(role, 'crashed');
			this.#logActivity(role, 'prompt_failed', error instanceof Error ? error.message : String(error));
			throw error;
		}
	}

	async stopAgent(role: AgentRole): Promise<void> {
		const client = this.#clients.get(role);
		if (client) {
			client.cancel();
			client.kill();
			this.#clients.delete(role);
		}
		const state = this.#states.get(role);
		if (state) {
			state.status = 'stopped';
		}
		this.#setStatus(role, 'stopped');
		this.#logActivity(role, 'stopped', 'Manual stop');
	}

	async respawnAgent(role: AgentRole): Promise<void> {
		const config = this.#configs.get(role);
		if (!config) {
			return;
		}
		this.#logActivity(role, 'restarting', 'Prompt file updated — respawning with new prompt');
		await this.stopAgent(role);

		const state = this.#states.get(role);
		if (state) {
			state.sessionId = null;
		}
		await this.#stateStore?.saveAgentState({
			role,
			sessionId: null,
			model: config.model,
			enabled: config.enabled
		});

		await new Promise(resolve => setTimeout(resolve, 500));
		const promptFilePath = join(this.#promptsDir, config.promptFile);
		await this.#startFreshAgent(config, promptFilePath);
	}

	async stopAll(): Promise<void> {
		const roles = Array.from(this.#clients.keys());
		await Promise.all(roles.map(role => this.stopAgent(role)));
	}

	async #maybeRestart(config: AgentConfig): Promise<void> {
		const state = this.#states.get(config.role);
		if (!state || state.status === 'stopped') {
			return;
		}

		const MAX_RESTART_ATTEMPTS = 3;
		const RESTART_BASE_DELAY_MS = 2_000;
		if (state.restartCount >= MAX_RESTART_ATTEMPTS) {
			console.error(`[AcpClientPool] Agent ${config.role} exceeded max restart attempts (${MAX_RESTART_ATTEMPTS})`);
			return;
		}

		state.restartCount++;
		const delay = RESTART_BASE_DELAY_MS * Math.pow(2, state.restartCount - 1);
		this.#logActivity(config.role, 'restarting', `Attempt ${state.restartCount} after ${delay}ms`);

		setTimeout(() => {
			if (state.status === 'stopped') {
				return;
			}
			this.startAgent(config).catch(error => {
				console.error(`[AcpClientPool] Restart failed for ${config.role}:`, error);
			});
		}, delay);
	}

	async #persistAgentState(role: AgentRole): Promise<void> {
		if (!this.#stateStore) {
			return;
		}
		const state = this.#states.get(role);
		const config = this.#configs.get(role);
		if (!state || !config) {
			return;
		}
		await this.#stateStore.saveAgentState({
			role,
			sessionId: state.sessionId,
			model: config.model,
			enabled: config.enabled
		});
	}

	#setStatus(role: AgentRole, status: AgentStatus): void {
		let state = this.#states.get(role);
		if (!state) {
			state = {
				role,
				status: 'stopped',
				sessionId: null,
				lastPromptTime: null,
				lastStopReason: null,
				restartCount: 0
			};
			this.#states.set(role, state);
		}
		state.status = status;
		this.#eventBus.emitEvent({ type: 'agent-status', role, status });
	}

	#logActivity(role: AgentRole, activityType: ActivityType, detail: string): void {
		this.#eventBus.emitEvent({
			type: 'activity',
			role,
			activityType,
			detail,
			timestamp: Date.now()
		});
	}
}
