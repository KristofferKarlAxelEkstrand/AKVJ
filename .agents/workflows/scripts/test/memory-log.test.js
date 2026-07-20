import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree } from './utils/workflowTree.js';

/**
 * Memory is read before every wake and appended to after it, so an unbounded
 * log is a cost multiplier: one reached 216 KB and was being re-read every
 * 10-20 minutes. Compaction keeps the de-duplication value (the digest) while
 * dropping the narrative bulk.
 */
describe('memory-log', () => {
	let tree;

	beforeEach(() => {
		tree = new WorkflowTree();
		tree.addAgent('sweeper');
	});

	afterEach(() => {
		tree.cleanup();
	});

	const append = (summary, extra = []) => tree.run('memory-log.js', ['append', tree.workflow, 'sweeper', '--summary', summary, ...extra]);
	const compact = (extra = []) => tree.run('memory-log.js', ['compact', tree.workflow, 'sweeper', ...extra]);
	const log = () => tree.read('memory/sweeper/sweeper-log.md');

	it('creates a structured log on first append', () => {
		append('swept visuals, filed 2 nits');

		expect(log()).toContain('## Digest');
		expect(log()).toContain('## Recent');
		expect(log()).toContain('swept visuals, filed 2 nits');
	});

	it('records area and refs when given', () => {
		append('swept core', ['--area', 'akvj/src/js/core', '--refs', '340,341']);

		expect(log()).toContain('akvj/src/js/core');
		expect(log()).toContain('340,341');
	});

	it('keeps recent entries verbatim and folds older ones into the digest', () => {
		for (let i = 1; i <= 8; i += 1) {
			append(`sweep number ${i}`);
		}

		compact(['--keep', '3']);
		const content = log();

		const digest = content.slice(content.indexOf('## Digest'), content.indexOf('## Recent'));
		const recent = content.slice(content.indexOf('## Recent'));

		// The newest three keep their detail.
		expect(recent).toContain('sweep number 8');
		expect(recent).toContain('sweep number 6');
		expect(recent).not.toContain('sweep number 5');

		// Everything older survives as a digest line, so nothing is re-reported.
		expect(digest).toContain('sweep number 1');
		expect(digest).toContain('sweep number 5');
	});

	it('shrinks the file', () => {
		for (let i = 1; i <= 30; i += 1) {
			append(`sweep ${i} with a reasonably long summary line to give the entry some weight`);
		}
		const before = log().length;

		compact(['--keep', '5']);

		expect(log().length).toBeLessThan(before);
	});

	it('is idempotent — compacting twice changes nothing', () => {
		for (let i = 1; i <= 10; i += 1) {
			append(`sweep ${i}`);
		}

		compact(['--keep', '4']);
		const first = log();
		compact(['--keep', '4']);

		expect(log()).toBe(first);
	});

	it('does nothing when there are fewer entries than the limit', () => {
		append('only one');

		const { stdout } = compact(['--keep', '12']);

		expect(stdout).not.toContain('compacted 1');
		expect(log()).toContain('only one');
	});

	it('compacts a legacy bullet-per-sweep log', () => {
		const bullets = Array.from({ length: 40 }, (_, i) => `- 2026-07-1${i % 10} | area-${i} | filed nit ${i}`).join('\n');
		tree.write('memory/sweeper/sweeper-log.md', `# Sweeper Log\n\nRunning record.\n\n## Sweeps\n${bullets}\n`);

		const { stdout } = compact(['--keep', '5']);

		expect(stdout).toContain('compacted 35');
		expect(log()).toContain('## Digest');
		expect(log()).toContain('area-0');
		expect(log()).toContain('area-39');
	});

	it('compacts every agent at once for the monitor', () => {
		tree.addAgent('other');
		for (let i = 1; i <= 20; i += 1) {
			append(`sweep ${i}`);
			tree.run('memory-log.js', ['append', tree.workflow, 'other', '--summary', `other sweep ${i}`]);
		}

		const { stdout } = tree.run('memory-log.js', ['compact-all', tree.workflow, '--keep', '3']);

		expect(stdout).toContain('sweeper');
		expect(stdout).toContain('other');
	});

	it('keeps a copy of the original when migrating', () => {
		for (let i = 1; i <= 20; i += 1) {
			append(`sweep ${i}`);
		}

		tree.run('memory-log.js', ['migrate', tree.workflow, 'sweeper', '--keep', '3']);

		expect(tree.list('archive/memory').some(name => name.includes('sweeper'))).toBe(true);
	});
});
