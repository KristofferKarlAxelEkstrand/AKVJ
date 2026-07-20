import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';
import { splitFrontmatter, renderFrontmatter } from './lib/frontmatter.js';
import { parseMessage, validateMessage, listMessageFiles, MESSAGE_TYPES } from './lib/message.js';

/**
 * Keep every mailbox machine-readable.
 *
 * Usage:
 *   node validate-messages.js [workflow] [--no-backfill] [--quiet]
 *
 * Run by the health monitor (with repair) and by `agents:check` (with
 * `--no-backfill`). Two deliberate behaviours:
 *
 *  - A file with a missing or incomplete envelope is **repaired in place**, not
 *    quarantined. Quarantining is destructive to work the team still needs, and
 *    an envelope rule change would otherwise sweep an entire live mailbox into
 *    the dead-letter folder. The envelope is inferred from the filename prefix
 *    and the containing folder, which is exactly the information the tooling
 *    used to guess at anyway.
 *  - Only a genuinely unreadable or empty file is quarantined, since there is
 *    nothing to repair and leaving it risks an agent crash-looping on it.
 *
 * Exits non-zero when anything was quarantined, or when `--no-backfill` left
 * unrepaired problems (so `agents:check` is a real gate).
 */

const args = process.argv.slice(2);
const workflow = args.find(arg => !arg.startsWith('--')) || DEFAULT_WORKFLOW;
const backfill = !args.includes('--no-backfill');
const quiet = args.includes('--quiet');

const workflowRoot = path.join(REPO_ROOT, '.agents/workflows', workflow);
const slackDir = path.join(workflowRoot, 'slack');
const quarantineDir = path.join(slackDir, 'quarantine');

/** Filename prefix → envelope type. */
const PREFIX_TYPES = new Map([
    ['TASK', 'task'],
    ['REPORT', 'report'],
    ['BLOCKED', 'blocked'],
    ['FEEDBACK', 'feedback'],
    ['APPROVED', 'approved'],
    ['REJECTED', 'rejected'],
    ['NIT', 'nit'],
    ['TEST', 'test'],
    ['DEPS', 'deps'],
    ['NPM-REQUEST', 'npm-request'],
    ['PROMPT-UPDATED', 'prompt-updated'],
    ['BUG', 'bug'],
    ['FEATURE', 'feature'],
    ['REVIEW', 'review'],
    ['QUESTION', 'question'],
    ['ANSWER', 'answer'],
    ['HANDOFF', 'handoff'],
    ['DESIGN', 'feature'],
    ['EPIC', 'feature'],
    ['CONFIG', 'deps'],
    ['URGENT', 'bug'],
    ['PRIORITY', 'bug'],
    ['HEALTH-REPORT', 'report'],
    ['AWAITING-APPROVAL', 'blocked']
]);

/** Which agent a ticket type comes from, when the file does not say. */
const TYPE_SENDERS = new Map([
    ['nit', 'nitpicker'],
    ['test', 'test-marshal'],
    ['deps', 'quartermaster'],
    ['approved', 'qa-reviewer'],
    ['rejected', 'qa-reviewer'],
    ['feedback', 'qa-reviewer'],
    ['task', 'team-lead'],
    ['prompt-updated', 'overseer']
]);

/**
 * Infer an envelope for a message that predates the convention.
 *
 * @param {string} filePath
 * @param {Record<string, string|string[]>} existing
 * @returns {{type: string, from: string, to: string, task: string}}
 */
function inferEnvelope(filePath, existing) {
    const baseName = path.basename(filePath);
    const scalar = key => {
        const value = existing[key];
        return (Array.isArray(value) ? value[0] : value) || '';
    };

    const prefixMatch = baseName.match(/^\[([A-Z-]+)\]/);
    const knownType = scalar('type') || (prefixMatch && PREFIX_TYPES.get(prefixMatch[1])) || '';
    // An unmapped prefix lands on `feature`, which is a guess, not a reading. It
    // is reported so a new prefix shows up as something to map rather than
    // quietly becoming a feature request in the Team Lead's queue.
    const type = knownType || 'feature';
    const guessedType = !knownType;

    const parentDir = path.basename(path.dirname(filePath));
    const grandparentDir = path.basename(path.dirname(path.dirname(filePath)));
    const inSlackFolder = grandparentDir === 'slack' && parentDir !== 'general' && parentDir !== 'quarantine';

    const to = scalar('to') || (inSlackFolder ? parentDir : '');
    const from = scalar('from') || TYPE_SENDERS.get(type) || 'human';

    // Task id from names like [TASK]-123-slug.md or [TASK]-review-87-slug.md
    const taskMatch = baseName.match(/^\[[A-Z-]+\]-(?:review-)?(\d+[a-z]*)-/);
    const task = scalar('task') || (taskMatch ? taskMatch[1] : '');

    return { type, from, to, task, guessedType };
}

