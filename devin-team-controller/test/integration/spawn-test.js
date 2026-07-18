import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { appendFileSync, existsSync, readdirSync } from 'node:fs';
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

const agents = [
	{ role: 'team-lead', model: 'SWE-1.6' },
	{ role: 'akvj-developer', model: 'SWE-1.6' },
	{ role: 'mainframe-developer', model: 'SWE-1.6' },
	{ role: 'qa-reviewer', model: 'SWE-1.6' }
];

async function testAgent(agent) {
	log(`\n=== Testing ${agent.role} ===`);
	const args = ['--model', agent.model, '--permission-mode', 'dangerous', 'acp'];
	log(`Spawn: ${binary} ${args.join(' ')}`);

	const proc = spawn(binary, args, { cwd: workspace, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env } });
	let buffer = '';
	let nextId = 1;
	const pending = new Map();

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
				}
			} catch {}
		}
	});

	try {
		log(`[${agent.role}] Sending initialize...`);
		const initResult = await request('initialize', {
			protocolVersion: 1,
			clientCapabilities: { fs: { readTextFile: true, writeTextFile: true }, terminal: true, auth: { terminal: true } }
		});
		log(`[${agent.role}] Initialize OK: protocolVersion=${initResult.protocolVersion}`);

		log(`[${agent.role}] Sending session/new with mcpServers=[]...`);
		const sessionResult = await request('session/new', { cwd: workspace, mcpServers: [] });
		log(`[${agent.role}] Session created: ${sessionResult.sessionId}`);

		log(`[${agent.role}] SUCCESS ✓`);
		proc.kill('SIGTERM');
		return { role: agent.role, success: true, sessionId: sessionResult.sessionId };
	} catch (error) {
		log(`[${agent.role}] FAILED ✗: ${error.message}`);
		proc.kill('SIGTERM');
		return { role: agent.role, success: false, error: error.message };
	}
}

(async () => {
	log('Starting agent spawn tests...');
	const results = [];
	for (const agent of agents) {
		results.push(await testAgent(agent));
		await new Promise(r => setTimeout(r, 1000));
	}
	log('\n=== Summary ===');
	for (const r of results) {
		log(`${r.success ? '✓' : '✗'} ${r.role}: ${r.success ? r.sessionId : r.error}`);
	}
	process.exit(0);
})();
