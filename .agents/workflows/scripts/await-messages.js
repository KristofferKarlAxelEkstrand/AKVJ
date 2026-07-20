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

    /**
     * Every agent watches the broadcast folder as well as its own mailbox.
     *
     * A change to a shared file used to be announced by hand-copying one notice
     * into every agent's folder — the protocol listed them by name, and that
     * list silently went stale twice as the team grew. Appending the folder here
     * rather than in each config means a new agent is reachable the moment it
     * exists, with nothing to remember.
     *
     * @param {string[]} dirs
     * @returns {string[]}
     */
    const withBroadcast = dirs => {
        const broadcastDir = path.join(workflowRoot, 'slack', 'all');
        // Created on demand: this folder is appended to every agent's watch
        // list without being declared anywhere, and a missing watch directory
        // is fatal to the poller. A workflow that has never used a broadcast
        // must not fail to start because of one.
        try {
            fs.mkdirSync(broadcastDir, { recursive: true });
        } catch {
            // If it cannot be created, the existence check below reports it.
        }
        return dirs.includes(broadcastDir) ? dirs : [...dirs, broadcastDir];
    };

    // CLI extra args take precedence (backwards compat), but if none are
    // given, read watch_folders from the agent's config JSON.
    const cliExtras = args.slice(2);
    if (cliExtras.length > 0) {
        const dirs = [path.join(workflowRoot, 'slack', agent)];
        for (const extra of cliExtras) {
            dirs.push(path.join(workflowRoot, extra));
        }
        return { dirs: withBroadcast(dirs), workflow, agent };
    }

    // Read watch_folders from config
    const configPath = path.join(workflowRoot, 'co-workers', `${agent}.prompt.json`);
    let watchFolders = null;
    try {
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (Array.isArray(config.watch_folders) && config.watch_folders.length > 0) {
                watchFolders = config.watch_folders;
            }
        }
    } catch {
        // Fall through to default
    }

    if (watchFolders) {
        const dirs = watchFolders.map(folder => path.join(workflowRoot, folder));
        return { dirs: withBroadcast(dirs), workflow, agent };
    }

    // Default: the agent's own slack folder, plus the broadcast folder.
    return { dirs: withBroadcast([path.join(workflowRoot, 'slack', agent)]), workflow, agent };
}

const argInfo = resolveArgs(rawArgs);
if (argInfo === null) {
    console.error('Usage: node await-messages.js <dir1> [dir2...]');
    console.error('       node await-messages.js <workflow> <agent> [extra-dir1] [extra-dir2...]');
    process.exit(1);
}

const { dirs, workflow: workflowName, agent: shorthandAgent } = argInfo;

const HEALTH_DIR = path.join(REPO_ROOT, '.agents/workflows', workflowName, 'health');
const HEARTBEAT_DIR = path.join(HEALTH_DIR, 'heartbeats');

// ---------------------------------------------------------------------------
// Poller ownership
//
// Restarting an agent's chat does not kill the poller its previous session
// started. Two pollers on one mailbox then do real damage, not just noise:
// they race on the shared state file (a lost update can burn the retry budget
// that exists to rescue dropped mail), one file wakes both sessions, and —
// worst — the orphan keeps rewriting `health/heartbeats/<agent>.json` every 30
// seconds. The health monitor reads that file's age as proof of life, so a
// session that is actually gone looks alive indefinitely and is never
// restarted. That is the shape of the ~11.5-hour QA stall in the protocol's
// changelog, and the reason it previously took a human running `ps` to notice.
//
// The newest poller wins. Each one claims the lock at startup; an older
// incarnation sees a pid that is not its own on its next tick and exits. No
// process kills another, no startup refusal can wedge a legitimate restart, and
// the system converges to exactly one poller per agent within ~2 seconds.
// ---------------------------------------------------------------------------

/** @returns {string} */
function lockFilePath(agent) {
    return path.join(REPO_ROOT, '.agents/workflows', workflowName, '.temp', `.await-lock-${agent}.json`);
}

