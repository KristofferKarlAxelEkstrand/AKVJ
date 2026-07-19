import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';

const rawArgs = process.argv.slice(2);

/**
 * Determine whether a token is intended as a file path.
 *
 * @param {string} arg
 * @returns {boolean}
 */
function looksLikePath(arg) {
    return arg.includes('/') || arg.includes('\\') || path.isAbsolute(arg);
}

/**
 * Derive the workflow directory name from a watched directory path.
 *
 * @param {string[]} watchedDirs
 * @returns {string}
 */
function resolveWorkflowFromDirs(watchedDirs) {
    const absDir = path.resolve(watchedDirs[0]);
    const parts = absDir.split(path.sep);
    const workflowsIndex = parts.lastIndexOf('workflows');
    if (workflowsIndex > 0 && parts[workflowsIndex + 1]) {
        return parts[workflowsIndex + 1];
    }
    return DEFAULT_WORKFLOW;
}

/**
 * Convert command line arguments to watched directory paths.
 *
 * Supports two call styles:
 * 1. Full paths (legacy):
 *    node await-messages.js .agents/workflows/team/slack/agent .agents/workflows/team/inbox
 * 2. Shorthand tokens:
 *    node await-messages.js <workflow> <agent> [extra-dir1] [extra-dir2]
 *    e.g. node await-messages.js developer-team team-lead inbox
 *
 * @param {string[]} args
 * @returns {{dirs: string[], workflow: string, agent: string} | null}
 */
function resolveArgs(args) {
    if (args.length === 0) {
        return null;
    }

    // Legacy full-path mode: first argument looks like a path.
    if (looksLikePath(args[0])) {
        return { dirs: args, workflow: resolveWorkflowFromDirs(args), agent: '' };
    }

    const workflow = args[0];
    const agent = args[1];
    if (!agent) {
        return null;
    }

    const workflowRoot = path.join(REPO_ROOT, '.agents/workflows', workflow);
    const dirs = [path.join(workflowRoot, 'slack', agent)];
    for (const extra of args.slice(2)) {
        dirs.push(path.join(workflowRoot, extra));
    }

    return { dirs, workflow, agent };
}

const argInfo = resolveArgs(rawArgs);
if (argInfo === null) {
    console.error('Usage: node await-messages.js <dir1> [dir2...]');
    console.error('       node await-messages.js <workflow> <agent> [extra-dir1] [extra-dir2...]');
    process.exit(1);
}

const { dirs, workflow: workflowName, agent: shorthandAgent } = argInfo;

