import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { WorkflowTree, message } from './utils/workflowTree.js';

/**
 * The poller decides when an agent runs at all, so its edge cases are the
 * difference between a working team and one that silently goes quiet. Two
 * behaviours here were real incidents: a message marked seen before the turn
 * that handles it (burying it forever if the turn died), and roles with no
 * random wake having no scheduled path back to life at all.
 */
describe('await-messages', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	/**
	 * Run the poller until it wakes or the timeout expires.
	 *
	 * A wake is decided by the startup check, so it lands in well under a
	 * second; the wait only needs to outlast one 2s poll interval to be
	 * confident that *no* wake is coming.
	 *
	 * @returns {Promise<{woke: boolean, stdout: string}>}
	 */
	function poll(agent, { timeoutMs = 2500 } = {}) {
		return new Promise(resolve => {
			const child = spawn('node', [path.join(tree.scriptsDir, 'await-messages.js'), tree.workflow, agent], {
				stdio: ['ignore', 'pipe', 'pipe']
			});

			let stdout = '';
			child.stdout.on('data', chunk => {
				stdout += chunk;
			});
			child.stderr.on('data', chunk => {
				stdout += chunk;
			});

			const timer = setTimeout(() => {
				child.kill('SIGKILL');
				resolve({ woke: false, stdout });
			}, timeoutMs);

			child.on('exit', code => {
				clearTimeout(timer);
				resolve({ woke: code === 0, stdout });
			});
		});
	}

	/**
	 * Spawn a poller and leave it running.
	 * @returns {{child: import('node:child_process').ChildProcess, output: () => string, exited: Promise<void>}}
	 */
	function startPoller(agent) {
		const child = spawn('node', [path.join(tree.scriptsDir, 'await-messages.js'), tree.workflow, agent], {
			stdio: ['ignore', 'pipe', 'pipe']
		});
		let output = '';
		child.stdout.on('data', chunk => {
			output += chunk;
		});
		child.stderr.on('data', chunk => {
			output += chunk;
		});
		const exited = new Promise(resolve => child.on('exit', () => resolve()));
		return { child, output: () => output, exited };
	}

	const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

	it('stands down when a newer poller claims the same mailbox', async () => {
		// Restarting an agent's chat does not kill the poller its previous
		// session started. The orphan kept rewriting the heartbeat, so the
		// monitor saw a dead session as alive and never restarted it — the
		// mechanism behind an ~11.5-hour stall. The newest poller must win.
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });

		const first = startPoller('agent-a');
		await wait(1500);
		const second = startPoller('agent-a');

		await Promise.race([first.exited, wait(6000)]);

		expect(first.child.exitCode).toBe(0);
		expect(first.output()).toContain('newer poller owns');
		expect(second.child.exitCode).toBe(null); // still listening

		second.child.kill('SIGKILL');
		await second.exited;
	});

	it('wakes on a broadcast without the agent opting in', async () => {
		// A shared-file change used to be hand-copied into every agent folder,
		// and the list of folders in the protocol went stale twice as the team
		// grew. Watching slack/all/ is unconditional so a new agent is
		// reachable the moment its config exists.
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });
		await poll('agent-a');

		tree.write('slack/all/[PROMPT-UPDATED]-sleep-step.md', message({ type: 'prompt-updated', from: 'overseer' }));
		const result = await poll('agent-a');

		expect(result.woke).toBe(true);
		expect(result.stdout).toContain('[PROMPT-UPDATED]-sleep-step.md');
	});

	it('wakes each agent only once for the same broadcast', async () => {
		// Readers do not delete a broadcast — it belongs to everyone. The retry
		// that rescues un-handled personal mail would therefore re-wake the
		// whole team a second time for a file that is exactly where it belongs.
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });
		await poll('agent-a');

		tree.write('slack/all/[PROMPT-UPDATED]-protocol.md', message({ type: 'prompt-updated', from: 'overseer' }));
		expect((await poll('agent-a')).woke).toBe(true);

		const second = await poll('agent-a');
		expect(second.woke).toBe(false);
	});

	it('does not wake for mail that was already there when it first started', async () => {
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });
		tree.write('slack/agent-a/existing.md', message({ to: 'agent-a' }));

		const result = await poll('agent-a');

		expect(result.woke).toBe(false);
		expect(result.stdout).toContain('First-run baseline');
	});

	it('wakes when new mail arrives', async () => {
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });
		tree.write('slack/agent-a/old.md', message({ to: 'agent-a' }));
		await poll('agent-a');

		tree.write('slack/agent-a/new.md', message({ to: 'agent-a' }));
		const result = await poll('agent-a');

		expect(result.woke).toBe(true);
		expect(result.stdout).toContain('new.md');
	});

	it('retries once for a message whose handling turn died, then goes quiet', async () => {
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });
		await poll('agent-a');

		tree.write('slack/agent-a/unhandled.md', message({ to: 'agent-a' }));

		// First wake: the message is new.
		expect((await poll('agent-a')).woke).toBe(true);
		// Second: still sitting there unhandled, so it gets one recovery wake.
		expect((await poll('agent-a')).woke).toBe(true);
		// Third: the retry is spent — an agent that chooses to leave a file
		// there must not become a wake loop.
		expect((await poll('agent-a')).woke).toBe(false);
	});

	it('wakes again when a handled message is replaced by a new one of the same name', async () => {
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });
		tree.write('slack/agent-a/msg.md', message({ to: 'agent-a' }));
		await poll('agent-a');
		await poll('agent-a');
		await poll('agent-a');

		tree.write('slack/agent-a/msg.md', message({ to: 'agent-a', body: 'A genuinely new request.' }));

		expect((await poll('agent-a')).woke).toBe(true);
	});

	it('does not retry in mail/out, where a question legitimately waits for a human', async () => {
		tree.addAgent('watcher', { config: { fallback_wake_minutes: 0, watch_folders: ['slack/watcher', 'mail/out'] } });
		await poll('watcher');

		tree.write('mail/out/question-1.md', 'Question: something?\n\nAnswer:\n');

		// One wake for the new file, then silence — re-waking the asker about
		// its own unanswered question is noise.
		expect((await poll('watcher')).woke).toBe(true);
		expect((await poll('watcher')).woke).toBe(false);
	});

	it('gives roles without a random wake a scheduled way back to life', async () => {
		// 0.03 minutes ~= 1.8s, so the safety net fires inside the test timeout.
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0.03 } });

		const result = await poll('agent-a');

		expect(result.woke).toBe(true);
		expect(result.stdout).toContain('MAILBOX RE-CHECK');
	});

	it('runs a themed sweep for proactive roles', async () => {
		tree.addAgent('sweeper', {
			config: {
				min_wait_minutes: 0.03,
				max_wait_minutes: 0.03,
				sweep: 'nit sweep',
				mission_chance: 1,
				random_tasks: ['Rename bounty']
			}
		});

		const result = await poll('sweeper');

		expect(result.woke).toBe(true);
		expect(result.stdout).toContain('NIT SWEEP TRIGGERED');
		expect(result.stdout).toContain('Rename bounty');
	});

	it('writes a heartbeat while it waits', async () => {
		tree.addAgent('agent-a', { config: { fallback_wake_minutes: 0 } });

		await poll('agent-a', { timeoutMs: 2000 });

		expect(tree.exists('health/heartbeats/agent-a.json')).toBe(true);
		expect(JSON.parse(tree.read('health/heartbeats/agent-a.json'))).toMatchObject({ agent: 'agent-a' });
	});
});
