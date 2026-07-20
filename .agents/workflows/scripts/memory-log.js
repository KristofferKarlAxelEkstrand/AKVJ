import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';

/**
 * Bounded agent memory.
 *
 * Usage:
 *   node memory-log.js append <workflow> <agent> --summary "..." [--area x] [--refs 1,2]
 *   node memory-log.js compact <workflow> <agent> [--keep 15]
 *   node memory-log.js compact-all <workflow> [--keep 15] [--quiet]
 *   node memory-log.js migrate <workflow> <agent> [--keep 15]
 *
 * The problem this solves: agent logs were append-only and every prompt said to
 * read the log before each wake. One reached 216 KB / 130 entries — roughly 60k
 * tokens re-read every 10-20 minutes, growing forever. The poller exists so
 * agents idle cheaply; unbounded memory spent that saving straight back.
 *
 * The shape below keeps what the re-read is actually for. `## Digest` holds one
 * line per past finding — enough to stop an agent re-reporting something — and
 * is the only part meant to be read in full. `## Recent` keeps the newest
 * entries with their detail, for when a digest line needs its reasoning. Older
 * entries fold from Recent into Digest automatically, so cost stays flat.
 *
 * Agents only ever call `append`; the health monitor calls `compact-all`.
 */

const DIGEST_HEADING = '## Digest';
const RECENT_HEADING = '## Recent';
const DEFAULT_KEEP = 12;
const DIGEST_CONTEXT_CHARS = 90;
// Deciding whether a log is heading-delimited or bullet-delimited.
//
// Measured across the team's five logs, heading counts separate cleanly: logs
// where a heading *is* the entry have many (130 and 37), while bullet-style logs
// have only a few fixed section titles (3, 5, 6). Bullet-to-heading ratio does
// not separate them — 7.7 for a bullet log vs 6.2 for a heading log — so count,
// not ratio, is the discriminator. Headings are the default for new logs.
const MIN_HEADING_ENTRIES = 10;
const MIN_BULLET_ENTRIES = 5;
// Hard ceiling on digest lines, so the read-before-every-wake cost is bounded
// rather than merely slow-growing.
const MAX_DIGEST_LINES = 200;

const [command, ...rest] = process.argv.slice(2);
const positional = rest.filter(arg => !arg.startsWith('--'));

/**
 * Read a `--flag value` option.
 * @param {string} name
 * @returns {string | undefined}
 */
function option(name) {
    const index = rest.indexOf(`--${name}`);
    return index === -1 ? undefined : rest[index + 1];
}

const quiet = rest.includes('--quiet');
const keep = Number(option('keep') ?? DEFAULT_KEEP);

/** Default log filename per role, matching what each prompt calls its log. */
const LOG_NAMES = new Map([
    ['overseer', 'sweep-log.md'],
    ['nitpicker', 'findings-log.md'],
    ['qa-reviewer', 'review-log.md'],
    ['test-marshal', 'coverage-log.md'],
    ['quartermaster', 'supply-log.md']
]);

/**
 * Locate an agent's log file, preferring an existing one.
 *
 * @param {string} workflow
 * @param {string} agent
 * @returns {string}
 */
function logPath(workflow, agent) {
    const memoryDir = path.join(REPO_ROOT, '.agents/workflows', workflow, 'memory', agent);
    const preferred = path.join(memoryDir, LOG_NAMES.get(agent) || `${agent}-log.md`);
    if (fs.existsSync(preferred)) {
        return preferred;
    }

    // Fall back to whatever single *-log.md the folder already has.
    try {
        const existing = fs.readdirSync(memoryDir).filter(f => f.endsWith('-log.md'));
        if (existing.length === 1) {
            return path.join(memoryDir, existing[0]);
        }
    } catch {
        // Folder does not exist yet.
    }
    return preferred;
}

/**
 * @typedef {Object} ParsedLog
 * @property {string} title      Leading `# ...` heading line.
 * @property {string} preamble   Any durable notes between the title and Digest.
 * @property {string[]} digest   Digest bullet lines.
 * @property {string[]} entries  Recent entries, each a full markdown block.
 */

