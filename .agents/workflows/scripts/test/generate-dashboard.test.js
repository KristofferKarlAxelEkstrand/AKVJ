import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree, message, taskFile } from './utils/workflowTree.js';

describe('generate-dashboard', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
		// `implementer` is what earns an agent its own column on the board. It is
		// declared per config rather than hardcoded in the script, so a third
		// developer shows up without anyone remembering to edit the generator.
		tree.addAgent('akvj-developer', { config: { implementer: true } });
		tree.addAgent('mainframe-developer', { config: { implementer: true } });
		tree.addAgent('qa-reviewer');
	});

	afterEach(() => {
		tree.cleanup();
	});

	const build = () => tree.run('generate-dashboard.js', [tree.workflow]);
	const board = () => tree.read('slack/general/team-dashboard.md');

	it('lists the backlog with priorities, in task-id order', () => {
		tree.write('tasks/todo/101-first.md', taskFile({ priority: 'high', title: 'First thing' }));
		tree.write('tasks/todo/102-second.md', taskFile({ priority: 'low', title: 'Second thing' }));

		build();

		expect(board()).toContain('Backlog (2)');
		expect(board()).toContain('First thing');
		expect(board().indexOf('101-first')).toBeLessThan(board().indexOf('102-second'));
	});

	it('shows in-progress work under its assignee', () => {
		tree.write('tasks/working-on/200-x.md', taskFile({ status: 'in-progress', assignee: 'akvj-developer', title: 'Fix the thing' }));

		build();

		expect(board()).toContain('Fix the thing');
	});

	it('gives a newly declared implementer its own column, with no script change', () => {
		tree.addAgent('utility-developer', { config: { implementer: true } });
		tree.write('tasks/working-on/201-y.md', taskFile({ status: 'in-progress', assignee: 'utility-developer', title: 'Fix the tooling' }));

		build();

		expect(board()).toContain('utility-developer');
		expect(board()).toContain('Fix the tooling');
	});

	it('reads pending work from message envelopes, not filenames', () => {
		// Deliberately unconventional filename: the envelope is what counts.
		tree.write('slack/akvj-developer/anything.md', message({ type: 'task', from: 'team-lead', to: 'akvj-developer' }));
		// A non-task message must not appear as pending work.
		tree.write('slack/akvj-developer/[FEEDBACK]-nit.md', message({ type: 'feedback', from: 'qa-reviewer', to: 'akvj-developer' }));

		build();

		expect(board()).toContain('anything.md');
		expect(board()).not.toContain('[FEEDBACK]-nit.md');
	});

	it('surfaces the QA review queue', () => {
		tree.write('slack/qa-reviewer/[TASK]-review-9-x.md', message({ type: 'task', from: 'team-lead', to: 'qa-reviewer', task: '9' }));

		build();

		expect(board()).toContain('[TASK]-review-9-x.md');
	});

	it('shows queues for specialists discovered from the configs', () => {
		tree.addAgent('nitpicker');
		tree.write('slack/nitpicker/[TASK]-sweep.md', message({ type: 'task', from: 'team-lead', to: 'nitpicker' }));

		build();

		expect(board()).toContain('Other Queues');
		expect(board()).toContain('nitpicker');
	});

	it('caps the done list', () => {
		for (let i = 1; i <= 25; i += 1) {
			tree.write(`tasks/done/${i}-done.md`, taskFile({ status: 'done', title: `Done ${i}` }));
		}

		build();

		const doneSection = board().slice(board().indexOf('## ✅ Done'));
		expect(doneSection.split('\n').filter(line => line.startsWith('- **')).length).toBe(15);
	});

	it('renders an empty board without crashing', () => {
		expect(build().status).toBe(0);
		expect(board()).toContain('Backlog (0)');
		expect(board()).toContain('No tasks pending review');
	});
});
