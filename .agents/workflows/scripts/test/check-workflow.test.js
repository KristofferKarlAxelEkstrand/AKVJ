import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { WorkflowTree } from './utils/workflowTree.js';

describe('check-workflow', () => {
    let tree;

    beforeEach(() => {
        tree = new WorkflowTree();
        // Mock the sub-scripts to exit 0 by default
        fs.writeFileSync(path.join(tree.scriptsDir, 'check-references.js'), 'process.exit(0);');
        fs.writeFileSync(path.join(tree.scriptsDir, 'check-specs.js'), 'process.exit(0);');
        fs.writeFileSync(path.join(tree.scriptsDir, 'validate-messages.js'), 'process.exit(0);');
    });

    afterEach(() => {
        tree.cleanup();
    });

    it('exits 0 when all sub-checks pass', () => {
        const { status, stdout } = tree.run('check-workflow.js', [tree.workflow]);
        expect(status).toBe(0);
        expect(stdout).toContain('Workflow checks passed');
    });

    it('exits 1 with failed labels when any sub-check fails', () => {
        fs.writeFileSync(path.join(tree.scriptsDir, 'check-specs.js'), 'process.exit(1);');
        const { status, stdout } = tree.run('check-workflow.js', [tree.workflow]);
        expect(status).toBe(1);
        expect(stdout).toContain('Workflow checks failed: specs');
    });

    it('handles default/custom workflow argument', () => {
        // Output the second arg to stdout to verify it gets passed
        fs.writeFileSync(path.join(tree.scriptsDir, 'check-specs.js'), 'console.log("workflow arg:", process.argv[2]); process.exit(0);');
        const { status, stdout } = tree.run('check-workflow.js', ['custom-flow']);
        expect(status).toBe(0);
        expect(stdout).toContain('workflow arg: custom-flow');
    });

    it('inherits stdio so sub-checks can print directly', () => {
        const content = fs.readFileSync(path.resolve(__dirname, '../check-workflow.js'), 'utf8');
        expect(content).toContain("stdio: 'inherit'");
    });
});