/**
 * Parse a log into its three parts. Handles both the structured format and the
 * free-form logs that predate it (everything becomes an entry).
 *
 * @param {string} content
 * @returns {ParsedLog}
 */
function parseLog(content) {
    const lines = content.split(/\r?\n/);
    const title = lines.find(line => line.startsWith('# ')) || '# Log';

    const digestStart = lines.findIndex(line => line.trim() === DIGEST_HEADING);
    const recentStart = lines.findIndex(line => line.trim() === RECENT_HEADING);

    const digest = [];
    if (digestStart !== -1) {
        const end = recentStart === -1 ? lines.length : recentStart;
        for (let i = digestStart + 1; i < end; i += 1) {
            if (lines[i].trim().startsWith('- ')) {
                digest.push(lines[i].trim());
            }
        }
    }

    // Entry bodies: everything after ## Recent, or the whole document for a
    // legacy log. Entries are delimited by ### (structured) or ## (legacy).
    const bodyStart = recentStart !== -1 ? recentStart + 1 : lines.indexOf(title) + 1;
    const bodyLines = lines.slice(bodyStart);

    // Entries come in two shapes across the team's logs: heading-delimited
    // (one `##`/`###` block per sweep) and bullet-delimited (one long `- ` line
    // per sweep under a `## Sweeps` section). Split on headings first, and fall
    // back to bullets when that yields nothing to work with.
    const byHeading = splitOnHeadings(bodyLines);
    // A couple of headings in a bullet-heavy log are section titles ("## Sweeps",
    // "## Next sweep area"), not entries — so only trust headings as the entry
    // delimiter once there are enough of them to plausibly be one.
    const useBullets = byHeading.entries.length < MIN_HEADING_ENTRIES && countTopLevelBullets(bodyLines) >= MIN_BULLET_ENTRIES;
    const { preamble, entries } = useBullets ? splitOnBullets(bodyLines) : byHeading;

    return { title, preamble: preamble.trim(), digest, entries };
}

/** Count `- ` lines that start at column zero. */
function countTopLevelBullets(lines) {
    return lines.filter(line => /^- \S/.test(line)).length;
}

/**
 * Split a body into entries delimited by markdown headings.
 * @param {string[]} lines
 * @returns {{preamble: string, entries: string[]}}
 */
function splitOnHeadings(lines) {
    const preambleLines = [];
    const entries = [];
    let current = null;
    const isEntryHeading = line => /^###?\s+/.test(line) && line.trim() !== DIGEST_HEADING && line.trim() !== RECENT_HEADING;

    for (const line of lines) {
        if (line.trim() === DIGEST_HEADING || line.trim() === RECENT_HEADING) {
            continue;
        }
        if (isEntryHeading(line)) {
            if (current) {
                entries.push(current.join('\n').trimEnd());
            }
            current = [line];
            continue;
        }
        if (current) {
            current.push(line);
        } else if (line.trim() !== '') {
            preambleLines.push(line);
        }
    }
    if (current) {
        entries.push(current.join('\n').trimEnd());
    }

    return { preamble: preambleLines.join('\n'), entries };
}

/**
 * Split a body into entries delimited by top-level bullets, keeping any
 * indented continuation lines with their bullet. Section headings encountered
 * along the way stay in the preamble so the log keeps its shape.
 *
 * @param {string[]} lines
 * @returns {{preamble: string, entries: string[]}}
 */
function splitOnBullets(lines) {
    const preambleLines = [];
    const entries = [];
    let current = null;

    for (const line of lines) {
        if (/^- \S/.test(line)) {
            if (current) {
                entries.push(current.join('\n').trimEnd());
            }
            current = [line];
            continue;
        }
        // Indented continuation of the bullet above.
        if (current && (line.trim() === '' || /^\s+\S/.test(line))) {
            current.push(line);
            continue;
        }
        if (current) {
            entries.push(current.join('\n').trimEnd());
            current = null;
        }
        if (line.trim() !== '') {
            preambleLines.push(line);
        }
    }
    if (current) {
        entries.push(current.join('\n').trimEnd());
    }

    return { preamble: preambleLines.join('\n'), entries };
}

