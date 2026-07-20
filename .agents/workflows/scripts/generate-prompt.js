import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';
import { splitFrontmatter } from './lib/frontmatter.js';

/**
 * Compose an agent's full startup prompt.
 *
 * Usage:
 *   node generate-prompt.js <workflow> <agent-name>
 *
 * The prompt is assembled from four sources so that no rule is written twice:
 *   1. co-workers/<agent>.prompt.md  — what only this role does.
 *   2. co-workers/_shared/*.md       — cross-cutting rules the role opts into
 *                                      via `partials:` in its frontmatter.
 *   3. spec/README.md                — the spec index, so every agent boots
 *                                      knowing which specs exist and which are
 *                                      binding. The index only; spec bodies are
 *                                      read on demand.
 *   4. This script                   — identity line and the wake mechanism,
 *                                      which are derived from the JSON config.
 *
 * The composed text is what run-team feeds to the CLI (devin --prompt-file,
 * claude via stdin), so the agent starts with its complete instructions in
 * context — there is no file for it to go and read, and nothing can drift
 * between the prompt it was launched with and the prompt on disk.
 *
 * Output: prints the prompt to stdout (run-team captures it).
 */

const workflow = process.argv[2] || DEFAULT_WORKFLOW;
const agentName = process.argv[3];

if (!agentName) {
    console.error('Usage: node generate-prompt.js <workflow> <agent-name>');
    process.exit(1);
}

const workflowRoot = path.join(REPO_ROOT, '.agents/workflows', workflow);
const coWorkersDir = path.join(workflowRoot, 'co-workers');
const configPath = path.join(coWorkersDir, `${agentName}.prompt.json`);
const promptPath = path.join(coWorkersDir, `${agentName}.prompt.md`);
const sharedDir = path.join(coWorkersDir, '_shared');

for (const [label, target] of [['Config', configPath], ['Prompt', promptPath]]) {
    if (!fs.existsSync(target)) {
        console.error(`${label} not found: ${target}`);
        process.exit(1);
    }
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { data: promptMeta, body: roleBody } = splitFrontmatter(fs.readFileSync(promptPath, 'utf8'));

// ── Shared partials ──────────────────────────────────────────────────────

/**
 * Read the partials this role opted into, in declared order.
 *
 * An unknown name is fatal: a silently dropped partial means an agent runs
 * without a rule it was supposed to have, which is exactly the kind of gap
 * that stays invisible until it causes an incident. run-team validates every
 * agent before touching tmux, so this surfaces as a pre-flight failure.
 *
 * @param {unknown} declared
 * @returns {string[]} Partial bodies in declaration order.
 */
function readPartials(declared) {
    if (declared === undefined) {
        return [];
    }
    if (!Array.isArray(declared)) {
        console.error(`Invalid "partials" in ${promptPath}: expected a list, got ${typeof declared}`);
        process.exit(1);
    }

    return declared.map(name => {
        const partialPath = path.join(sharedDir, `${name}.md`);
        if (!fs.existsSync(partialPath)) {
            const available = fs.existsSync(sharedDir)
                ? fs.readdirSync(sharedDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')).join(', ')
                : '(none)';
            console.error(`Unknown partial "${name}" declared in ${promptPath}`);
            console.error(`Available partials: ${available}`);
            process.exit(1);
        }
        return splitFrontmatter(fs.readFileSync(partialPath, 'utf8')).body.trim();
    });
}

const partials = readPartials(promptMeta.partials);

// ── Spec index ───────────────────────────────────────────────────────────

/**
 * The index table from spec/README.md, so every agent starts knowing which
 * specs exist and which are binding.
 *
 * Only the table ships in the prompt: the bodies are read on demand, and
 * inlining six specs would crowd out the role's own instructions. Missing or
 * unparseable index is not fatal — a workflow without specs still runs.
 *
 * @returns {string} A prompt section, or '' when there is no index to show.
 */
function readSpecIndex() {
    const indexPath = path.join(workflowRoot, 'spec', 'README.md');
    if (!fs.existsSync(indexPath)) {
        return '';
    }

    // The `## Index` section only — spec/README.md also documents statuses and
    // frontmatter in tables of their own, and gluing all of them together reads
    // as one malformed table.
    const lines = fs.readFileSync(indexPath, 'utf8').split(/\r?\n/);
    const indexStart = lines.findIndex(line => /^##\s+Index\s*$/i.test(line));
    if (indexStart === -1) {
        return '';
    }
    const tableRows = [];
    for (const line of lines.slice(indexStart + 1)) {
        if (line.startsWith('| ')) {
            tableRows.push(line);
        } else if (tableRows.length > 0) {
            break;
        }
    }
    if (tableRows.length === 0) {
        return '';
    }

    return [
        '## Specs On Disk',
        '',
        `Indexed in \`.agents/workflows/${workflow}/spec/README.md\`. Paths are relative to that folder.`,
        '',
        ...tableRows,
        '',
        'Only `approved` specs are binding. Read the one your work touches — do not work from this table alone.'
    ].join('\n');
}

const specIndex = readSpecIndex();

// ── Identity ─────────────────────────────────────────────────────────────

const display = config.display || agentName;
// Display names like "The Overseer" already carry an article; "Team Lead" needs one.
const identity = /^(the|a|an) /i.test(display) ? display : `the ${display}`;

// ── Wake mechanism ───────────────────────────────────────────────────────

const waitCommand = `node .agents/workflows/scripts/await-messages.js ${workflow} ${agentName}`;
const sweepName = config.sweep || 'sweep';

// Keep this decision in sync with readRoleConfig in await-messages.js:
// explicit random_wake: true forces a sweep; explicit random_wake: false disables it.
const hasRandomWake = config.random_wake === true || (
    config.random_wake !== false &&
    config.min_wait_minutes !== undefined &&
    config.max_wait_minutes !== undefined
);

// Default timer values mirror await-messages.js defaults, so the description is
// always well-formed even when random_wake: true is set without explicit timers.
const minWaitMinutes = config.min_wait_minutes ?? 10;
const maxWaitMinutes = config.max_wait_minutes ?? 20;
const fallbackWakeMinutes = config.fallback_wake_minutes ?? 60;

function wakeDescription() {
    if (hasRandomWake) {
        return (
            `This watches your assigned folders and wakes you either (1) the moment new mail arrives, ` +
            `or (2) on a random ~${minWaitMinutes}–${maxWaitMinutes} minute ${sweepName} timer. ` +
            `Both are expected work, not idle time. On a timer wake it may print a ` +
            `🎲 SPECIAL MISSION line — an optional themed focus for that one sweep; ` +
            `honour it if it fits, ignore it if real work is waiting.`
        );
    }
    if (fallbackWakeMinutes > 0) {
        return (
            `This watches your assigned folders and wakes you the moment new mail arrives. ` +
            `It also performs a slow safety-net re-check so a missed message can never leave you ` +
            `unreachable — waking to an empty mailbox is fine, just go back to sleep.`
        );
    }
    return `This watches your assigned folders and wakes you the moment new mail arrives.`;
}

// ── Compose ──────────────────────────────────────────────────────────────

const sections = [
    `You are ${identity}.`,
    roleBody.trim(),
    ...partials,
    specIndex,
    ['## Your Wake Command', '', 'End every cycle with this, in the background:', '', `    ${waitCommand}`, '', wakeDescription()].join('\n')
];

process.stdout.write(sections.filter(Boolean).join('\n\n') + '\n');
