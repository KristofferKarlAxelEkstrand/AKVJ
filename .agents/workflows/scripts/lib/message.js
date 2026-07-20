import fs from 'node:fs';
import path from 'node:path';
import { splitFrontmatter, renderFrontmatter } from './frontmatter.js';

/**
 * The team's message envelope.
 *
 * Every file in mail/in/ and slack/<agent>/ carries a small frontmatter block
 * so the tooling can route on data instead of guessing from filenames. The
 * `[PREFIX]-` filename convention is kept for humans scanning a folder; this
 * envelope is what the dashboard, the stalled-work detector, and the validator
 * actually read.
 */

/** Message types agents may send. Anything else is malformed. */
export const MESSAGE_TYPES = Object.freeze([
    'task',
    'report',
    'blocked',
    'feedback',
    'approved',
    'rejected',
    'nit',
    'test',
    'deps',
    'npm-request',
    'prompt-updated',
    'question',
    'bug',
    'feature',
    'review',
    'answer',
    'handoff'
]);

/**
 * @typedef {Object} Message
 * @property {string} type
 * @property {string} from
 * @property {string} [to]
 * @property {string} [task]
 * @property {string} [created]
 * @property {string} body
 * @property {string} filePath
 */

/**
 * Read and parse a message file.
 *
 * @param {string} filePath
 * @returns {Message | null} Null when the file cannot be read at all.
 */
export function parseMessage(filePath) {
    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }

    const { data, body } = splitFrontmatter(raw);
    const scalar = key => (Array.isArray(data[key]) ? data[key][0] : data[key]);

    return {
        type: scalar('type') || '',
        from: scalar('from') || '',
        to: scalar('to') || '',
        task: scalar('task') || '',
        // Set on an `answer` to name the question it replies to, so a peer
        // exchange can be followed after the fact without guessing from titles.
        re: scalar('re') || '',
        created: scalar('created') || '',
        body,
        filePath
    };
}

/**
 * Check an envelope for the fields the tooling depends on.
 *
 * @param {Message | null} message
 * @returns {string[]} Problems found; empty means valid.
 */
export function validateMessage(message) {
    if (message === null) {
        return ['file could not be read'];
    }

    const problems = [];
    if (!message.type) {
        problems.push('missing "type"');
    } else if (!MESSAGE_TYPES.includes(message.type)) {
        problems.push(`unknown type "${message.type}" (expected one of: ${MESSAGE_TYPES.join(', ')})`);
    }
    if (!message.from) {
        problems.push('missing "from"');
    }
    return problems;
}

/**
 * Write a message file with a well-formed envelope.
 *
 * @param {string} filePath
 * @param {{type: string, from: string, to?: string, task?: string|number, re?: string, created?: string}} envelope
 * @param {string} body
 */
export function writeMessage(filePath, envelope, body) {
    const frontmatter = renderFrontmatter({
        type: envelope.type,
        from: envelope.from,
        to: envelope.to,
        task: envelope.task,
        re: envelope.re,
        created: envelope.created || new Date().toISOString()
    });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${frontmatter}\n\n${body.trim()}\n`);
}

/**
 * Who owns this message — the agent a nudge should go to.
 *
 * Falls back to the folder for slack messages (a file in slack/qa-reviewer/ is
 * QA's regardless of what its envelope claims) and finally to the Team Lead,
 * who owns anything untriaged. Broadcast (`slack/all/`) and shared folders are
 * not a single owner's mailbox.
 *
 * @param {Message | null} message
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolveOwner(message, fallback = 'team-lead') {
    if (message === null) {
        return fallback;
    }
    if (message.to) {
        return message.to;
    }

    const parentDir = path.basename(path.dirname(message.filePath));
    const grandparentDir = path.basename(path.dirname(path.dirname(message.filePath)));
    if (grandparentDir === 'slack' && parentDir !== 'general' && parentDir !== 'quarantine' && parentDir !== 'all') {
        return parentDir;
    }

    return fallback;
}

/**
 * List message files in a directory, skipping READMEs and dotfiles.
 *
 * @param {string} dir
 * @returns {string[]} Absolute paths.
 */
export function listMessageFiles(dir) {
    try {
        return fs
            .readdirSync(dir, { withFileTypes: true })
            .filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' && !entry.name.startsWith('.'))
            .map(entry => path.join(dir, entry.name));
    } catch {
        return [];
    }
}
