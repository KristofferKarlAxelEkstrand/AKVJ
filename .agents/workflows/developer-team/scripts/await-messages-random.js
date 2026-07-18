import fs from 'node:fs';
import path from 'node:path';

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
    console.error('Usage: node await-messages-random.js <dir1> [dir2...]');
    console.error('The first <dir> under a slack/ folder decides the role flavor (name, cadence, missions).');
    process.exit(1);
}

// Validate directories exist
for (const dir of dirs) {
    const absDir = path.resolve(dir);
    if (!fs.existsSync(absDir)) {
        console.error(`Directory not found: ${absDir}`);
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Role flavor
//
// This poller is shared by every timer-driven role (Overseer + the specialists).
// Instead of hardcoding one agent, we derive the role from the watched
// `slack/<role>/` folder and personalize: display name, sweep cadence (how
// domains change at different speeds), and an optional pool of themed "special
// missions" that occasionally spice up a random-timeout wake.
// ---------------------------------------------------------------------------

const MINUTE = 60 * 1000;

/**
 * @typedef {Object} RoleFlavor
 * @property {string} display   Human name shown in logs.
 * @property {string} sweep     What this role calls its random wake.
 * @property {number} minMs     Shortest idle wait before a random wake.
 * @property {number} maxMs     Longest idle wait before a random wake.
 * @property {number} missionChance  0..1 probability of a special mission on a random wake.
 * @property {string[]} missions  Themed, optional focuses for a sweep.
 */

/** @type {Record<string, RoleFlavor>} */
const ROLES = {
    overseer: {
        display: 'The Overseer',
        sweep: 'sweep',
        minMs: 10 * MINUTE,
        maxMs: 20 * MINUTE,
        missionChance: 0.3,
        missions: [
            'Deep-dive one module you have never scrutinized and question whether it should exist at all.',
            'Trace one full MIDI-note-to-pixel path end to end; look for latency or per-frame allocation on the hot path.',
            'Pick the oldest open task and sanity-check it is still worth doing.',
            'Process audit: pick one prompt and verify it still matches how that agent actually behaves.',
            'Re-read one spec in spec/ and delete or sharpen a sentence that no longer reflects reality.'
        ]
    },
    nitpicker: {
        display: 'The Nitpicker',
        sweep: 'nit sweep',
        minMs: 15 * MINUTE,
        maxMs: 30 * MINUTE,
        missionChance: 0.4,
        missions: [
            'Rename bounty: find the single worst-named identifier in the repo and propose its perfect name.',
            'Comment cull: hunt one file for narrating comments and propose deletions.',
            'Terminology sweep: pick one concept and check it is called the same thing everywhere.',
            'Unit honesty: find a name that lies about its units (duration vs durationMs) and fix the naming.',
            'Celebrate: find the best-named thing in the codebase and note why it works — a positive example for the team.'
        ]
    },
    'test-marshal': {
        display: 'The Test Marshal',
        sweep: 'coverage sweep',
        minMs: 20 * MINUTE,
        maxMs: 40 * MINUTE,
        missionChance: 0.4,
        missions: [
            'Coverage bounty: find the most important untested branch and spec its exact test cases.',
            'Flake hunt: find one test that could pass for the wrong reason and explain how.',
            'Tier check: find something tested at the wrong level (unit vs e2e) and recommend the right one.',
            'Fixture diet: find duplicated test setup ripe for a shared helper.',
            'Stale-assertion hunt: find a test asserting behavior that no longer exists.'
        ]
    },
    quartermaster: {
        display: 'The Quartermaster',
        sweep: 'supply sweep',
        minMs: 30 * MINUTE,
        maxMs: 60 * MINUTE,
        missionChance: 0.35,
        missions: [
            'Audit day: run `npm audit` and triage the single scariest advisory.',
            'Skew check: find one dependency pinned differently across workspaces.',
            'Lockfile sanity: hunt an extraneous or phantom package in package-lock.json.',
            'Script hygiene: find one dead or duplicated npm script.',
            'Version truth: find one place where the documented Node/tool version disagrees with reality.'
        ]
    }
};

/** @type {RoleFlavor} */
const DEFAULT_ROLE = {
    display: 'Agent',
    sweep: 'sweep',
    minMs: 10 * MINUTE,
    maxMs: 20 * MINUTE,
    missionChance: 0,
    missions: []
};

/**
 * Derive the role key from the watched dirs: the first dir that sits directly
 * inside a `slack/` folder wins (so the Overseer's extra `outbox/` dir is ignored).
 * @param {string[]} watchedDirs
 * @returns {RoleFlavor}
 */
function resolveRole(watchedDirs) {
    for (const dir of watchedDirs) {
        const absDir = path.resolve(dir);
        const base = path.basename(absDir);
        const parent = path.basename(path.dirname(absDir));
        if (parent === 'slack' && ROLES[base]) {
            return ROLES[base];
        }
    }
    // Fallback: any slack/<name> folder, even if we have no flavor for it.
    for (const dir of watchedDirs) {
        const absDir = path.resolve(dir);
        if (path.basename(path.dirname(absDir)) === 'slack') {
            return { ...DEFAULT_ROLE, display: `The ${path.basename(absDir)}` };
        }
    }
    return DEFAULT_ROLE;
}

const role = resolveRole(dirs);

function pickMission() {
    if (role.missions.length === 0 || Math.random() >= role.missionChance) {
        return null;
    }
    return role.missions[Math.floor(Math.random() * role.missions.length)];
}

// State file for tracking seen files (prevents instant re-trigger on existing files)
const stateFile = path.resolve('.agents/workflows/developer-team/scripts/.await-state.json');
let seenFiles = new Map();
let needsBaseline = false;

try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const parsed = JSON.parse(raw);
    seenFiles = new Map(Object.entries(parsed));
    if (seenFiles.size === 0) {
        needsBaseline = true;
    }
} catch {
    // No state file yet — first run, treat all existing files as seen (baseline)
    needsBaseline = true;
}

function saveState() {
    // Prune stale entries (files that no longer exist) to keep state bounded
    for (const [filePath] of seenFiles) {
        if (!fs.existsSync(filePath)) {
            seenFiles.delete(filePath);
        }
    }
    try {
        fs.writeFileSync(stateFile, JSON.stringify(Object.fromEntries(seenFiles), null, 2));
    } catch {
        // Non-critical — don't block on state save errors
    }
}

function fileSignature(filePath) {
    try {
        const stat = fs.statSync(filePath);
        return `${stat.mtimeMs}:${stat.size}`;
    } catch {
        return null;
    }
}

/** Seed seenFiles with every watchable file already on disk, then persist. */
function baselineExistingFiles() {
    let seeded = 0;
    for (const dir of dirs) {
        const absDir = path.resolve(dir);
        try {
            const entries = fs.readdirSync(absDir, { withFileTypes: true });
            for (const entry of entries) {
                if (
                    !entry.isFile() ||
                    entry.name === 'README.md' ||
                    !(entry.name.endsWith('.md') || entry.name.endsWith('.json'))
                ) {
                    continue;
                }
                const fullPath = path.join(absDir, entry.name);
                const sig = fileSignature(fullPath);
                if (sig !== null) {
                    seenFiles.set(fullPath, sig);
                    seeded += 1;
                }
            }
        } catch (error) {
            console.error(`Error baselining ${absDir}: ${error.message}`);
        }
    }
    saveState();
    console.log(`First-run baseline: marked ${seeded} existing file(s) as already seen.`);
}

function checkDirectories() {
    let foundNew = false;

    for (const dir of dirs) {
        const absDir = path.resolve(dir);

        try {
            const entries = fs.readdirSync(absDir, { withFileTypes: true });
            const files = entries
                .filter(e => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.json')) && e.name !== 'README.md')
                .map(e => e.name);

            const newFiles = [];
            for (const file of files) {
                const fullPath = path.join(absDir, file);
                const sig = fileSignature(fullPath);
                const key = fullPath;
                const prevSig = seenFiles.get(key);

                if (sig !== null && sig !== prevSig) {
                    newFiles.push(file);
                    seenFiles.set(key, sig);
                }
            }

            if (newFiles.length > 0) {
                console.log(`\n========================================`);
                console.log(`MESSAGE(S) WAITING in ${dir}:`);
                newFiles.forEach(f => console.log(`- ${f}`));
                console.log(`========================================\n`);
                console.log(`${role.display} waking up to process messages...`);
                saveState();
                foundNew = true;
                break;
            }
        } catch (error) {
            console.error(`Error reading ${absDir}: ${error.message}`);
        }
    }

    if (foundNew) {
        process.exit(0);
    }
}

// 1. On first run (or empty state), mark everything already on disk as seen —
//    otherwise the startup check would wake on every pre-existing mail file.
if (needsBaseline) {
    baselineExistingFiles();
}

// 2. Check immediately on startup (only truly new/changed files will wake us)
checkDirectories();

// Generate a random timeout inside this role's cadence window
// (cadence is tuned per role — expensive/broad roles wake less often than cheap ones).
const randomTimeoutMs = Math.floor(Math.random() * (role.maxMs - role.minMs + 1)) + role.minMs;

console.log(`Listening for new messages in: ${dirs.join(', ')}...`);
console.log(`${role.display} will also wake for a ${role.sweep} in ~${Math.round(randomTimeoutMs / MINUTE)} min if it stays quiet...`);

// 3. Poll every 2 seconds. This is 100% reliable across all OS filesystems.
setInterval(checkDirectories, 2000);

// 4. Heartbeat every 30 seconds — gives the harness visible proof the process is alive.
setInterval(() => {
    console.log(`[heartbeat] ${role.display} still listening (${dirs.join(', ')})...`);
}, 30000);

// 4. Random timeout to wake up anyway — optionally with a themed special mission.
setTimeout(() => {
    const mission = pickMission();
    console.log(`\n========================================`);
    console.log(`RANDOM ${role.sweep.toUpperCase()} TRIGGERED!`);
    console.log(`========================================\n`);
    console.log(`${role.display} waking up for a ${role.sweep} (idle timeout)...`);
    if (mission) {
        console.log(`\n----------------------------------------`);
        console.log(`🎲 SPECIAL MISSION (optional focus for THIS sweep):`);
        console.log(`   ${mission}`);
        console.log(`Do it if it fits; skip it if something more important is waiting.`);
        console.log(`----------------------------------------\n`);
    }
    saveState();
    process.exit(0);
}, randomTimeoutMs);

// Handle manual cancellation gracefully
process.on('SIGINT', () => {
    saveState();
    process.exit(0);
});

// Handle SIGTERM (harness may send this instead of SIGINT)
process.on('SIGTERM', () => {
    saveState();
    process.exit(0);
});
