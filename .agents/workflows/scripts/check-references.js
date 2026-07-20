import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
 *
 * What counts as rot is narrower than "not on disk right now". Generated output
 * is absent until it is built, and a task or epic names the destination of work
 * that has not landed yet. Neither is a broken pointer, and failing the gate on
 * them trains the team to ignore it — see `isGenerated` and `isPlannedProductPath`.
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
 * A task or an epic proposes work, so it legitimately names product files that
 * do not exist yet — an epic naming `mainframe/shared/mappingService.js` for a
 * module still to be extracted, or a move task naming its own destination. That
 * path appearing is the point of the document; it is absent because the work is
 * pending, not because a pointer rotted.
 *
 * Their pointers into `.agents/` are a different matter and stay checked
 * everywhere — those cite specs, sibling tasks, and mail that exist *now*, and
 * are exactly what goes stale silently when triage moves a file.
 *
 * @param {string} docPath
 * @param {string} reference
 * @returns {boolean}
 */
function isPlannedProductPath(docPath, reference) {
    const proposesWork = ['epics', 'tasks'].some(dir => docPath.startsWith(path.join(workflowRoot, dir) + path.sep));
    return proposesWork && !reference.includes('.agents/');
}

/**
 * Every in-repo absolute path a reference could have meant, repo-root-relative.
 *
 * @param {{reference: string, docPath: string}} entry
 * @returns {string[]}
 */
function candidatePaths({ reference, docPath }) {
    return [path.dirname(docPath), REPO_ROOT, workflowRoot, ...DOC_ROOTS]
        .map(base => path.resolve(base, reference))
        .filter(absolute => absolute.startsWith(REPO_ROOT + path.sep))
        .map(absolute => path.relative(REPO_ROOT, absolute));
}

/**
 * Drop references whose target is generated output.
 *
 * `akvj/src/public/projects/**` does not exist until `npm run clips` runs, so a
 * doc naming it is correct and the file is simply unbuilt. Asking git rather
 * than hardcoding prefixes keeps this tracking `.gitignore` instead of drifting
 * from it as the generated trees move.
 *
 * When git cannot answer — not installed, not a work tree — nothing is dropped.
 * Failing closed keeps the check honest: better a false red we can explain than
 * a silent pass over every reference in the repo.
 *
 * @param {{reference: string, docPath: string, line: number}[]} dangling
 * @returns {{reference: string, docPath: string, line: number}[]}
 */
function withoutGeneratedTargets(dangling) {
    if (dangling.length === 0) {
        return dangling;
    }

    const queries = [...new Set(dangling.flatMap(candidatePaths))];
    let ignored;
    try {
        const stdout = execFileSync('git', ['check-ignore', '--stdin'], {
            cwd: REPO_ROOT,
            input: queries.join('\n'),
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });
        ignored = new Set(stdout.split('\n').filter(Boolean));
    } catch (error) {
        // Exit 1 is git's normal "none of these are ignored" answer, not a
        // failure. Anything else means we could not ask, so keep every finding.
        if (error.status !== 1) {
            return dangling;
        }
        ignored = new Set();
    }

    return dangling.filter(entry => !candidatePaths(entry).some(candidate => ignored.has(candidate)));
}

const dangling = [];
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
                dangling.push({ reference, docPath, line: index + 1 });
            }
        }
    });
}

const problems = withoutGeneratedTargets(dangling);

if (problems.length > 0) {
    console.error(`Dangling references (${problems.length} of ${checked} checked):`);
    for (const { docPath, line, reference } of problems) {
        console.error(`  ${path.relative(REPO_ROOT, docPath)}:${line} → ${reference}`);
    }
    process.exit(1);
}

console.log(`All ${checked} file references resolve.`);
