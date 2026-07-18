import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, readdirSync, appendFileSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const LOG = join(homedir(), '.devin-team-controller-test.log');
function log(msg) {
	const line = `[${new Date().toISOString()}] ${msg}\n`;
	appendFileSync(LOG, line);
	console.log(line.trim());
}

function findDevin() {
	const devinServerDir = join(homedir(), '.devin-server', 'bin');
	const commits = readdirSync(devinServerDir);
	for (const commit of commits) {
		const candidate = join(devinServerDir, commit, 'extensions', 'windsurf', 'devin', 'bin', 'devin');
		if (existsSync(candidate)) return candidate;
	}
	throw new Error('devin not found');
}

const binary = findDevin();
const workspace = '/workspaces/AKVJ';
const promptsDir = join(workspace, '.agents', 'workflows', 'developer-team', 'prompts');

const agents = [
	{ role: 'team-lead', model: 'SWE-1.6', promptFile: 'team-lead.prompt.md', mcpServers: [] },
	{ role: 'akvj-developer', model: 'SWE-1.6', promptFile: 'akvj-developer.prompt.md', mcpServers: [] },
	{ role: 'mainframe-developer', model: 'SWE-1.6', promptFile: 'mainframe-developer.prompt.md', mcpServers: [] },
	{ role: 'qa-reviewer', model: 'SWE-1.6', promptFile: 'qa-reviewer.prompt.md', mcpServers: [] }
];

function testAgent(agent) {
	return new Promise(resolve => {
		log(`\n=== Testing ${agent.role} ===`);
		const args = ['--model', agent.model, '--permission-mode', 'dangerous', 'acp'];
		log(`Spawn: ${binary} ${args.join(' ')}`);

		const proc = spawn(binary, args, { cwd: workspace, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env } });
		let buffer = '';
		let nextId = 1;
		const pending = new Map();
		let sessionId = null;
		let updates = [];

		proc.stdout.setEncoding('utf-8');
		proc.stderr.setEncoding('utf-8');

		proc.stderr.on('data', chunk => {
			for (const line of chunk.split('\n')) {
				if (line.trim()) log(`[${agent.role}] stderr: ${line.trim()}`);
			}
		});

		proc.on('exit', (code, signal) => log(`[${agent.role}] Process exited: code=${code} signal=${signal}`));

		function send(msg) {
			proc.stdin.write(JSON.stringify(msg) + '\n');
		}

		function request(method, params) {
			const id = nextId++;
			return new Promise((resolve, reject) => {
				pending.set(id, { resolve, reject });
				send({ jsonrpc: '2.0', id, method, params });
			});
		}

		proc.stdout.on('data', chunk => {
			buffer += chunk;
			let idx;
			while ((idx = buffer.indexOf('\n')) !== -1) {
				const line = buffer.slice(0, idx).trim();
				buffer = buffer.slice(idx + 1);
				if (!line) continue;
				try {
					const msg = JSON.parse(line);
					if (msg.id !== undefined && (msg.result !== undefined || msg.error !== undefined)) {
						const p = pending.get(msg.id);
						if (p) {
							pending.delete(msg.id);
							if (msg.error) {
								log(`[${agent.role}] RPC error id=${msg.id}: ${JSON.stringify(msg.error)}`);
								p.reject(new Error(JSON.stringify(msg.error)));
							} else {
								p.resolve(msg.result);
							}
						}
					} else if (msg.method === 'session/update') {
						updates.push(msg.params);
					} else if (msg.method === 'session/request_permission') {
						send({ jsonrpc: '2.0', id: msg.id, result: { outcome: { outcome: 'selected', optionId: 'allow' } } });
					} else if (msg.id !== undefined) {
						send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Method not found' } });
					}
				} catch {}
			}
		});

		async function run() {
			try {
				log(`[${agent.role}] Sending initialize...`);
				const initResult = await request('initialize', {
					protocolVersion: 1,
					clientCapabilities: { fs: { readTextFile: true, writeTextFile: true }, terminal: true, auth: { terminal: true } }
				});
				log(`[${agent.role}] Initialize OK: protocolVersion=${initResult.protocolVersion}`);

				log(`[${agent.role}] Sending session/new...`);
				const sessionResult = await request('session/new', { cwd: workspace, mcpServers: agent.mcpServers });
				sessionId = sessionResult.sessionId;
				log(`[${agent.role}] Session created: ${sessionId}`);

				const promptFilePath = join(promptsDir, agent.promptFile);
				const promptFileContent = existsSync(promptFilePath) ? readFileSync(promptFilePath, 'utf-8') : `You are the ${agent.role} agent in the AKVJ developer team.`;
				log(`[${agent.role}] Sending role prompt (${promptFileContent.length} chars)...`);
				const promptResult = await request('session/prompt', { sessionId, prompt: [{ type: 'text', text: promptFileContent }] });
				log(`[${agent.role}] Prompt result: stopReason=${promptResult.stopReason}`);
				log(`[${agent.role}] Received ${updates.length} session/update events`);
				log(`[${agent.role}] SUCCESS ✓`);
				proc.kill('SIGTERM');
				resolve({ role: agent.role, success: true, sessionId, updates: updates.length, stopReason: promptResult.stopReason });
			} catch (error) {
				log(`[${agent.role}] FAILED ✗: ${error.message}`);
				proc.kill('SIGTERM');
				resolve({ role: agent.role, success: false, error: error.message });
			}
		}
		run();
	});
}

(async () => {
	log('Starting full agent test (spawn + initialize + session/new + session/prompt)...');
	const results = [];
	for (const agent of agents) {
		const result = await testAgent(agent);
		results.push(result);
		await new Promise(r => setTimeout(r, 2000));
	}
	log('\n=== Summary ===');
	for (const r of results) {
		if (r.success) log(`✓ ${r.role}: session=${r.sessionId}, updates=${r.updates}, stopReason=${r.stopReason}`);
		else log(`✗ ${r.role}: ${r.error}`);
	}
	const allPassed = results.every(r => r.success);
	log(`\nOverall: ${allPassed ? 'ALL PASSED ✓' : 'SOME FAILED ✗'}`);
	process.exit(allPassed ? 0 : 1);
})();