/**
 * Claim ownership of this agent's mailbox for this process.
 *
 * @param {string} lockPath
 * @param {string} agent
 */
function claimPollerLock(lockPath, agent) {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    const previous = readPollerLock(lockPath);
    if (previous !== null && previous.pid !== process.pid && isProcessAlive(previous.pid)) {
        console.log(`[lock] taking over ${path.basename(lockPath)} from pid ${previous.pid} (older poller will exit within ~2s)`);
    }
    try {
        fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, agent, claimedAt: Date.now() }, null, 2));
    } catch (error) {
        console.error(`[lock] could not claim poller lock: ${error.message}`);
    }
}

/** @returns {{pid: number} | null} */
function readPollerLock(lockPath) {
    try {
        const parsed = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        return typeof parsed?.pid === 'number' ? parsed : null;
    } catch {
        return null;
    }
}

/** @returns {boolean} */
function isProcessAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

/**
 * Still the owner? A newer poller claiming the lock means this one is the
 * leftover of a session that has already been replaced.
 *
 * @returns {boolean}
 */
function ownsPollerLock(lockPath) {
    const lock = readPollerLock(lockPath);
    return lock === null || lock.pid === process.pid;
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
// Role configuration from JSON
//
// This poller reads all configuration from the agent's JSON config file
// instead of hardcoding role-specific values. Random wake is enabled
// automatically when min_wait_minutes and max_wait_minutes are set.
// ---------------------------------------------------------------------------

const MINUTE = 60 * 1000;

// Applied only to roles without a random wake, so every role has some scheduled
// path back to life even if a wake is missed.
const DEFAULT_FALLBACK_WAKE_MINUTES = 60;

/**
 * @typedef {Object} RoleConfig
 * @property {string} display   Human name shown in logs.
 * @property {string} sweep       What this role calls its random wake.
 * @property {number} min_wait_minutes  Shortest idle wait before a random wake.
 * @property {number} max_wait_minutes  Longest idle wait before a random wake.
 * @property {number} mission_chance  0..1 probability of a special mission on a random wake.
 * @property {string[]} random_tasks  Optional pool of themed special missions.
 * @property {boolean} random_wake    Whether random wake is enabled.
 * @property {number} fallback_wake_minutes  Safety-net wake for roles without a random wake; 0 disables.
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
const AWAITING_FILE = path.join(HEALTH_DIR, 'awaiting', `${agentName}.json`);
const POLLER_LOCK = lockFilePath(agentName);
claimPollerLock(POLLER_LOCK, agentName);

/**
 * Stand down when a newer poller has claimed this mailbox.
 *
 * Exits without touching the heartbeat or the awaiting file: those now belong
 * to the new owner, and clearing them would make a live agent look dead.
 */
function exitIfSuperseded() {
    if (ownsPollerLock(POLLER_LOCK)) {
        return;
    }
    console.log(`[lock] a newer poller owns ${agentName}; this one is a leftover and is exiting.`);
    process.exit(0);
}

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
        random_wake: false,
        fallback_wake_minutes: DEFAULT_FALLBACK_WAKE_MINUTES
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

        // Safety-net wake for roles with no random wake. Set to 0 to opt out.
        let fallbackWakeMinutes = config.fallback_wake_minutes !== undefined
            ? Number(config.fallback_wake_minutes)
            : defaultConfig.fallback_wake_minutes;
        if (!Number.isFinite(fallbackWakeMinutes) || fallbackWakeMinutes < 0) {
            console.warn(`Invalid fallback_wake_minutes (${config.fallback_wake_minutes}) for ${agentName}, using default`);
            fallbackWakeMinutes = defaultConfig.fallback_wake_minutes;
        }

        return {
            display: config.display || defaultConfig.display,
            sweep: config.sweep || defaultConfig.sweep,
            min_wait_minutes: minWaitMinutes,
            max_wait_minutes: maxWaitMinutes,
            mission_chance: missionChance,
            random_tasks: randomTasks,
            random_wake: randomWake,
            fallback_wake_minutes: fallbackWakeMinutes
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
// (e.g. team-lead watches slack/team-lead + mail/in → .await-state-team-lead-in.json).
const stateSlug = dirs.map(d => path.basename(d)).join('-');
const stateWorkflow = workflowName || resolveWorkflowFromDirs(dirs);
const stateFile = path.join(REPO_ROOT, '.agents/workflows', stateWorkflow, '.temp', `.await-state-${stateSlug}.json`);
fs.mkdirSync(path.dirname(stateFile), { recursive: true });

// How many times a single unchanged file may wake the agent.
//
// A wake is recorded *before* the agent has actually read anything — this
// process exits the moment it spots the file, and the CLI turn happens
// afterwards. If that turn dies (crash, harness timeout, restart), a
// write-once "seen" mark would bury the message forever: the file sits in the
// mailbox and nothing ever wakes the agent for it again. Allowing a second
// wake recovers exactly that case. It stays bounded so a file an agent
// deliberately leaves in place can never become a wake loop.
const MAX_WAKES_PER_FILE = 2;

/** @type {Map<string, {sig: string, wakes: number}>} */
const seenFiles = new Map();
let needsBaseline = false;

/**
 * Normalize a persisted entry. Older state files stored a bare signature string.
 * @param {unknown} entry
 * @returns {{sig: string, wakes: number} | null}
 */
function normalizeEntry(entry) {
    if (typeof entry === 'string') {
        return { sig: entry, wakes: MAX_WAKES_PER_FILE };
    }
    if (entry && typeof entry === 'object' && typeof entry.sig === 'string') {
        return { sig: entry.sig, wakes: Number(entry.wakes) || 0 };
    }
    return null;
}

try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const parsed = JSON.parse(raw);
    for (const [filePath, entry] of Object.entries(parsed)) {
        const normalized = normalizeEntry(entry);
        if (normalized !== null) {
            seenFiles.set(filePath, normalized);
        }
    }
    // An empty state file is *not* a first run — it means this poller has run
    // before and the mailbox happened to be empty. Baselining here would mark
    // anything that arrived while the agent was down as already seen, silently
    // swallowing exactly the mail a restart is supposed to pick up.
} catch {
    // No readable state file — genuine first run. Treat what is already on disk
    // as seen, so startup does not wake on every pre-existing file.
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

/**
 * May an unchanged file in this directory wake the agent more than once?
 *
 * Retries exist to recover mail whose handling turn died (see MAX_WAKES_PER_FILE),
 * and they rely on the Golden Hygiene Rule: a handled file is deleted or moved,
 * so anything still sitting there was probably never handled. `mail/out/` is the
 * exception — a question legitimately waits there until a human answers it, and
 * the answer edit changes the signature and wakes the agent on its own. Retrying
 * there would just re-wake the asker about its own unanswered question.
 *
 * @param {string} absDir
 * @returns {boolean}
 */
function allowsWakeRetry(absDir) {
    const parts = absDir.split(path.sep);
    if (parts.at(-2) === 'mail' && parts.at(-1) === 'out') {
        return false;
    }
    // `slack/all/` is shared, so readers do not delete what they have handled —
    // a broadcast legitimately stays in place until its author prunes it. The
    // retry that exists for un-handled personal mail would therefore re-wake
    // every agent on the team a second time, for nothing.
    return !(parts.at(-2) === 'slack' && parts.at(-1) === 'all');
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
                    seenFiles.set(fullPath, { sig, wakes: MAX_WAKES_PER_FILE });
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
    exitIfSuperseded();
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
                if (sig === null) {
                    continue;
                }

                const maxWakes = allowsWakeRetry(absDir) ? MAX_WAKES_PER_FILE : 1;
                const previous = seenFiles.get(fullPath);
                const isChanged = previous === undefined || previous.sig !== sig;
                const isUnacknowledged = previous !== undefined && previous.sig === sig && previous.wakes < maxWakes;

                if (isChanged) {
                    newFiles.push(file);
                    seenFiles.set(fullPath, { sig, wakes: 1 });
                } else if (isUnacknowledged) {
                    // Still here, unchanged, and a previous wake never resulted in
                    // the file being handled — the agent's turn most likely died.
                    newFiles.push(file);
                    seenFiles.set(fullPath, { sig, wakes: previous.wakes + 1 });
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
        clearAwaiting();
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

// Roles without a random wake (Team Lead, the developers, QA) used to have
// exactly one way to ever run again: a brand-new file landing in a watched
// folder. Any wake they missed was therefore unrecoverable — nothing else was
// scheduled to look. They now get a slow safety-net wake as well; finding an
// empty mailbox and going straight back to sleep is cheap.
let wakeTimeoutMs = null;
let wakeLabel = role.sweep;

if (role.random_wake) {
    const minMs = role.min_wait_minutes * MINUTE;
    const maxMs = role.max_wait_minutes * MINUTE;
    wakeTimeoutMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
} else if (role.fallback_wake_minutes > 0) {
    wakeTimeoutMs = role.fallback_wake_minutes * MINUTE;
    wakeLabel = 'mailbox re-check';
}

console.log(`Listening for new messages in: ${dirs.join(', ')}...`);
if (wakeTimeoutMs !== null) {
    console.log(`${role.display} will also wake for a ${wakeLabel} in ~${Math.round(wakeTimeoutMs / MINUTE)} min if it stays quiet...`);
}

function writeHeartbeat() {
    // A leftover poller writing this file is what makes a dead session look
    // alive to the monitor, so ownership is checked before the write, not after.
    exitIfSuperseded();

    const heartbeat = {
        ts: Date.now(),
        agent: agentName,
        display: role.display,
        pid: process.pid
    };

    try {
        const awaitingRaw = fs.readFileSync(AWAITING_FILE, 'utf8');
        const awaiting = JSON.parse(awaitingRaw);
        if (awaiting && (awaiting.waitingOn || awaiting.reason)) {
            heartbeat.awaiting = awaiting;
        }
    } catch {
        // No awaiting status set.
    }

    try {
        fs.mkdirSync(HEARTBEAT_DIR, { recursive: true });
        fs.writeFileSync(path.join(HEARTBEAT_DIR, `${agentName}.json`), JSON.stringify(heartbeat, null, 2));
    } catch (error) {
        console.error(`[heartbeat] failed to write heartbeat for ${agentName}: ${error.message}`);
    }

    console.log(`[heartbeat] ${role.display} still listening (${dirs.join(', ')})...`);
}

function clearAwaiting() {
    try {
        if (fs.existsSync(AWAITING_FILE)) {
            fs.rmSync(AWAITING_FILE);
        }
    } catch {
        // Non-critical — ignore cleanup errors.
    }
}

// 2. Poll every 2 seconds. This is 100% reliable across all OS filesystems.
setInterval(checkDirectories, 2000);

// 3. Heartbeat every 30 seconds — gives the harness visible proof the process is alive.
setInterval(writeHeartbeat, 30000);

// Send an immediate heartbeat so the monitor sees us right away.
writeHeartbeat();

// 4. Timed wake — a themed sweep for proactive roles, a plain mailbox re-check
//    for everyone else so no role can become permanently unreachable.
if (wakeTimeoutMs !== null) {
    setTimeout(() => {
        const mission = role.random_wake ? pickMission() : null;
        console.log(`\n========================================`);
        console.log(`${role.random_wake ? 'RANDOM ' : ''}${wakeLabel.toUpperCase()} TRIGGERED!`);
        console.log(`========================================\n`);
        console.log(`${role.display} waking up for a ${wakeLabel} (idle timeout)...`);
        if (mission) {
            console.log(`\n----------------------------------------`);
            console.log(`🎲 SPECIAL MISSION (optional focus for THIS sweep):`);
            console.log(`   ${mission}`);
            console.log(`Do it if it fits; skip it if something more important is waiting.`);
            console.log(`----------------------------------------\n`);
        }
        saveState();
        clearAwaiting();
        process.exit(0);
    }, wakeTimeoutMs);
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