/**
 * Repair a message file's envelope in place, preserving its body.
 *
 * @param {string} filePath
 * @returns {{type: string, from: string, guessedType: boolean} | null} The
 *   envelope written, or null when the file could not be read.
 */
function repairEnvelope(filePath) {
    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }

    const { data, body } = splitFrontmatter(raw);
    const envelope = inferEnvelope(filePath, data);

    // Preserve any other frontmatter keys the file already carried.
    const preserved = {};
    for (const [key, value] of Object.entries(data)) {
        if (!['type', 'from', 'to', 'task', 'created'].includes(key)) {
            preserved[key] = value;
        }
    }

    let created = Array.isArray(data.created) ? data.created[0] : data.created;
    if (!created) {
        try {
            created = fs.statSync(filePath).mtime.toISOString();
        } catch {
            created = new Date().toISOString();
        }
    }

    const frontmatter = renderFrontmatter({
        type: envelope.type,
        from: envelope.from,
        to: envelope.to,
        task: envelope.task,
        created,
        ...preserved
    });

    fs.writeFileSync(filePath, `${frontmatter}\n\n${body.trim()}\n`);
    return envelope;
}

/**
 * Move a file that cannot be repaired into the dead-letter folder.
 *
 * @param {string} filePath
 * @param {string} reason
 */
function quarantine(filePath, reason) {
    fs.mkdirSync(quarantineDir, { recursive: true });
    const target = path.join(quarantineDir, path.basename(filePath));
    try {
        fs.renameSync(filePath, target);
        fs.appendFileSync(path.join(quarantineDir, 'README.md'), `- ${path.basename(filePath)} — ${reason} (${new Date().toISOString()})\n`);
        console.log(`Quarantined ${path.basename(filePath)}: ${reason}`);
    } catch (error) {
        console.error(`Failed to quarantine ${filePath}: ${error.message}`);
    }
}

/** Every directory whose files are messages. */
function messageDirs() {
    const dirs = [path.join(workflowRoot, 'mail/in')];
    try {
        for (const entry of fs.readdirSync(slackDir, { withFileTypes: true })) {
            if (entry.isDirectory() && entry.name !== 'general' && entry.name !== 'quarantine') {
                dirs.push(path.join(slackDir, entry.name));
            }
        }
    } catch {
        // No slack folder yet.
    }
    return dirs.filter(dir => fs.existsSync(dir));
}

let repaired = 0;
let quarantined = 0;
let unrepaired = 0;
let valid = 0;

for (const dir of messageDirs()) {
    for (const filePath of listMessageFiles(dir)) {
        const stat = fs.statSync(filePath);
        if (stat.size === 0) {
            quarantine(filePath, 'empty file');
            quarantined += 1;
            continue;
        }

        const problems = validateMessage(parseMessage(filePath));
        if (problems.length === 0) {
            valid += 1;
            continue;
        }

        if (!backfill) {
            console.log(`${path.relative(workflowRoot, filePath)}: ${problems.join('; ')}`);
            unrepaired += 1;
            continue;
        }

        const envelope = repairEnvelope(filePath);
        if (envelope) {
            repaired += 1;
            const inference = `type: ${envelope.type}${envelope.guessedType ? ' (guessed — unmapped filename prefix)' : ''}, from: ${envelope.from}`;
            if (envelope.guessedType) {
                console.warn(`Repaired envelope: ${path.relative(workflowRoot, filePath)} → ${inference}`);
            } else if (!quiet) {
                console.log(`Repaired envelope: ${path.relative(workflowRoot, filePath)} → ${inference}`);
            }
        } else {
            quarantine(filePath, problems.join('; '));
            quarantined += 1;
        }
    }
}

if (!quiet || repaired > 0 || quarantined > 0 || unrepaired > 0) {
    console.log(`Messages: ${valid} valid, ${repaired} repaired, ${quarantined} quarantined, ${unrepaired} unrepaired. Types: ${MESSAGE_TYPES.length} known.`);
}

if (quarantined > 0 || unrepaired > 0) {
    process.exit(1);
}
