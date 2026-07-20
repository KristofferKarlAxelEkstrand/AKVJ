import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree } from './utils/workflowTree.js';

/**
 * Prompt composition exists because cross-cutting rules were copy-pasted across
 * nine prompts (the two developer prompts were 36 of 43 lines identical), so a
 * shared rule had to be edited in nine places and drifted between them.
 */
describe('generate-prompt', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
		tree.addPartial('git-commits', '## Git\n\nThe human owns commits.\n');
		tree.addPartial('sleep-step', '## Sleep\n\nBackground, then end your turn.\n');
	});

	afterEach(() => {
		tree.cleanup();
	});

	const generate = agent => tree.run('generate-prompt.js', [tree.workflow, agent]);

	it('includes the role body and every declared partial', () => {
		tree.addAgent('dev', {
			config: { display: 'AKVJ Developer' },
			prompt: '---\npartials: [git-commits, sleep-step]\n---\n\n# AKVJ Developer\n\nKeep changes inside akvj/.\n'
		});

		const { stdout, status } = generate('dev');

		expect(status).toBe(0);
		expect(stdout).toContain('Keep changes inside akvj/.');
		expect(stdout).toContain('The human owns commits.');
		expect(stdout).toContain('Background, then end your turn.');
	});

	it('opens with the display name, articled correctly', () => {
		tree.addAgent('dev', { config: { display: 'AKVJ Developer' }, prompt: '# x\n' });
		expect(generate('dev').stdout).toMatch(/^You are the AKVJ Developer\./);

		tree.addAgent('boss', { config: { display: 'The Overseer' }, prompt: '# x\n' });
		expect(generate('boss').stdout).toMatch(/^You are The Overseer\./);
	});

	it('omits partials a role did not ask for', () => {
		tree.addAgent('dev', { prompt: '---\npartials: [sleep-step]\n---\n\n# Dev\n' });

		const { stdout } = generate('dev');

		expect(stdout).toContain('Background, then end your turn.');
		expect(stdout).not.toContain('The human owns commits.');
	});

	it('fails loudly on an unknown partial rather than silently dropping a rule', () => {
		tree.addAgent('dev', { prompt: '---\npartials: [does-not-exist]\n---\n\n# Dev\n' });

		const { stdout, status } = generate('dev');

		expect(status).not.toBe(0);
		expect(stdout).toContain('Unknown partial "does-not-exist"');
		expect(stdout).toContain('Available partials');
	});

	it('leaves no unresolved directives in the output', () => {
		tree.addAgent('dev', { prompt: '---\npartials: [git-commits]\n---\n\n# Dev\n' });

		const { stdout } = generate('dev');

		expect(stdout).not.toMatch(/^---$/m);
		expect(stdout).not.toContain('partials:');
	});

	it('describes a timed sweep for proactive roles', () => {
		tree.addAgent('sweeper', {
			config: { min_wait_minutes: 15, max_wait_minutes: 30, sweep: 'nit sweep' },
			prompt: '# Sweeper\n'
		});

		const { stdout } = generate('sweeper');

		expect(stdout).toContain('~15–30 minute nit sweep timer');
		expect(stdout).toContain('SPECIAL MISSION');
	});

	it('describes the safety net for roles with no timed sweep', () => {
		tree.addAgent('reactive', { prompt: '# Reactive\n' });

		const { stdout } = generate('reactive');

		expect(stdout).toContain('safety-net');
		expect(stdout).not.toContain('SPECIAL MISSION');
	});

	it('omits the safety-net claim when fallback_wake_minutes is 0', () => {
		tree.addAgent('reactive', { config: { fallback_wake_minutes: 0 }, prompt: '# Reactive\n' });

		const { stdout } = generate('reactive');

		expect(stdout).not.toContain('safety-net');
		expect(stdout).toContain('wakes you the moment new mail arrives');
	});

	it('always ends with the wake command', () => {
		tree.addAgent('dev', { prompt: '# Dev\n' });

		const { stdout } = generate('dev');

		expect(stdout).toContain(`node .agents/workflows/scripts/await-messages.js ${tree.workflow} dev`);
	});

	it('fails when the role prompt is missing', () => {
		tree.write('co-workers/ghost.prompt.json', '{"display":"Ghost"}');

		expect(generate('ghost').status).not.toBe(0);
	});
});
