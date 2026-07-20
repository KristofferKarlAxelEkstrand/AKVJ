import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree, taskFile } from './utils/workflowTree.js';

describe('archive-task', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	const archive = taskId => tree.run('archive-task.js', [tree.workflow, taskId]);

	it('moves a task from working-on to done and marks it done', () => {
		tree.write('tasks/working-on/123-add-knob.md', taskFile({ status: 'in-progress', assignee: 'akvj-developer' }));

		const { status } = archive('123');

		expect(status).toBe(0);
		expect(tree.exists('tasks/working-on/123-add-knob.md')).toBe(false);
		expect(tree.read('tasks/done/123-add-knob.md')).toContain('status: done');
	});

	it('accepts the id with an approved prefix or a full filename', () => {
		tree.write('tasks/working-on/200-a.md', taskFile());
		expect(archive('[APPROVED]-200-a.md').status).toBe(0);
		expect(tree.exists('tasks/done/200-a.md')).toBe(true);
	});

	it('does not confuse a numeric id with a longer one that starts the same way', () => {
		tree.write('tasks/working-on/20a-sub-task.md', taskFile({ title: 'Sub task' }));
		tree.write('tasks/working-on/20-parent.md', taskFile({ title: 'Parent' }));

		archive('20');

		expect(tree.exists('tasks/done/20-parent.md')).toBe(true);
		expect(tree.exists('tasks/working-on/20a-sub-task.md')).toBe(true);
	});

	it('only rewrites status inside the frontmatter, not prose in the body', () => {
		tree.write(
			'tasks/working-on/300-report.md',
			['---', 'status: in-progress', 'assignee: qa-reviewer', '---', '', '# Task 300', '', 'The endpoint returns status: pending when idle.', ''].join('\n')
		);

		archive('300');
		const content = tree.read('tasks/done/300-report.md');

		expect(content).toContain('status: done');
		expect(content).toContain('returns status: pending when idle.');
	});

	it('adds a status line when the frontmatter lacks one', () => {
		tree.write('tasks/working-on/301-x.md', '---\nassignee: none\n---\n\n# X\n');

		archive('301');

		expect(tree.read('tasks/done/301-x.md')).toContain('status: done');
	});

	it('leaves a task without frontmatter alone apart from the move', () => {
		tree.write('tasks/working-on/302-plain.md', '# Plain task\n\nNo frontmatter here.\n');

		expect(archive('302').status).toBe(0);
		expect(tree.read('tasks/done/302-plain.md')).toContain('No frontmatter here.');
	});

	it('finds tasks in todo as well as working-on', () => {
		tree.write('tasks/todo/400-from-backlog.md', taskFile());

		expect(archive('400').status).toBe(0);
		expect(tree.exists('tasks/done/400-from-backlog.md')).toBe(true);
	});

	it('is a no-op when the task is already archived', () => {
		tree.write('tasks/done/500-already.md', taskFile({ status: 'done' }));

		const { stdout, status } = archive('500');

		expect(status).toBe(0);
		expect(stdout).toContain('already in tasks/done/');
	});

	it('fails when no task matches', () => {
		const { status, stdout } = archive('999');

		expect(status).not.toBe(0);
		expect(stdout).toContain('999');
	});
});
