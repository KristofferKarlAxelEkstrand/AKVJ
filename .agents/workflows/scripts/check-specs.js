import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';
import { splitFrontmatter } from './lib/frontmatter.js';

/**
 * Keep the spec folder honest.
 *
 * Usage:
 *   node check-specs.js [workflow]
 *
 * A spec is the truth the team builds and reviews against, which only works if
 * you can tell at a glance which file is binding and which is someone's draft.
 * That distinction lives in frontmatter, so this checks:
 *
 *   - every spec carries the required fields, with a legal status
 *   - `id` matches the filename, since tasks cite specs by id
 *   - the index in spec/README.md lists every spec and nothing that is gone
 *   - open tasks cite a spec that exists and is approved
 *   - `supersedes` names something that was actually superseded
 *
 * Exits non-zero on any problem so it can gate a run.
 */

const workflow = process.argv[2] || DEFAULT_WORKFLOW;
const workflowRoot = path.join(REPO_ROOT, '.agents/workflows', workflow);
const specDir = path.join(workflowRoot, 'spec');
const indexPath = path.join(specDir, 'README.md');
const archiveDir = path.join(workflowRoot, 'archive/superseded-specs');

const REQUIRED_FIELDS = ['id', 'title', 'status', 'owner', 'maintainer', 'verified'];
const VALID_STATUSES = ['draft', 'approved', 'superseded'];
const TASK_DIRS = ['tasks/todo', 'tasks/working-on'];

const problems = [];

/**
 * Every spec file, README included — the index is itself a spec-shaped document
 * so it cannot rot without being noticed.
 *
 * @returns {{filePath: string, relativePath: string, data: Record<string, unknown>}[]}
 */
function collectSpecs() {
    const specs = [];

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
                walk(full);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
                const { data } = splitFrontmatter(fs.readFileSync(full, 'utf8'));
                specs.push({ filePath: full, relativePath: path.relative(specDir, full), data });
            }
        }
    };

    walk(specDir);
    return specs;
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

function checkFrontmatter(spec) {
    const { relativePath, data } = spec;

    for (const field of REQUIRED_FIELDS) {
        if (!scalar(data, field)) {
            problems.push(`${relativePath}: missing "${field}"`);
        }
    }

    const status = scalar(data, 'status');
    if (status && !VALID_STATUSES.includes(status)) {
        problems.push(`${relativePath}: status "${status}" is not one of ${VALID_STATUSES.join(', ')}`);
    }
    if (status === 'approved' && !scalar(data, 'approved')) {
        problems.push(`${relativePath}: approved specs need an "approved" date — that date is the human's signature`);
    }

    const id = scalar(data, 'id');
    const expectedId = path.basename(relativePath, '.md').toLowerCase();
    if (id && id !== expectedId) {
        problems.push(`${relativePath}: id "${id}" does not match filename (expected "${expectedId}") — tasks cite specs by id`);
    }
}

/**
 * `supersedes: [a, b]` is a claim that a and b were retired. Check they are
 * really gone from spec/ and really present in the archive, so a half-finished
 * merge cannot leave two live specs describing the same thing.
 *
 * @param {object} spec
 * @param {Set<string>} liveIds
 */
function checkSupersedes(spec, liveIds) {
    const raw = spec.data.supersedes;
    if (raw === undefined) {
        return;
    }
    const claimed = Array.isArray(raw) ? raw : [raw];
    for (const entry of claimed) {
        const supersededId = String(entry).trim();
        if (!supersededId) {
            continue;
        }
        if (liveIds.has(supersededId)) {
            problems.push(`${spec.relativePath}: claims to supersede "${supersededId}", but that spec is still live in spec/`);
        }
        if (!fs.existsSync(path.join(archiveDir, `${supersededId}.md`))) {
            problems.push(`${spec.relativePath}: supersedes "${supersededId}", which is not in archive/superseded-specs/`);
        }
    }
}

/**
 * The index is what agents get in their startup prompt, so a spec missing from
 * it is a spec nobody knows exists.
 *
 * @param {object[]} specs
 */
function checkIndex(specs) {
    if (!fs.existsSync(indexPath)) {
        problems.push('spec/README.md is missing — there is no index');
        return;
    }

    const index = fs.readFileSync(indexPath, 'utf8');
    for (const spec of specs) {
        if (spec.relativePath === 'README.md') {
            continue;
        }
        if (!index.includes(`(${spec.relativePath})`)) {
            problems.push(`spec/README.md does not list ${spec.relativePath}`);
        }
    }

    for (const match of index.matchAll(/\]\(([^)]+\.md)\)/g)) {
        const linked = match[1];
        if (!fs.existsSync(path.join(specDir, linked))) {
            problems.push(`spec/README.md links ${linked}, which does not exist`);
        }
    }
}

/**
 * A task's `spec:` field is the whole traceability chain. A typo, or a pointer
 * at a draft, means work gets built against something nobody approved.
 *
 * @param {Map<string, string>} statusById
 */
function checkTaskCitations(statusById) {
    for (const taskDir of TASK_DIRS) {
        const dir = path.join(workflowRoot, taskDir);
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            continue;
        }

        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith('.md')) {
                continue;
            }
            const { data } = splitFrontmatter(fs.readFileSync(path.join(dir, entry.name), 'utf8'));
            const cited = scalar(data, 'spec');
            if (!cited || cited === 'none') {
                continue;
            }
            const status = statusById.get(cited);
            if (!status) {
                problems.push(`${taskDir}/${entry.name}: cites spec "${cited}", which does not exist`);
            } else if (status !== 'approved') {
                problems.push(`${taskDir}/${entry.name}: cites spec "${cited}", which is ${status} — only approved specs are binding`);
            }
        }
    }
}

const specs = collectSpecs();
if (specs.length === 0) {
    console.error(`No specs found in ${path.relative(REPO_ROOT, specDir)}`);
    process.exit(1);
}

const liveIds = new Set(specs.map(spec => scalar(spec.data, 'id')).filter(Boolean));
const statusById = new Map(specs.map(spec => [scalar(spec.data, 'id'), scalar(spec.data, 'status')]));

for (const spec of specs) {
    checkFrontmatter(spec);
    checkSupersedes(spec, liveIds);
}
checkIndex(specs);
checkTaskCitations(statusById);

if (problems.length > 0) {
    console.error(`Spec problems (${problems.length}):`);
    for (const problem of problems) {
        console.error(`  ${problem}`);
    }
    process.exit(1);
}

const approved = specs.filter(spec => scalar(spec.data, 'status') === 'approved').length;
console.log(`All ${specs.length} specs valid (${approved} approved, ${specs.length - approved} draft).`);