// Validate directories exist
for (const dir of dirs) {
    const absDir = path.resolve(dir);
    if (!fs.existsSync(absDir)) {
        console.error(`Directory not found: ${absDir}`);
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// Role configuration from JSON
//
// This poller reads all configuration from the agent's JSON config file
// instead of hardcoding role-specific values. Random wake is enabled
// automatically when min_wait_minutes and max_wait_minutes are set.
// ---------------------------------------------------------------------------

const MINUTE = 60 * 1000;

/**
 * @typedef {Object} RoleConfig
 * @property {string} display   Human name shown in logs.
 * @property {string} sweep       What this role calls its random wake.
 * @property {number} min_wait_minutes  Shortest idle wait before a random wake.
 * @property {number} max_wait_minutes  Longest idle wait before a random wake.
 * @property {number} mission_chance  0..1 probability of a special mission on a random wake.
 * @property {string[]} random_tasks  Optional pool of themed special missions.
 * @property {boolean} random_wake    Whether random wake is enabled.
 */

/**
 * Derive the agent name from watched dirs or the shorthand agent token.
 * @param {string[]} watchedDirs
 * @param {string} shorthandAgent
 * @returns {string} Agent name (e.g., 'overseer', 'nitpicker')
 */
function resolveAgentName(watchedDirs, shorthandAgent) {
    if (shorthandAgent) {
        return shorthandAgent;
    }
    for (const dir of watchedDirs) {
        const absDir = path.resolve(dir);
        const base = path.basename(absDir);
        const parent = path.basename(path.dirname(absDir));
        if (parent === 'slack') {
            return base;
        }
    }
    // Fallback: return basename of first dir
    return path.basename(watchedDirs[0]);
}

const agentName = resolveAgentName(dirs, shorthandAgent);

/**
 * Read complete role configuration from the agent's JSON config file
 * @param {string} agentName - The agent name (e.g., 'overseer', 'nitpicker')
 * @param {string} workflow - The workflow directory name (e.g., 'developer-team')
 * @returns {RoleConfig} Role configuration with defaults
 */
function readRoleConfig(agentName, workflow) {
    const defaultConfig = {
        display: `The ${agentName}`,
        sweep: 'sweep',
        min_wait_minutes: 10,
        max_wait_minutes: 20,
        mission_chance: 0,
        random_tasks: [],
        random_wake: false
    };

    try {
        const workflowDir = workflow || resolveWorkflowFromDirs(dirs);
        const configPath = path.join(REPO_ROOT, '.agents/workflows', workflowDir, 'co-workers', `${agentName}.prompt.json`);
        if (!fs.existsSync(configPath)) {
            console.log(`Config file not found for ${agentName}, using defaults`);
            return defaultConfig;
        }
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        // Random wake is enabled when both min_wait_minutes and max_wait_minutes
        // are supplied. It can be explicitly disabled with random_wake: false.
        let randomWake = config.min_wait_minutes !== undefined && config.max_wait_minutes !== undefined;
        if (config.random_wake === false) {
            randomWake = false;
        } else if (config.random_wake === true) {
            randomWake = true;
        }

        // Validate and normalize numeric values — keep the rest of the config even if one number is off.
        // Only validate min/max_wait_minutes when explicitly set; absent means random wake is disabled.
        let minWaitMinutes = config.min_wait_minutes !== undefined
            ? Number(config.min_wait_minutes)
            : defaultConfig.min_wait_minutes;
        let maxWaitMinutes = config.max_wait_minutes !== undefined
            ? Number(config.max_wait_minutes)
            : defaultConfig.max_wait_minutes;
        let missionChance = config.mission_chance !== null && config.mission_chance !== undefined
            ? Number(config.mission_chance)
            : defaultConfig.mission_chance;

        if (config.min_wait_minutes !== undefined && (!Number.isFinite(minWaitMinutes) || minWaitMinutes < 0)) {
            console.warn(`Invalid min_wait_minutes (${config.min_wait_minutes}) for ${agentName}, using default`);
            minWaitMinutes = defaultConfig.min_wait_minutes;
        }
        if (config.max_wait_minutes !== undefined && (!Number.isFinite(maxWaitMinutes) || maxWaitMinutes < minWaitMinutes)) {
            console.warn(`Invalid max_wait_minutes (${config.max_wait_minutes}) for ${agentName}, using default`);
            maxWaitMinutes = defaultConfig.max_wait_minutes;
            // Also reset min to default so the pair stays valid
            minWaitMinutes = defaultConfig.min_wait_minutes;
        }
        if (!Number.isFinite(missionChance) || missionChance < 0 || missionChance > 1) {
            console.warn(`Invalid mission_chance (${config.mission_chance}) for ${agentName}, using default`);
            missionChance = defaultConfig.mission_chance;
        }

        // Validate random_tasks is array of strings
        let randomTasks = [];
        if (config.random_tasks && Array.isArray(config.random_tasks)) {
            randomTasks = config.random_tasks.filter(task => typeof task === 'string');
            if (randomTasks.length !== config.random_tasks.length) {
                console.warn(`Some random_tasks were not strings for ${agentName}, filtered them out`);
            }
        }

        return {
            display: config.display || defaultConfig.display,
            sweep: config.sweep || defaultConfig.sweep,
            min_wait_minutes: minWaitMinutes,
            max_wait_minutes: maxWaitMinutes,
            mission_chance: missionChance,
            random_tasks: randomTasks,
            random_wake: randomWake
        };
    } catch (error) {
        console.error(`Error reading config for ${agentName}: ${error.message}, using defaults`);
        return defaultConfig;
    }
}

const role = readRoleConfig(agentName, workflowName);

function pickMission() {
    if (role.random_tasks.length === 0 || Math.random() >= role.mission_chance) {
        return null;
    }
    return role.random_tasks[Math.floor(Math.random() * role.random_tasks.length)];
}

// State file for tracking seen files (prevents instant re-trigger on existing files).
// Lives in the team's .temp/ folder (gitignored). Derived from the watched directories
// so concurrent agents don't share the same file
// (e.g. team-lead watches slack/team-lead + inbox → .await-state-team-lead-inbox.json).
const stateSlug = dirs.map(d => path.basename(d)).join('-');
const stateWorkflow = workflowName || resolveWorkflowFromDirs(dirs);
const stateFile = path.join(REPO_ROOT, '.agents/workflows', stateWorkflow, '.temp', `.await-state-${stateSlug}.json`);
fs.mkdirSync(path.dirname(stateFile), { recursive: true });
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

let randomTimeoutMs = null;

if (role.random_wake) {
    const minMs = role.min_wait_minutes * MINUTE;
    const maxMs = role.max_wait_minutes * MINUTE;
    randomTimeoutMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

console.log(`Listening for new messages in: ${dirs.join(', ')}...`);
if (role.random_wake && randomTimeoutMs !== null) {
    console.log(`${role.display} will also wake for a ${role.sweep} in ~${Math.round(randomTimeoutMs / MINUTE)} min if it stays quiet...`);
}

// 2. Poll every 2 seconds. This is 100% reliable across all OS filesystems.
setInterval(checkDirectories, 2000);

// 3. Heartbeat every 30 seconds — gives the harness visible proof the process is alive.
setInterval(() => {
    console.log(`[heartbeat] ${role.display} still listening (${dirs.join(', ')})...`);
}, 30000);

// 4. Random timeout to wake up anyway — optionally with a themed special mission.
if (role.random_wake && randomTimeoutMs !== null) {
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
}

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