/**
 * Reduce a full entry to a single digest line, preserving date and references.
 *
 * @param {string} entry
 * @returns {string}
 */
function toDigestLine(entry) {
    const [heading, ...body] = entry.split('\n');

    // Bullet-shaped entries are already one line per finding — the digest form
    // is just the same line, trimmed to length.
    if (/^- \S/.test(heading)) {
        const refs = [...entry.matchAll(/\b(\d{2,4})\b(?=[^\n]*\.md)/g)].map(match => match[1]);
        const text = heading.replace(/^- /, '').trim();
        const trimmed = text.length > DIGEST_CONTEXT_CHARS * 2 ? `${text.slice(0, DIGEST_CONTEXT_CHARS * 2)}…` : text;
        const uniqueRefs = [...new Set(refs)].slice(0, 4);
        return uniqueRefs.length > 0 ? `- ${trimmed} [${uniqueRefs.join(', ')}]` : `- ${trimmed}`;
    }

    const headingText = heading.replace(/^#+\s*/, '').trim();

    // Keep any task references mentioned anywhere in the entry.
    const refs = [...entry.matchAll(/\b(?:task|tasks|filed|#)\s*(\d{2,4})\b/gi)].map(match => match[1]);
    const uniqueRefs = [...new Set(refs)].slice(0, 6);

    // First substantive body line adds context when the heading is terse.
    const firstLine = body.map(line => line.trim()).find(line => line !== '' && !line.startsWith('#')) || '';
    const context = firstLine.replace(/^[-*]\s*/, '').slice(0, DIGEST_CONTEXT_CHARS);

    const parts = [headingText];
    if (context && !headingText.includes(context.slice(0, 30))) {
        parts.push(context);
    }
    const line = `- ${parts.join(' — ')}`;
    return uniqueRefs.length > 0 ? `${line} [${uniqueRefs.join(', ')}]` : line;
}

/**
 * Normalize an entry heading to `###` so Recent stays visually nested under its
 * `## Recent` section, whatever level the entry was written at.
 *
 * @param {string} entry
 * @returns {string}
 */
function normalizeEntryHeading(entry) {
    return entry.startsWith('#') ? entry.replace(/^#+\s+/, '### ') : entry;
}

/**
 * Render a log back to markdown.
 * @param {ParsedLog} log
 * @returns {string}
 */
function renderLog(log) {
    const sections = [log.title];
    if (log.preamble) {
        sections.push(log.preamble);
    }
    sections.push(
        `${DIGEST_HEADING}\n\nOne line per past finding — read this in full before a sweep.\n\n${log.digest.length > 0 ? log.digest.join('\n') : '- (nothing compacted yet)'}`
    );
    sections.push(`${RECENT_HEADING}\n\n${log.entries.length > 0 ? log.entries.join('\n\n') : '_No entries yet._'}`);
    return `${sections.join('\n\n')}\n`;
}

/**
 * Fold entries beyond `keep` into digest lines.
 * @param {ParsedLog} log
 * @param {number} keepCount
 * @returns {{log: ParsedLog, compacted: number}}
 */
function compactLog(log, keepCount) {
    if (log.entries.length <= keepCount) {
        return { log, compacted: 0 };
    }
    // Entries are appended newest-last, so the oldest are at the front.
    const overflow = log.entries.slice(0, log.entries.length - keepCount);

    // Cap the digest too, or the log is merely slow-growing rather than bounded.
    // The oldest findings are the safest to drop: the code they describe has
    // usually changed, and the full history is preserved under archive/.
    const digest = [...log.digest, ...overflow.map(toDigestLine)].slice(-MAX_DIGEST_LINES);

    return {
        log: {
            ...log,
            digest,
            entries: log.entries.slice(log.entries.length - keepCount).map(normalizeEntryHeading)
        },
        compacted: overflow.length
    };
}

function readLog(filePath) {
    try {
        return parseLog(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return { title: `# ${path.basename(filePath, '.md')}`, preamble: '', digest: [], entries: [] };
    }
}

function writeLog(filePath, log) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, renderLog(log));
}

/** Agents that have a memory folder in this workflow. */
function agentsWithMemory(workflow) {
    const memoryRoot = path.join(REPO_ROOT, '.agents/workflows', workflow, 'memory');
    try {
        return fs
            .readdirSync(memoryRoot, { withFileTypes: true })
            .filter(entry => entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.'))
            .map(entry => entry.name);
    } catch {
        return [];
    }
}

// ── Commands ─────────────────────────────────────────────────────────────

function runAppend(workflow, agent) {
    const summary = option('summary');
    if (!summary) {
        console.error('append requires --summary "<one line>"');
        process.exit(1);
    }

    const filePath = logPath(workflow, agent);
    const log = readLog(filePath);

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const area = option('area');
    const refs = option('refs');

    const heading = `### ${timestamp} — ${summary}`;
    const details = [];
    if (area) {
        details.push(`- Area: \`${area}\``);
    }
    if (refs) {
        details.push(`- Refs: ${refs}`);
    }

    log.entries.push([heading, ...(details.length > 0 ? ['', ...details] : [])].join('\n'));
    writeLog(filePath, compactLog(log, keep).log);
    console.log(`Logged to ${path.relative(REPO_ROOT, filePath)}`);
}

/**
 * Preserve the pre-compaction file before the first restructuring.
 *
 * Compaction is lossy by design — long entries become one line. That is the
 * right trade for a file re-read every wake, but the first pass over a legacy
 * log also flattens durable context that was never an "entry" (standing notes,
 * goal summaries). Keeping the original outside `memory/` means nothing is
 * destroyed while the live log still gets bounded, and agents are not tempted
 * to read it back in.
 *
 * @param {string} workflow
 * @param {string} agent
 * @param {string} filePath
 */
function archiveOriginal(workflow, agent, filePath) {
    const archiveDir = path.join(REPO_ROOT, '.agents/workflows', workflow, 'archive', 'memory');
    const stamp = new Date().toISOString().slice(0, 10);
    const target = path.join(archiveDir, `${agent}-${path.basename(filePath, '.md')}-${stamp}.md`);
    if (fs.existsSync(target)) {
        return;
    }
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.copyFileSync(filePath, target);
    console.log(`Archived original to ${path.relative(REPO_ROOT, target)}`);
}

function runCompact(workflow, agent, { silent = false, archive = false } = {}) {
    const filePath = logPath(workflow, agent);
    if (!fs.existsSync(filePath)) {
        return 0;
    }

    if (archive) {
        archiveOriginal(workflow, agent, filePath);
    }

    const before = fs.statSync(filePath).size;
    const { log, compacted } = compactLog(readLog(filePath), keep);
    writeLog(filePath, log);
    const after = fs.statSync(filePath).size;

    if (!silent && (compacted > 0 || before !== after)) {
        console.log(`${agent}: compacted ${compacted} entr${compacted === 1 ? 'y' : 'ies'}, ${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB`);
    }
    return compacted;
}

switch (command) {
    case 'append': {
        const [workflow = DEFAULT_WORKFLOW, agent] = positional;
        if (!agent) {
            console.error('Usage: node memory-log.js append <workflow> <agent> --summary "..."');
            process.exit(1);
        }
        runAppend(workflow, agent);
        break;
    }

    case 'compact':
    case 'migrate': {
        const [workflow = DEFAULT_WORKFLOW, agent] = positional;
        if (!agent) {
            console.error(`Usage: node memory-log.js ${command} <workflow> <agent> [--keep N]`);
            process.exit(1);
        }
        // `migrate` is the one-time conversion of a legacy log, so it keeps a copy.
        runCompact(workflow, agent, { archive: command === 'migrate' });
        break;
    }

    case 'compact-all': {
        const [workflow = DEFAULT_WORKFLOW] = positional;
        let total = 0;
        for (const agent of agentsWithMemory(workflow)) {
            total += runCompact(workflow, agent, { silent: quiet });
        }
        if (!quiet && total === 0) {
            console.log('Nothing to compact.');
        }
        break;
    }

    default:
        console.error('Usage: node memory-log.js <append|compact|compact-all|migrate> ...');
        process.exit(1);
}
