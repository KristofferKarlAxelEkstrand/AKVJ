import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { WorkflowTree, taskFile } from './utils/workflowTree.js';

/**
 * Liveness reporting, which used to be an agent's job.
 *
 * The Health Inspector spent a CLI turn every 40–50 minutes computing these
 * numbers, and its own prompt admitted the one thing it could not do: tell a
 * busy agent from a dead one, because heartbeat age was its only signal. The
 * pid in the heartbeat settles that, and a script can check it for free.
 */
describe('health reporting', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	/** A heartbeat for an agent, optionally from a process that no longer exists. */
	const heartbeat = (agent, { pid = process.pid, ageSeconds = 0 } = {}) => tree.write(`health/heartbeats/${agent}.json`, JSON.stringify({ ts: Date.now() - ageSeconds * 1000, agent, display: agent, pid }));

	/** A pid that is certainly not running. */
	const deadPid = () => {
		let candidate = 999_999;
		while (candidate > 2) {
			try {
				process.kill(candidate, 0);
				candidate -= 1;
			} catch {
				return candidate;
			}
		}
		return 999_999;
	};

	describe('health-report.js', () => {
		const run = (env = {}) => tree.run('health-report.js', [tree.workflow], env);

		const latestReport = () => {
			const reports = tree.list('health/reports').filter(name => name.startsWith('[HEALTH-REPORT]-'));
			return tree.read(`health/reports/${reports.at(-1)}`);
		};

		it('treats a dead poller pid as mid-turn, not down', () => {
			// Heartbeats are only written while asleep. On wake the poller exits
			// and leaves a dead pid — that is every working turn, not a death.
			tree.addAgent('agent-a');
			heartbeat('agent-a', { pid: deadPid(), ageSeconds: 1 });

			const { status } = run();

			expect(status).toBe(0);
			expect(latestReport()).toContain('mid-turn');
			expect(latestReport()).not.toContain('✗ down');
		});

		it('calls the whole team down when there is no tmux session', () => {
			// An orphan poller keeps its heartbeat fresh after the session is
			// gone, so a live pid here is not evidence of a running team.
			tree.addAgent('agent-a');
			heartbeat('agent-a', { pid: process.pid, ageSeconds: 1 });

			const { status } = run({ AKVJ_HEALTH_SESSION: '0' });

			expect(status).toBe(1);
			expect(latestReport()).toContain('Team is not running');
		});

		it('calls an agent up while its poller is alive', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a', { ageSeconds: 10 });

			const { status } = run();

			expect(status).toBe(0);
			expect(latestReport()).toContain('✓');
			expect(latestReport()).not.toContain('mid-turn');
		});

		it('calls an agent down when a legacy heartbeat (no pid) is stale', () => {
			tree.addAgent('agent-a');
			tree.write(
				'health/heartbeats/agent-a.json',
				JSON.stringify({ ts: Date.now() - 600_000, agent: 'agent-a', display: 'agent-a' })
			);

			const { status } = run();

			expect(status).toBe(1);
			expect(latestReport()).toContain('✗ down');
		});

		it('ignores disabled agents when deciding whether the team is healthy', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.addAgent('retired', { config: { enabled: false } });
			heartbeat('retired', { pid: deadPid() });

			expect(run().status).toBe(0);
		});

		it('keeps only the newest three snapshots', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');

			for (let index = 0; index < 5; index++) {
				run();
			}

			expect(tree.list('health/reports').filter(name => name.startsWith('[HEALTH-REPORT]-'))).toHaveLength(3);
		});

		it('reports stalled work and queue depth', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.write('tasks/todo/500-old.md', taskFile({ title: 'Old thing' }));
			tree.age('tasks/todo/500-old.md', 45);

			run();

			expect(latestReport()).toContain('500-old.md');
			expect(latestReport()).toContain('Tasks in tasks/todo/: 1');
		});
	});

	describe('agents-status.js', () => {
		const run = (env = {}) => tree.run('agents-status.js', [tree.workflow], env);

		it('exits non-zero and names the agent when one is down', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.addAgent('agent-b');
			tree.write(
				'health/heartbeats/agent-b.json',
				JSON.stringify({ ts: Date.now() - 600_000, agent: 'agent-b', display: 'agent-b' })
			);

			const { stdout, status } = run();

			expect(status).toBe(1);
			expect(stdout).toContain('agent-b');
			expect(stdout).toContain('DOWN');
		});

		it('shows busy when the poller pid is gone mid-turn', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a', { pid: deadPid() });

			const { stdout, status } = run();

			expect(status).toBe(0);
			expect(stdout).toContain('busy');
			expect(stdout).not.toContain('DOWN');
		});

		it('exits zero when everyone is accounted for', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');

			const { stdout, status } = run();

			expect(status).toBe(0);
			expect(stdout).toContain('All 1 enabled agents accounted for');
		});

		it('shows the task an agent is carrying, read from the task file', () => {
			// Under peer-to-peer handoffs the task file is the only
			// authoritative record of ownership — messages move attention, not
			// state.
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.write('tasks/working-on/512-thing.md', taskFile({ status: 'in-progress', assignee: 'agent-a' }));

			expect(run().stdout).toContain('512');
		});

		it('calls every agent down when there is no tmux session, however fresh the heartbeat', () => {
			// The pollers are background tasks of each agent's harness, not
			// children of a pane, so stopping the team leaves them alive and
			// still writing heartbeats with a live pid. The session outranks
			// them: pid-based liveness alone reported a stopped team as up.
			tree.addAgent('agent-a');
			heartbeat('agent-a', { pid: process.pid, ageSeconds: 1 });

			const { stdout, status } = run({ AKVJ_HEALTH_SESSION: '0' });

			expect(status).toBe(1);
			expect(stdout).toContain('not running');
			expect(stdout).toMatch(/agent-a\s+DOWN/);
		});
	});

	describe('agents-status.js --summary', () => {
		const run = () => tree.run('agents-status.js', [tree.workflow, '--summary']);

		/** An uptime.log restart entry, aged in minutes. */
		const restart = (agent, minutesAgo) => ({ ts: new Date(Date.now() - minutesAgo * 60_000).toISOString(), agent, event: 'restart', detail: '' });

		const uptimeLog = (...events) => tree.write('health/uptime.log', events.map(event => JSON.stringify(event)).join('\n') + '\n');

		it('counts only agents whose poller is alive as up', () => {
			// A dead poller pid is mid-turn (busy), not down — so down stays 0.
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.addAgent('agent-b');
			heartbeat('agent-b', { pid: deadPid() });

			const { stdout } = run();

			expect(stdout).toContain('team\t1\t2\t0\t0\t0');
			expect(stdout).not.toMatch(/^down\tagent-b\t/m);
		});

		it('reports an open alert for an agent that otherwise looks up', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.write('health/alerts/agent-a.json', JSON.stringify({ agent: 'agent-a', reason: 'flapping' }));

			expect(run().stdout).toContain('alert\tagent-a\tflapping');
		});

		it('does not repeat an alert for an agent already listed as down', () => {
			tree.addAgent('agent-a');
			tree.write(
				'health/heartbeats/agent-a.json',
				JSON.stringify({ ts: Date.now() - 600_000, agent: 'agent-a', display: 'agent-a' })
			);
			tree.write('health/alerts/agent-a.json', JSON.stringify({ agent: 'agent-a', reason: 'flapping' }));

			const { stdout } = run();

			expect(stdout).not.toContain('alert\tagent-a');
			expect(stdout).toContain('team\t0\t1\t1\t1\t0');
		});

		it('flags an agent restarted three times inside the flap window', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			uptimeLog(restart('agent-a', 1), restart('agent-a', 3), restart('agent-a', 10));

			expect(run().stdout).toContain('flap\tagent-a\t3');
		});

		it('ignores restarts that fall outside the flap window', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			uptimeLog(restart('agent-a', 30), restart('agent-a', 40), restart('agent-a', 50));

			expect(run().stdout).not.toContain('flap');
		});

		it('survives a torn uptime.log line', () => {
			tree.addAgent('agent-a');
			heartbeat('agent-a');
			tree.write('health/uptime.log', `${JSON.stringify(restart('agent-a', 1))}\n{"ts":"2026-07-2\n`);

			expect(run().status).toBe(0);
		});

		it('reports an empty team without failing', () => {
			const { stdout, status } = run();

			expect(stdout.trim()).toBe('team\t0\t0\t0\t0\t0');
			expect(status).toBe(0);
		});
	});

	describe('dashboard health banner', () => {
		it('puts a down agent at the top of the board', () => {
			tree.addAgent('agent-a', { config: { implementer: true } });
			tree.write(
				'health/heartbeats/agent-a.json',
				JSON.stringify({ ts: Date.now() - 600_000, agent: 'agent-a', display: 'agent-a' })
			);

			tree.run('generate-dashboard.js', [tree.workflow]);

			const board = tree.read('slack/general/team-dashboard.md');
			expect(board).toContain('🚨 Team Health');
			expect(board).toContain('agent-a is DOWN');
			expect(board.indexOf('Team Health')).toBeLessThan(board.indexOf('Backlog'));
		});

		it('does not flag mid-turn (dead poller pid) as DOWN on the board', () => {
			tree.addAgent('agent-a', { config: { implementer: true } });
			heartbeat('agent-a', { pid: deadPid() });

			tree.run('generate-dashboard.js', [tree.workflow]);

			const board = tree.read('slack/general/team-dashboard.md');
			expect(board).not.toContain('is DOWN');
			expect(board).toContain('All 1 agents up');
		});

		it('says the team is not running instead of counting orphan pollers as up', () => {
			tree.addAgent('agent-a', { config: { implementer: true } });
			heartbeat('agent-a', { pid: process.pid });

			tree.run('generate-dashboard.js', [tree.workflow], { AKVJ_HEALTH_SESSION: '0' });

			const board = tree.read('slack/general/team-dashboard.md');
			expect(board).toContain('Team is not running');
			expect(board).not.toContain('agents up');
		});

		it('says all clear when everyone is up', () => {
			tree.addAgent('agent-a', { config: { implementer: true } });
			heartbeat('agent-a');

			tree.run('generate-dashboard.js', [tree.workflow]);

			expect(tree.read('slack/general/team-dashboard.md')).toContain('All 1 agents up');
		});

		it('surfaces an open alert file even for an agent that looks up', () => {
			tree.addAgent('agent-a', { config: { implementer: true } });
			heartbeat('agent-a');
			fs.mkdirSync(tree.path('health/alerts'), { recursive: true });
			tree.write('health/alerts/agent-a.json', JSON.stringify({ agent: 'agent-a', reason: 'flapping' }));

			tree.run('generate-dashboard.js', [tree.workflow]);

			expect(tree.read('slack/general/team-dashboard.md')).toContain('open alert');
		});
	});
});
