import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree, message, taskFile } from './utils/workflowTree.js';

/**
 * The stalled-work detector decides who gets restarted when something sits
 * untouched. Its previous incarnation restarted team-lead for any aged mail and
 * overseer for any aged task, on a repeating cooldown — and since a non-empty
 * backlog is this team's normal state, that restarted both every two minutes
 * indefinitely, guaranteeing neither could ever drain it.
 */
describe('detect-stalled-work', () => {
	let tree;
	const STALLED_MINUTES = 30;

	/** Run the detector with cooldown disabled unless a test wants it. */
	const detect = (cooldown = 0) => tree.run('detect-stalled-work.js', [tree.workflow, String(cooldown), '600']);

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	it('nudges the agent named in the envelope, not a hardcoded fallback', () => {
		tree.write('mail/in/[NIT]-naming.md', message({ type: 'nit', from: 'nitpicker', to: 'nitpicker' }));
		tree.age('mail/in/[NIT]-naming.md', STALLED_MINUTES);

		const { stdout } = detect();

		expect(stdout).toContain('nitpicker');
		expect(tree.exists('health/restart-requests/nitpicker.json')).toBe(true);
		expect(tree.exists('health/restart-requests/team-lead.json')).toBe(false);
	});

	it('routes untriaged mail with no recipient to the team lead', () => {
		tree.write('mail/in/feature-request.md', message({ type: 'feature', from: 'human' }));
		tree.age('mail/in/feature-request.md', STALLED_MINUTES);

		detect();

		expect(tree.exists('health/restart-requests/team-lead.json')).toBe(true);
	});

	it('ignores a backlog task nobody has been assigned', () => {
		tree.write('tasks/todo/400-unassigned.md', taskFile({ assignee: 'none' }));
		tree.age('tasks/todo/400-unassigned.md', STALLED_MINUTES);

		detect();

		expect(tree.list('health/restart-requests')).toEqual([]);
	});

	it('nudges the assignee of a stalled todo task', () => {
		tree.write('tasks/todo/401-assigned.md', taskFile({ assignee: 'akvj-developer', status: 'in-progress' }));
		tree.age('tasks/todo/401-assigned.md', STALLED_MINUTES);

		detect();

		expect(tree.exists('health/restart-requests/akvj-developer.json')).toBe(true);
	});

	it('ignores a task already in flight', () => {
		tree.write('tasks/todo/402-inflight.md', taskFile({ assignee: 'mainframe-developer' }));
		tree.write('tasks/working-on/402-inflight.md', taskFile({ assignee: 'mainframe-developer' }));
		tree.age('tasks/todo/402-inflight.md', STALLED_MINUTES);

		detect();

		expect(tree.list('health/restart-requests')).toEqual([]);
	});

	it('ignores anything younger than the stalled threshold', () => {
		tree.write('mail/in/fresh.md', message({ type: 'feature', from: 'human' }));

		detect();

		expect(tree.list('health/restart-requests')).toEqual([]);
	});

	it('nudges once per item, not on every pass', () => {
		tree.write('mail/in/[NIT]-naming.md', message({ type: 'nit', from: 'nitpicker', to: 'nitpicker' }));
		tree.age('mail/in/[NIT]-naming.md', STALLED_MINUTES);

		const first = detect();
		expect(first.stdout).toContain('Restart request for nitpicker');

		// The item is still stalled on subsequent passes.
		const second = detect();
		const third = detect();

		expect(second.stdout).toContain('Already nudged');
		expect(third.stdout).toContain('Already nudged');
		expect(second.stdout).not.toContain('Restart request for');
		expect(third.stdout).not.toContain('Restart request for');
	});

	it('nudges again when the item is edited, since that is new information', () => {
		tree.write('mail/in/[NIT]-naming.md', message({ type: 'nit', from: 'nitpicker', to: 'nitpicker' }));
		tree.age('mail/in/[NIT]-naming.md', STALLED_MINUTES);
		detect();

		tree.write('mail/in/[NIT]-naming.md', message({ type: 'nit', from: 'nitpicker', to: 'nitpicker', body: 'Revised.' }));
		tree.age('mail/in/[NIT]-naming.md', STALLED_MINUTES);

		expect(detect().stdout).toContain('Restart request for nitpicker');
	});

	it('respects the per-agent cooldown', () => {
		tree.write('mail/in/a.md', message({ type: 'feature', from: 'human' }));
		tree.write('mail/in/b.md', message({ type: 'feature', from: 'human' }));
		tree.age('mail/in/a.md', STALLED_MINUTES);
		tree.age('mail/in/b.md', STALLED_MINUTES);

		const { stdout } = detect(120);

		// Both belong to team-lead; the second is held back by the cooldown.
		expect(stdout).toContain('Cooldown active for team-lead');
	});
});
