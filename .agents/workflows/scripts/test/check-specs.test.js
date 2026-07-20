import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowTree, taskFile } from './utils/workflowTree.js';

/**
 * The spec checker is what makes "specs are the truth" more than a slogan.
 *
 * Every failure it catches has already happened here for real: eight proposal
 * documents sat in `spec/` with no way to tell which described shipped
 * behaviour, four of them described the same feature, and one completed epic
 * pointed at `featue-how-sync-…` — a typo nobody could follow. The rules below
 * are that history turned into assertions.
 */
describe('check-specs', () => {
    let tree;

    const spec = ({ id, status = 'approved', approved = '2026-07-20', title = 'A Spec', extra = '' } = {}) =>
        ['---', `id: ${id}`, `title: ${title}`, `status: ${status}`, 'owner: human', 'maintainer: overseer', `approved: ${approved}`, 'verified: 2026-07-20', extra, '---', '', `# ${title}`, ''].filter(Boolean).join('\n');

    const index = (entries = []) => ['---', 'id: readme', 'title: Spec Index', 'status: approved', 'owner: human', 'maintainer: overseer', 'approved: 2026-07-20', 'verified: 2026-07-20', '---', '', '# Specs', '', '## Index', '', '| Spec | Status | What it covers |', '| --- | --- | --- |', ...entries.map(entry => `| [${entry}](${entry}) | approved | Something |`), ''].join('\n');

    const check = () => tree.run('check-specs.js', [tree.workflow]);

    beforeEach(() => {
        tree = new WorkflowTree();
    });

    afterEach(() => {
        tree.cleanup();
    });

    it('passes a well-formed spec folder', () => {
        tree.write('spec/README.md', index(['clip-format.md']));
        tree.write('spec/clip-format.md', spec({ id: 'clip-format' }));

        const { stdout, status } = check();

        expect(status).toBe(0);
        expect(stdout).toContain('2 specs valid');
    });

    it('rejects a spec whose id does not match its filename', () => {
        tree.write('spec/README.md', index(['clip-format.md']));
        tree.write('spec/clip-format.md', spec({ id: 'clip-schema' }));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('does not match filename');
    });

    it('rejects an approved spec with no approval date', () => {
        tree.write('spec/README.md', index(['goal.md']));
        tree.write('spec/goal.md', spec({ id: 'goal', approved: '' }));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('approved" date');
    });

    it('rejects an unknown status', () => {
        tree.write('spec/README.md', index(['goal.md']));
        tree.write('spec/goal.md', spec({ id: 'goal', status: 'blessed' }));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('is not one of');
    });

    it('catches a spec missing from the index', () => {
        tree.write('spec/README.md', index([]));
        tree.write('spec/mapping.md', spec({ id: 'mapping' }));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('does not list mapping.md');
    });

    it('catches an index entry whose spec is gone', () => {
        tree.write('spec/README.md', index(['deleted.md']));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('links deleted.md');
    });

    it('rejects superseding a spec that is still live', () => {
        tree.write('spec/README.md', index(['clip-format.md', 'clip-schema.md']));
        tree.write('spec/clip-format.md', spec({ id: 'clip-format', extra: 'supersedes: [clip-schema]' }));
        tree.write('spec/clip-schema.md', spec({ id: 'clip-schema' }));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('still live in spec/');
    });

    it('requires a superseded spec to be in the archive', () => {
        tree.write('spec/README.md', index(['clip-format.md']));
        tree.write('spec/clip-format.md', spec({ id: 'clip-format', extra: 'supersedes: [clip-schema]' }));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('not in archive/superseded-specs/');
    });

    it('catches a task citing a spec that does not exist', () => {
        tree.write('spec/README.md', index(['clip-format.md']));
        tree.write('spec/clip-format.md', spec({ id: 'clip-format' }));
        tree.write('tasks/todo/501-thing.md', taskFile().replace('priority: medium', 'priority: medium\nspec: clip-schema'));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('which does not exist');
    });

    it('catches a task citing a draft spec, because only approved specs bind', () => {
        tree.write('spec/README.md', index(['clip-editor.md']));
        tree.write('spec/clip-editor.md', spec({ id: 'clip-editor', status: 'draft', approved: '' }));
        tree.write('tasks/working-on/502-thing.md', taskFile().replace('priority: medium', 'priority: medium\nspec: clip-editor'));

        const { stdout, status } = check();

        expect(status).toBe(1);
        expect(stdout).toContain('which is draft');
    });

    it('allows a task to opt out with spec: none', () => {
        tree.write('spec/README.md', index(['clip-format.md']));
        tree.write('spec/clip-format.md', spec({ id: 'clip-format' }));
        tree.write('tasks/todo/503-bump-deps.md', taskFile().replace('priority: medium', 'priority: medium\nspec: none'));

        expect(check().status).toBe(0);
    });
});
