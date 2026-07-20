import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from '../root.js';

/**
 * Shared liveness reading for the health report, the status command, and the
 * dashboard banner.
 *
 * All three used to be different opinions about the same question. The Health
 * Inspector agent computed heartbeat ages in its head every 40 minutes, the
 * dashboard showed nothing at all, and the monitor trusted file mtime alone —
 * which is how a zombie poller kept a dead session looking alive.
 */

const STALE_HEARTBEAT_SECONDS = 300;

// Mirrors FLAP_MAX_RESTARTS / FLAP_WINDOW_SECONDS in `run-team`. The monitor
// writes uptime.log with those thresholds; every reader here interprets it with
// the same ones. Change one, change both.
const FLAP_MAX_RESTARTS = 3;
const FLAP_WINDOW_SECONDS = 900;

/**
 * @typedef {Object} AgentHealth
 * @property {string} agent
 * @property {string} display
 * @property {boolean} enabled
 * @property {boolean} sessionRunning   Whether the team's tmux session exists.
 * @property {number|null} pid          Poller pid from the heartbeat, if any.
 * @property {boolean} pidAlive
 * @property {number|null} heartbeatAge Seconds since the heartbeat was written.
 * @property {'up'|'down'|'unknown'} state
 * @property {'session-gone'|'poller-gone'|'heartbeat-stale'|null} stateReason
 *   `poller-gone` with state `unknown` means mid-turn (poller exited; CLI may still be working).
 * @property {{waitingOn?: string, reason?: string}|null} awaiting
 * @property {string|null} task         Task id currently assigned, if any.
 */

/** @param {string} workflow */
export function workflowRoot(workflow) {
    return path.join(REPO_ROOT, '.agents/workflows', workflow);
}

/**
 * Is the team's tmux session up?
 *
 * The pollers are started as background tasks through each agent's harness, so
 * they are not children of their pane. `tmux kill-session` therefore leaves
 * them running, and an orphan poller keeps rewriting its heartbeat with a live
 * pid — which made every pid-based reader here report a stopped team as up.
 * The session is the decisive signal: no session, no team.
 *
 * `AKVJ_HEALTH_SESSION` forces the answer (`1`/`0`) for tests, which run
 * against throwaway workflow trees that never had a session.
 *
 * @param {string} workflow
 * @returns {boolean}
 */
export function isSessionRunning(workflow) {
    const override = process.env.AKVJ_HEALTH_SESSION;
    if (override === '1' || override === '0') {
        return override === '1';
    }
    try {
        execFileSync('tmux', ['has-session', '-t', `${workflow}-agents`], { stdio: 'ignore' });
        return true;
    } catch {
        // No tmux binary, or no session: either way the team is not running.
        return false;
    }
}

/** @returns {boolean} */
export function isProcessAlive(pid) {
    if (typeof pid !== 'number' || Number.isNaN(pid)) {
        return false;
    }
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        // EPERM means the process exists but belongs to someone else — alive
        // for our purposes. Only ESRCH proves it is gone.
        return error.code === 'EPERM';
    }
}

/** Agent names declared by config, in a stable order. */
export function listAgents(workflow) {
    const coWorkersDir = path.join(workflowRoot(workflow), 'co-workers');
    try {
        return fs
            .readdirSync(coWorkersDir)
            .filter(name => name.endsWith('.prompt.json'))
            .map(name => name.replace(/\.prompt\.json$/, ''))
            .sort();
    } catch {
        return [];
    }
}

/** @returns {Record<string, unknown>} */
function readJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return {};
    }
}

/**
 * Which task, if any, an agent is currently carrying — read from task
 * frontmatter rather than from messages, because under peer-to-peer handoffs
 * the task file is the only place ownership is authoritative.
 *
 * @returns {Map<string, string>} agent → task id
 */
function assignedTasks(workflow) {
    const owners = new Map();
    const dir = path.join(workflowRoot(workflow), 'tasks/working-on');
    let entries;
    try {
        entries = fs.readdirSync(dir);
    } catch {
        return owners;
    }
    for (const name of entries) {
        if (!name.endsWith('.md')) {
            continue;
        }
        const assignee = /^assignee:\s*(\S+)/m.exec(fs.readFileSync(path.join(dir, name), 'utf8'))?.[1];
        if (assignee && assignee !== 'none') {
            owners.set(assignee, name.split('-')[0]);
        }
    }
    return owners;
}

/**
 * Read the health of every declared agent.
 *
 * Heartbeats are only written while `await-messages.js` sleeps. When the agent
 * wakes, the poller exits and leaves a heartbeat whose pid is dead — that is
 * the normal mid-turn state (`unknown` / `poller-gone`), not a death. A live
 * pid means the agent is asleep waiting for mail (`up`).
 *
 * No heartbeat at all is also `unknown`. A heartbeat without a pid (legacy)
 * falls back to age. Truly dead agents are the monitor's job (pane CLI check);
 * this layer must not false-alarm every working turn.
 *
 * A missing tmux session outranks all of that. Orphan pollers outlive the
 * session that started them, so their pids prove nothing about the team.
 *
 * @param {string} workflow
 * @returns {AgentHealth[]}
 */
