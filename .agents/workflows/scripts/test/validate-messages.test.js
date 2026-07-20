import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree, message } from './utils/workflowTree.js';

/**
 * Envelope repair is deliberately non-destructive. Quarantining a message the
 * team still needs is worse than the missing metadata, and a rule change would
 * otherwise sweep an entire live mailbox into the dead-letter folder.
 */
describe('validate-messages', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
		tree.addAgent('akvj-developer');
		tree.addAgent('nitpicker');
	});

	afterEach(() => {
		tree.cleanup();
	});

	const validate = (extra = []) => tree.run('validate-messages.js', [tree.workflow, ...extra]);

	it('leaves a valid envelope untouched', () => {
		const original = message({ type: 'task', from: 'team-lead', to: 'akvj-developer' });
		tree.write('slack/akvj-developer/[TASK]-1-x.md', original);

		const { stdout } = validate();

		expect(stdout).toContain('1 valid');
		expect(tree.read('slack/akvj-developer/[TASK]-1-x.md')).toBe(original);
	});

	it('repairs a message with no envelope, in place', () => {
		tree.write('slack/akvj-developer/[TASK]-42-do-thing.md', '# Do the thing\n\nDetails here.\n');

		validate();
		const repaired = tree.read('slack/akvj-developer/[TASK]-42-do-thing.md');

		expect(repaired).toContain('type: task');
		expect(repaired).toContain('to: akvj-developer');
		expect(repaired).toContain('task: 42');
		expect(repaired).toContain('Details here.');
		expect(tree.list('slack/quarantine')).not.toContain('[TASK]-42-do-thing.md');
	});

	it('infers the type from the filename prefix and the sender from the type', () => {
		tree.write('mail/in/[NIT]-naming-sweep.md', '# Naming sweep\n\nItems.\n');

		validate();

		expect(tree.read('mail/in/[NIT]-naming-sweep.md')).toContain('type: nit');
		expect(tree.read('mail/in/[NIT]-naming-sweep.md')).toContain('from: nitpicker');
	});

	it('preserves other frontmatter keys while repairing', () => {
		tree.write('slack/akvj-developer/[TASK]-7-x.md', '---\nstatus: in-progress\npriority: high\n---\n\n# Task\n');

		validate();
		const repaired = tree.read('slack/akvj-developer/[TASK]-7-x.md');

		expect(repaired).toContain('type: task');
		expect(repaired).toContain('status: in-progress');
		expect(repaired).toContain('priority: high');
	});

	it('quarantines an empty file, which cannot be repaired', () => {
		tree.write('slack/akvj-developer/empty.md', '');

		const { status } = validate();

		expect(status).toBe(1);
		expect(tree.exists('slack/akvj-developer/empty.md')).toBe(false);
		expect(tree.list('slack/quarantine')).toContain('empty.md');
	});

	it('reports without changing anything when repair is disabled', () => {
		tree.write('mail/in/bare.md', '# No envelope\n');

		const { stdout, status } = validate(['--no-backfill']);

		expect(status).toBe(1);
		expect(stdout).toContain('missing "type"');
		expect(tree.read('mail/in/bare.md')).toBe('# No envelope\n');
	});

	it('exits zero when every message is valid', () => {
		tree.write('slack/akvj-developer/[TASK]-1-x.md', message({ type: 'task', from: 'team-lead', to: 'akvj-developer' }));

		expect(validate().status).toBe(0);
	});

	it('ignores general and quarantine folders', () => {
		tree.write('slack/general/team-dashboard.md', '# Team Dashboard\n');
		tree.write('slack/quarantine/broken.md', 'nonsense\n');

		validate();

		expect(tree.read('slack/general/team-dashboard.md')).toBe('# Team Dashboard\n');
		expect(tree.read('slack/quarantine/broken.md')).toBe('nonsense\n');
	});

	it('is idempotent', () => {
		tree.write('mail/in/[BUG]-thing.md', '# A bug\n');

		validate();
		const first = tree.read('mail/in/[BUG]-thing.md');
		const { stdout } = validate();

		expect(tree.read('mail/in/[BUG]-thing.md')).toBe(first);
		expect(stdout).toContain('1 valid');
	});
});
