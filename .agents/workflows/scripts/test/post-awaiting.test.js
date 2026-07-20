import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree } from './utils/workflowTree.js';

/**
 * `post-awaiting.js` records why an agent is idle and lets it clear that
 * status when it wakes. These checks cover argument handling, JSON output,
 * and the `--clear` path.
 */
describe('post-awaiting', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	const awaitingPath = agent => `health/awaiting/${agent}.json`;
	const awaitingJson = agent => JSON.parse(tree.read(awaitingPath(agent)));

	it('writes {agent, waitingOn, reason, since} to health/awaiting', () => {
		const before = Date.now();
		const { status } = tree.run('post-awaiting.js', [
			tree.workflow,
			'utility-developer',
			'team-lead',
			'blocked on review'
		]);
		const after = Date.now();

		expect(status).toBe(0);
		expect(tree.exists(awaitingPath('utility-developer'))).toBe(true);
		expect(awaitingJson('utility-developer')).toMatchObject({
			agent: 'utility-developer',
			waitingOn: ['team-lead'],
			reason: 'blocked on review'
		});
		expect(awaitingJson('utility-developer').since).toBeGreaterThanOrEqual(before);
		expect(awaitingJson('utility-developer').since).toBeLessThanOrEqual(after);
	});

	it('splits comma-separated waitingOn values into an array', () => {
		tree.run('post-awaiting.js', [tree.workflow, 'utility-developer', 'team-lead, qa-reviewer', 'waiting']);

		expect(awaitingJson('utility-developer').waitingOn).toEqual(['team-lead', 'qa-reviewer']);
	});

	it('clears an existing awaiting file with --clear', () => {
		tree.run('post-awaiting.js', [tree.workflow, 'utility-developer', 'team-lead']);
		expect(tree.exists(awaitingPath('utility-developer'))).toBe(true);

		const { stdout, status } = tree.run('post-awaiting.js', [tree.workflow, 'utility-developer', '--clear']);

		expect(status).toBe(0);
		expect(tree.exists(awaitingPath('utility-developer'))).toBe(false);
		expect(stdout).toContain('cleared for utility-developer');
	});

	it('exits 0 when --clear finds no existing file', () => {
		const { stdout, status } = tree.run('post-awaiting.js', [tree.workflow, 'utility-developer', '--clear']);

		expect(status).toBe(0);
		expect(stdout).toContain('no status to clear');
	});

	it('exits 1 with usage when arguments are missing', () => {
		const { stdout, status } = tree.run('post-awaiting.js', []);

		expect(status).toBe(1);
		expect(stdout).toContain('Usage');
	});

	it('exits 1 when waitingOn is empty after splitting', () => {
		const { stdout, status } = tree.run('post-awaiting.js', [tree.workflow, 'utility-developer', '']);

		expect(status).toBe(1);
		expect(stdout).toContain('waitingOn must contain at least one value');
	});
});
