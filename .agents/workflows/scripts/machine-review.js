import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';
import { splitFrontmatter } from './lib/frontmatter.js';
import { writeMessage } from './lib/message.js';

/**
 * Verdict-by-verification for tasks that do not need a human-style review.
 *
 * Usage:
 *   node machine-review.js <workflow> <task-id>
 *
 * QA is this team's serializing gate, and the sweep log records it stalling
 * repeatedly with a twenty-plus backlog while the reviewer worked through
 * rename sweeps one at a time. Those tasks — formatting, naming, test-only
 * changes — have no design to judge: either the suite is green and the change
 * is confined to what the task claimed, or it is not. That is a script's job.
 *
 * A task opts in with `review: machine` in its frontmatter, which only the Team
 * Lead sets and only for the classes listed in the collaboration protocol.
 * Anything touching product behaviour goes to the QA Reviewer as before.
 *
 * On green this writes the same `approved` message QA would, from
 * `machine-gate`, so the Team Lead's loop and the dashboard need no special
 * case. On red it writes `rejected` with the failing command's output.
 */

const workflow = process.argv[2] || DEFAULT_WORKFLOW;
const taskId = process.argv[3];

if (!taskId) {
    console.error('Usage: node machine-review.js <workflow> <task-id>');
    process.exit(1);
}

const workflowRoot = path.join(REPO_ROOT, '.agents/workflows', workflow);

/** Commands every machine review must pass. Ordered cheapest-first. */
const CHECKS = [
    ['lint', ['run', 'lint']],
    ['tests', ['run', 'test']],
    ['workflow', ['run', 'agents:check']]
];

/**
 * Find the task file in whichever kanban folder currently holds it.
 *
 * @returns {{filePath: string, data: Record<string, unknown>} | null}
 */
function findTask() {
    for (const folder of ['tasks/working-on', 'tasks/todo', 'tasks/done']) {
        const dir = path.join(workflowRoot, folder);
        let entries;
        try {
            entries = fs.readdirSync(dir);
        } catch {
            continue;
        }
        const match = entries.find(name => name.startsWith(`${taskId}-`) && name.endsWith('.md'));
        if (match) {
            const filePath = path.join(dir, match);
            const { data } = splitFrontmatter(fs.readFileSync(filePath, 'utf8'));
            return { filePath, data };
        }
    }
    return null;
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @returns {string}
 */
function scalar(data, key) {
    const value = data[key];
    return String((Array.isArray(value) ? value[0] : value) ?? '').trim();
}

const task = findTask();
if (!task) {
    console.error(`No task file found for id ${taskId}`);
    process.exit(1);
}

if (scalar(task.data, 'review') !== 'machine') {
    console.error(`Task ${taskId} is not marked "review: machine" — send it to the QA Reviewer.`);
    process.exit(1);
}

const slug = path.basename(task.filePath, '.md');
const failures = [];

for (const [label, args] of CHECKS) {
    process.stdout.write(`▸ ${label} … `);
    const result = spawnSync('npm', args, { cwd: REPO_ROOT, encoding: 'utf8' });
    if (result.status === 0) {
        console.log('pass');
        continue;
    }
    console.log('FAIL');
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim().split('\n').slice(-25).join('\n');
    failures.push({ label, command: `npm ${args.join(' ')}`, output });
}

const verdict = failures.length === 0 ? 'approved' : 'rejected';
const messagePath = path.join(workflowRoot, 'slack/team-lead', `[${verdict.toUpperCase()}]-${slug}.md`);

const body =
    failures.length === 0
        ? [
              `# Machine review: ${slug}`,
              '',
              `Verified by \`machine-review.js\` — ${CHECKS.map(([label]) => label).join(', ')} all green.`,
              '',
              'No human review was required: this task is `review: machine`, a class with no design',
              'judgement to make. Archive it.'
          ].join('\n')
        : [
              `# Machine review: ${slug}`,
              '',
              `Rejected — ${failures.length} of ${CHECKS.length} checks failed.`,
              '',
              ...failures.flatMap(failure => [`## ${failure.label} (\`${failure.command}\`)`, '', '```', failure.output, '```', '']),
              'Return the task to the developer with this output attached.'
          ].join('\n');

writeMessage(messagePath, { type: verdict, from: 'machine-gate', to: 'team-lead', task: taskId }, body);

console.log(`\n${verdict === 'approved' ? '✓' : '✗'} ${verdict} — wrote ${path.relative(REPO_ROOT, messagePath)}`);
process.exit(verdict === 'approved' ? 0 : 1);
