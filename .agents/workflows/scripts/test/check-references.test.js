import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { WorkflowTree } from './utils/workflowTree.js';

/**
 * `check-references.js` is the guard against "promote then purge" rotting
 * links. These cases exercise every base it tries when resolving a backtick
 * file path and every directory it deliberately ignores.
 */
describe('check-references', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
	});

	afterEach(() => {
		tree.cleanup();
	});

	const run = (args = [tree.workflow]) => tree.run('check-references.js', args);

	it('resolves references relative to the document itself', () => {
		tree.write('spec/nested/doc.md', '# Nested\nSee `../goal.md` for context.\n');
		tree.write('spec/goal.md', '# Goal\n');

		const { stdout, status } = run();

		expect(status).toBe(0);
		expect(stdout).toContain('All 1 file references resolve.');
	});

	it('resolves repo-root-relative references', () => {
		fs.mkdirSync(path.join(tree.rootDir, 'akvj/src/js/core'), { recursive: true });
		fs.writeFileSync(path.join(tree.rootDir, 'akvj/src/js/core/AppState.js'), '');
		tree.write('spec/repo.md', '# Repo ref\nSee `akvj/src/js/core/AppState.js`.\n');

		const { stdout, status } = run();

		expect(status).toBe(0);
		expect(stdout).toContain('All 1 file references resolve.');
	});

	it('resolves workflow-root references', () => {
		tree.addAgent('test-marshal');
		tree.write('spec/workflow.md', '# Workflow ref\nSee `co-workers/test-marshal.prompt.md`.\n');

		const { stdout, status } = run();

		expect(status).toBe(0);
		expect(stdout).toContain('All 1 file references resolve.');
	});

	it('skips template placeholders', () => {
		tree.write(
			'spec/templates.md',
			'# Templates\n' +
				'- `tasks/todo/[TASK]-<task-id>.md` is a file.\n' +
				'- `co-workers/....md` is a placeholder.\n' +
				'- `mail/in/<agent>.md` is also a placeholder.\n'
		);

		const { stdout, status } = run();

		expect(status).toBe(0);
		expect(stdout).toContain('All 0 file references resolve.');
	});

	it('reports dangling references with file:line and path', () => {
		tree.write('spec/dangle.md', '# Dangle\nSee `co-workers/missing.md`.\n');

		const { stdout, status } = run();

		expect(status).toBe(1);
		expect(stdout).toContain('Dangling references (1 of 1 checked):');
		expect(stdout).toContain('spec/dangle.md:2 → co-workers/missing.md');
	});

	it('scans REPO_DOCS when they exist', () => {
		fs.mkdirSync(path.join(tree.rootDir, 'akvj/src/js/core'), { recursive: true });
		fs.writeFileSync(path.join(tree.rootDir, 'akvj/src/js/core/AppState.js'), '');
		fs.writeFileSync(
			path.join(tree.rootDir, 'AGENTS.md'),
			'# AGENTS\nSee `akvj/src/js/core/AppState.js`.\n'
		);
		tree.addAgent('test-marshal');
		tree.write('spec/ok.md', '# OK\nSee `co-workers/test-marshal.prompt.md`.\n');

		const { stdout, status } = run();

		expect(status).toBe(0);
		expect(stdout).toContain('All 2 file references resolve.');
	});

	it('does not recurse excluded directories', () => {
		tree.addAgent('test-marshal');
		tree.write('spec/ok.md', '# OK\nSee `co-workers/test-marshal.prompt.md`.\n');
		tree.write('co-workers/archive/rotten.md', '# Rotten\nSee `no/such.md`.\n');
		tree.write('mail/in/rotten.md', '# Rotten\nSee `no/such.md`.\n');

		const { stdout, status } = run();

		expect(status).toBe(0);
		expect(stdout).toContain('All 1 file references resolve.');
	});

	describe('generated output', () => {
		// The gate went red because docs correctly named clip output that only
		// exists after `npm run clips`, and that red made machine-review reject
		// sound work. Absent-because-unbuilt is not a rotted pointer.
		it('does not flag a reference to a gitignored path', () => {
			tree.initGit('akvj/src/public/projects/\n');
			tree.write('spec/generated.md', '# Generated\nRuntime clips land in `akvj/src/public/projects/default/clips/clips.json`.\n');

			const { stdout, status } = run();

			expect(status).toBe(0);
			expect(stdout).toContain('All 1 file references resolve.');
		});

		it('still flags a genuinely missing, non-ignored path', () => {
			tree.initGit('akvj/src/public/projects/\n');
			tree.write('spec/dangle.md', '# Dangle\nSee `co-workers/missing.md`.\n');

			const { stdout, status } = run();

			expect(status).toBe(1);
			expect(stdout).toContain('spec/dangle.md:2 → co-workers/missing.md');
		});

		it('flags everything when git cannot answer', () => {
			// No `initGit` — a plain temp dir is not a work tree. Failing closed
			// beats silently passing every reference in the repo.
			tree.write('spec/dangle.md', '# Dangle\nSee `co-workers/missing.md`.\n');

			const { stdout, status } = run();

			expect(status).toBe(1);
			expect(stdout).toContain('spec/dangle.md:2 → co-workers/missing.md');
		});
	});

	describe('paths the work has not created yet', () => {
		it('does not flag a product path a task names as its destination', () => {
			tree.write('tasks/working-on/410-extract.md', '# 410\nMove the loader to `mainframe/shared/mappingService.js`.\n');

			const { stdout, status } = run();

			expect(status).toBe(0);
			expect(stdout).toContain('All 0 file references resolve.');
		});

		it('still flags a task citing a missing .agents/ path', () => {
			tree.write('tasks/working-on/411-cite.md', '# 411\nFrom `.agents/workflows/developer-team/mail/in/gone.md`.\n');

			const { stdout, status } = run();

			expect(status).toBe(1);
			expect(stdout).toContain('411-cite.md:2 → .agents/workflows/developer-team/mail/in/gone.md');
		});

		it('still flags a spec citing a missing product path', () => {
			tree.initGit('');
			tree.write('spec/rot.md', '# Rot\nSee `mainframe/shared/mappingService.js`.\n');

			const { stdout, status } = run();

			expect(status).toBe(1);
			expect(stdout).toContain('spec/rot.md:2 → mainframe/shared/mappingService.js');
		});
	});

	it('switches workflow root via the first CLI argument', () => {
		const other = new WorkflowTree('other-workflow');
		try {
			other.addAgent('alice');
			other.write('README.md', '# Other\nSee `co-workers/alice.prompt.md`.\n');

			const { stdout, status } = other.run('check-references.js', [other.workflow]);

			expect(status).toBe(0);
			expect(stdout).toContain('All 1 file references resolve.');
		} finally {
			other.cleanup();
		}
	});
});
