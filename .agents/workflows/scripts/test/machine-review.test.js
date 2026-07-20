import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { WorkflowTree, taskFile } from './utils/workflowTree.js';

describe('machine-review.js', () => {
    let tree;
    let fakeBinDir;

    beforeEach(() => {
        tree = new WorkflowTree();
        fakeBinDir = path.join(tree.rootDir, 'fake-bin');
        fs.mkdirSync(fakeBinDir, { recursive: true });
    });

    afterEach(() => {
        tree.cleanup();
    });

    function mockNpm(scriptContent) {
        const npmPath = path.join(fakeBinDir, 'npm');
        fs.writeFileSync(npmPath, `#!/usr/bin/env node\n${scriptContent}`);
        fs.chmodSync(npmPath, 0o755);
    }

    it('fails when task-id is missing', () => {
        const { status, stdout } = tree.run('machine-review.js', [tree.workflow]);
        expect(status).toBe(1);
        expect(stdout).toContain('Usage: node machine-review.js <workflow> <task-id>');
    });

    it('fails when task is not found', () => {
        const { status, stdout } = tree.run('machine-review.js', [tree.workflow, '999']);
        expect(status).toBe(1);
        expect(stdout).toContain('No task file found for id 999');
    });

    it('fails when task does not have review: machine', () => {
        tree.write('tasks/todo/123-some-task.md', taskFile({ title: 'A task' }) + 'review: human\n');
        const { status, stdout } = tree.run('machine-review.js', [tree.workflow, '123']);
        expect(status).toBe(1);
        expect(stdout).toContain('is not marked "review: machine" — send it to the QA Reviewer');
    });

    it('handles review: [machine, other] array and passes when all checks pass', () => {
        tree.write('tasks/working-on/124-task-array.md', '---\nstatus: in-progress\nreview:\n  - machine\n  - other\n---\n\n# Array task\n');
        
        mockNpm('process.exit(0);');

        const { status, stdout } = tree.run('machine-review.js', [tree.workflow, '124'], { 
            PATH: `${fakeBinDir}:${process.env.PATH}` 
        });
        
        expect(status).toBe(0);
        expect(stdout).toContain('approved — wrote');
        
        const messages = tree.list('slack/team-lead');
        expect(messages).toContain('[APPROVED]-124-task-array.md');
        const content = tree.read(`slack/team-lead/[APPROVED]-124-task-array.md`);
        expect(content).toContain('Verified by `machine-review.js`');
    });

    it('writes [REJECTED] with output when a check fails', () => {
        tree.write('tasks/todo/125-failing.md', '---\nstatus: in-progress\nreview: machine\n---\n\n# Failing task\n');
        
        mockNpm(`
            const args = process.argv.slice(2).join(' ');
            if (args === 'run test') {
                console.log('Test output line 1');
                console.log('Test output line 2');
                process.exit(1);
            }
            process.exit(0);
        `);

        const { status, stdout } = tree.run('machine-review.js', [tree.workflow, '125'], { 
            PATH: `${fakeBinDir}:${process.env.PATH}` 
        });
        
        expect(status).toBe(1);
        expect(stdout).toContain('rejected — wrote');
        
        const messages = tree.list('slack/team-lead');
        expect(messages).toContain('[REJECTED]-125-failing.md');
        
        const content = tree.read(`slack/team-lead/[REJECTED]-125-failing.md`);
        expect(content).toContain('Rejected — 1 of 3 checks failed');
        expect(content).toContain('## tests (`npm run test`)');
        expect(content).toContain('Test output line 1');
        expect(content).toContain('Test output line 2');
    });
});
