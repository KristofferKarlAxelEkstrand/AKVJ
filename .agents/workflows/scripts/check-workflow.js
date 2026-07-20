#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';

/**
 * Every workflow health check, in one command.
 *
 * Usage:
 *   node check-workflow.js [workflow]
 *
 * The individual checkers each answer one question and are useful alone, but
 * nobody remembers three commands during a cleanup pass. This runs all of them,
 * keeps going after a failure so one broken reference does not hide a broken
 * spec, and exits non-zero if any of them failed.
 */

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const workflow = process.argv[2] || DEFAULT_WORKFLOW;

const CHECKS = [
    ['references', 'check-references.js', []],
    ['specs', 'check-specs.js', []],
    // Gate only — do not mutate live mailboxes. The monitor repairs with default backfill.
    ['messages', 'validate-messages.js', ['--no-backfill']]
];

const failed = [];

for (const [label, script, extraArgs] of CHECKS) {
    console.log(`\n── ${label} ─────────────────────────────────────────`);
    const result = spawnSync(process.execPath, [path.join(scriptsDir, script), workflow, ...extraArgs], {
        cwd: REPO_ROOT,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        failed.push(label);
    }
}

console.log('');
if (failed.length > 0) {
    console.error(`Workflow checks failed: ${failed.join(', ')}`);
    process.exit(1);
}
console.log(`Workflow checks passed for ${workflow}.`);
