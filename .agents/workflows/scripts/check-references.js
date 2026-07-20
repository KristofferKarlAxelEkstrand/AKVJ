import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';

/**
 * Fail when a workflow document points at a file that does not exist.
 *
 * Usage:
 *   node check-references.js [workflow]
 *
 * The team's idle-cleanup rule is "promote then purge": fold durable facts into
 * spec/, then delete the ephemeral file. Nothing in that loop checks whether
 * anything still references what is being deleted, so specs quietly rot into
 * pointers at nothing — AGENTS.md pointed at a communication-style doc that no
 * longer existed, and goal.md cited a feature note for "full detail" that had
 * been swept away. Both were invisible until someone went looking.
 *
 * Exits non-zero when a reference dangles, so it can gate a test run.
 */

const workflow = process.argv[2] || DEFAULT_WORKFLOW;
const workflowRoot = path.join(REPO_ROOT, '.agents/workflows', workflow);

/**
 * Bases a reference may be written relative to. Docs habitually use
 * workspace-relative shorthand (`test/Clip.test.js` meaning `akvj/test/...`),
 * so the workspaces are candidates too.
 */
const DOC_ROOTS = [
    path.join(workflowRoot, 'co-workers'),
    path.join(workflowRoot, 'spec'),
    workflowRoot,
    REPO_ROOT,
    path.join(REPO_ROOT, 'akvj'),
    path.join(REPO_ROOT, 'mainframe'),
    path.join(REPO_ROOT, '.agents/workflows/scripts')
];

/** Only these top-level files from REPO_ROOT are scanned. */
const REPO_DOCS = ['AGENTS.md', 'CLAUDE.md'];

/**
 * A reference is a backticked path with an extension we care about.
 *
 * It must contain a slash: a bare `meta.json` or `Renderer.js` is prose naming
 * a kind of file, not a pointer to a location, and treating those as references
 * buries the real findings in noise. Placeholders (`<task-id>`, `{agent}`, `*`)
 * are templates rather than paths.
 */
const REFERENCE_PATTERN = /`([^`\s]*\/[^`\s]*\.(?:md|js|json))`/g;
// `[TASK]-review-<task-id>.md` is a template because of the angle brackets, not
// the tag: real mail filenames carry tags too (`[NIT]-…-2026-07-20.md`), and
// treating every bracketed prefix as a placeholder made those unverifiable.
const PLACEHOLDER_PATTERN = /[<>{}*]|\.\.\.|…/;

function isTemplate(reference) {
    return PLACEHOLDER_PATTERN.test(reference);
}

/** Collect the markdown files to scan. */
function collectDocs() {
    const docs = [];

    for (const doc of REPO_DOCS) {
        const full = path.join(REPO_ROOT, doc);
        if (fs.existsSync(full)) {
            docs.push(full);
        }
    }

    const walk = dir => {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                // Archived and generated trees are allowed to reference the past.
                if (['archive', 'node_modules', '.temp', 'mail', 'slack', 'memory', 'health'].includes(entry.name)) {
                    continue;
                }
                walk(full);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                docs.push(full);
            }
        }
    };

    walk(path.join(workflowRoot, 'co-workers'));
    walk(path.join(workflowRoot, 'spec'));
    // Open tasks and epics are where references rot fastest: triage moves the
    // mail a task cites, an epic outlives the spec it was written against, and
    // nothing in the loop notices. Their `done/` folders are excluded — a
    // finished task is a record of what was true then, like `archive/`.
    walk(path.join(workflowRoot, 'tasks', 'todo'));
    walk(path.join(workflowRoot, 'tasks', 'working-on'));
    walk(path.join(workflowRoot, 'epics', 'drafts'));
    walk(path.join(workflowRoot, 'epics', 'todo'));
    for (const name of ['README.md', 'WORKFLOW.md']) {
        const full = path.join(workflowRoot, name);
        if (fs.existsSync(full)) {
            docs.push(full);
        }
    }
    const workflowsReadme = path.join(REPO_ROOT, '.agents/workflows/README.md');
    if (fs.existsSync(workflowsReadme)) {
        docs.push(workflowsReadme);
    }

    return [...new Set(docs)];
}

/**
 * Can this reference be resolved from any plausible base directory?
 *
 * Docs reference paths relative to themselves (`../spec/goal.md`), to the repo
 * root (`akvj/src/js/core/AppState.js`), or to the workflow root — so a
 * reference counts as good if any of those resolve.
 *
 * @param {string} reference
 * @param {string} docPath
 * @returns {boolean}
 */
function resolves(reference, docPath) {
    const bases = [path.dirname(docPath), REPO_ROOT, workflowRoot, ...DOC_ROOTS];
    if (bases.some(base => fs.existsSync(path.resolve(base, reference)))) {
        return true;
    }
    // A task cites the mail that spawned it, and triage then moves that mail to
    // mail/in/read/. The citation is still correct — the file just graduated.
    const triaged = reference.replace(/(^|\/)mail\/in\//, '$1mail/in/read/');
    return triaged !== reference && bases.some(base => fs.existsSync(path.resolve(base, triaged)));
}

/**
 * An epic proposes work, so it legitimately names product files that do not
 * exist yet (`mainframe/shared/mappingService.js` for a module still to be
 * extracted). Its pointers into `.agents/` are a different matter — those cite
 * specs, tasks, and sibling epics that exist now, and go stale silently.
 *
 * @param {string} docPath
 * @param {string} reference
 * @returns {boolean}
 */
function isPlannedProductPath(docPath, reference) {
    const inEpic = docPath.startsWith(path.join(workflowRoot, 'epics') + path.sep);
    return inEpic && !reference.includes('.agents/');
}

const problems = [];
let checked = 0;

for (const docPath of collectDocs()) {
    const content = fs.readFileSync(docPath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
        for (const match of line.matchAll(REFERENCE_PATTERN)) {
            const reference = match[1];
            if (isTemplate(reference) || isPlannedProductPath(docPath, reference)) {
                continue;
            }
            checked += 1;
            if (!resolves(reference, docPath)) {
                problems.push(`${path.relative(REPO_ROOT, docPath)}:${index + 1} → ${reference}`);
            }
        }
    });
}

if (problems.length > 0) {
    console.error(`Dangling references (${problems.length} of ${checked} checked):`);
    for (const problem of problems) {
        console.error(`  ${problem}`);
    }
    process.exit(1);
}

console.log(`All ${checked} file references resolve.`);