export function readTeamHealth(workflow) {
    const sessionRunning = isSessionRunning(workflow);
    const root = workflowRoot(workflow);
    const heartbeatDir = path.join(root, 'health/heartbeats');
    const awaitingDir = path.join(root, 'health/awaiting');
    const coWorkersDir = path.join(root, 'co-workers');
    const owners = assignedTasks(workflow);
    const now = Date.now();

    return listAgents(workflow).map(agent => {
        const config = readJson(path.join(coWorkersDir, `${agent}.prompt.json`));
        const heartbeat = readJson(path.join(heartbeatDir, `${agent}.json`));
        const awaiting = readJson(path.join(awaitingDir, `${agent}.json`));

        const pid = typeof heartbeat.pid === 'number' ? heartbeat.pid : null;
        const pidAlive = pid !== null && isProcessAlive(pid);
        const heartbeatAge = typeof heartbeat.ts === 'number' ? Math.round((now - heartbeat.ts) / 1000) : null;

        let state = 'unknown';
        let stateReason = null;
        if (!sessionRunning) {
            state = 'down';
            stateReason = 'session-gone';
        } else if (pid !== null) {
            if (pidAlive) {
                state = 'up';
            } else {
                // Poller exited on wake; leftover dead pid = mid-turn, not down.
                state = 'unknown';
                stateReason = 'poller-gone';
            }
        } else if (heartbeatAge !== null) {
            const stale = heartbeatAge > STALE_HEARTBEAT_SECONDS;
            state = stale ? 'down' : 'up';
            stateReason = stale ? 'heartbeat-stale' : null;
        }

        return {
            agent,
            display: typeof config.display === 'string' ? config.display : agent,
            enabled: config.enabled !== false,
            sessionRunning,
            pid,
            pidAlive,
            heartbeatAge,
            state,
            stateReason,
            awaiting: awaiting.waitingOn || awaiting.reason ? awaiting : null,
            task: owners.get(agent) ?? null
        };
    });
}

/**
 * Agents with an open alert file, written by the monitor when it gives up on
 * restarting one.
 *
 * @param {string} workflow
 * @returns {{agent: string, reason: string, since: string|null}[]}
 */
export function readAlerts(workflow) {
    const dir = path.join(workflowRoot(workflow), 'health/alerts');
    let names;
    try {
        names = fs.readdirSync(dir).filter(name => name.endsWith('.json'));
    } catch {
        // No alerts directory yet — nothing has ever gone wrong.
        return [];
    }
    return names.sort().map(name => {
        const alert = readJson(path.join(dir, name));
        return {
            agent: name.replace(/\.json$/, ''),
            reason: typeof alert.reason === 'string' ? alert.reason : 'unknown',
            since: typeof alert.since === 'string' ? alert.since : null
        };
    });
}

/**
 * Restarts recorded for an agent inside a window, counted from the
 * append-only `health/uptime.log` rather than from memory — an agent that
 * flaps, takes the monitor down with it, and flaps again is exactly the case
 * an in-memory counter would miss.
 *
 * @param {string} workflow
 * @param {string} agent
 * @param {number} [windowSeconds]
 * @returns {number}
 */
export function countRecentRestarts(workflow, agent, windowSeconds = FLAP_WINDOW_SECONDS) {
    let log;
    try {
        log = fs.readFileSync(path.join(workflowRoot(workflow), 'health/uptime.log'), 'utf8');
    } catch {
        return 0;
    }
    const cutoff = Date.now() - windowSeconds * 1000;
    let count = 0;
    for (const line of log.split('\n')) {
        if (line.trim() === '') {
            continue;
        }
        let event;
        try {
            event = JSON.parse(line);
        } catch {
            // A torn write from a crashing monitor is not worth failing over.
            continue;
        }
        if (event.agent !== agent || event.event !== 'restart') {
            continue;
        }
        const at = Date.parse(event.ts);
        if (!Number.isNaN(at) && at >= cutoff) {
            count += 1;
        }
    }
    return count;
}

/**
 * @typedef {Object} TeamHealthSummary
 * @property {AgentHealth[]} agents   Enabled agents only.
 * @property {AgentHealth[]} disabled
 * @property {boolean} sessionRunning
 * @property {number} up
 * @property {number} total
 * @property {AgentHealth[]} down
 * @property {{agent: string, reason: string, since: string|null}[]} alerts
 * @property {{agent: string, restarts: number}[]} flapping
 */

/**
 * One reading of "how is this team doing" for every surface that asks —
 * the status command, the dashboard banner, and the control center.
 *
 * @param {string} workflow
 * @returns {TeamHealthSummary}
 */
export function summarizeTeamHealth(workflow) {
    const team = readTeamHealth(workflow);
    const agents = team.filter(agent => agent.enabled);
    const flapping = agents
        .map(agent => ({ agent: agent.agent, restarts: countRecentRestarts(workflow, agent.agent) }))
        .filter(entry => entry.restarts >= FLAP_MAX_RESTARTS);

    return {
        agents,
        disabled: team.filter(agent => !agent.enabled),
        sessionRunning: team[0]?.sessionRunning ?? isSessionRunning(workflow),
        up: agents.filter(agent => agent.state === 'up').length,
        total: agents.length,
        down: agents.filter(agent => agent.state === 'down'),
        alerts: readAlerts(workflow),
        flapping
    };
}

/**
 * Files older than `minutes` in a directory, newest first.
 *
 * @returns {{name: string, ageMinutes: number}[]}
 */
export function stalledFiles(dir, minutes) {
    const cutoff = Date.now() - minutes * 60_000;
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return [];
    }
    return entries
        .filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
        .map(entry => ({ name: entry.name, mtime: fs.statSync(path.join(dir, entry.name)).mtimeMs }))
        .filter(file => file.mtime < cutoff)
        .map(file => ({ name: file.name, ageMinutes: Math.round((Date.now() - file.mtime) / 60_000) }))
        .sort((a, b) => b.ageMinutes - a.ageMinutes);
}

/** Count message-shaped files directly in a directory. */
export function countFiles(dir) {
    try {
        return fs.readdirSync(dir, { withFileTypes: true }).filter(entry => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md').length;
    } catch {
        return 0;
    }
}

export { STALE_HEARTBEAT_SECONDS, FLAP_MAX_RESTARTS, FLAP_WINDOW_SECONDS };
