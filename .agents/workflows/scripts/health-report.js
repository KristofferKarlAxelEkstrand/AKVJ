import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';
import { readTeamHealth, isSessionRunning, stalledFiles, countFiles, workflowRoot } from './lib/health.js';

/**
 * The team-health snapshot, as a script.
 *
 * This was a role. The Health Inspector agent woke every 40–50 minutes to read
 * JSON files, subtract timestamps, compare against 300, and format markdown —
 * a full CLI turn spent on arithmetic, producing a report that was up to fifty
 * minutes stale by the time anyone read it. Its prompt read like a spec for
 * this file, so it became one.
 *
 * Usage:
 *   node health-report.js [workflow]
 *
 * Writes health/reports/[HEALTH-REPORT]-<iso>.md and keeps the newest few.
 */

const KEEP_REPORTS = 3;
const STALLED_MINUTES = 10;

const workflow = process.argv[2] || DEFAULT_WORKFLOW;
const root = workflowRoot(workflow);
const reportsDir = path.join(root, 'health/reports');

/**
 * One line per agent.
 *
 * The old prompt had to hedge — "a busy agent looks identical to a dead one" —
 * because heartbeat age was the only signal available to it. The pid recorded
 * in the heartbeat removes the ambiguity: a live pid is a poller that really is
 * waiting.
 *
 * @param {import('./lib/health.js').AgentHealth} agent
 * @returns {string}
 */
function heartbeatLine(agent) {
    if (!agent.enabled) {
        return `- ${agent.display}: disabled`;
    }
    const age = agent.heartbeatAge === null ? 'never' : `${agent.heartbeatAge}s ago`;
    if (agent.stateReason === 'session-gone') {
        // A heartbeat can still be fresh here: the poller outlived the session.
        return `- ${agent.display}: ${age} ✗ down (team not running — no tmux session)`;
    }
    if (agent.state === 'down') {
        return `- ${agent.display}: ${age} ✗ down (${agent.stateReason === 'heartbeat-stale' ? 'heartbeat stale, no poller pid' : agent.stateReason ?? 'unknown'})`;
    }
    if (agent.state === 'unknown') {
        if (agent.stateReason === 'poller-gone') {
            return `- ${agent.display}: ${age} — mid-turn (poller idle; CLI may still be working)`;
        }
        return `- ${agent.display}: ${age} — no heartbeat yet`;
    }
    return `- ${agent.display}: ${age} ✓`;
}

function restartRequests() {
    const dir = path.join(root, 'health/restart-requests');
    try {
        return fs
            .readdirSync(dir)
            .filter(name => name.endsWith('.json'))
            .map(name => {
                let reason = 'no reason given';
                try {
                    reason = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')).reason ?? reason;
                } catch {
                    // Keep the default.
                }
                return `- ${name.replace(/\.json$/, '')}: ${reason} — ${name}`;
            });
    } catch {
        return [];
    }
}

const team = readTeamHealth(workflow);
const sessionRunning = isSessionRunning(workflow);
const awaiting = team.filter(agent => agent.awaiting !== null);
const stalledMail = stalledFiles(path.join(root, 'mail/in'), STALLED_MINUTES);
const stalledTasks = stalledFiles(path.join(root, 'tasks/todo'), STALLED_MINUTES);
const requests = restartRequests();
const down = team.filter(agent => agent.enabled && agent.state === 'down');

const timestamp = new Date().toISOString();
const lines = [
    `# Health Report — ${timestamp}`,
    '',
    '## Heartbeats',
    ...(sessionRunning ? [] : [`- **Team is not running** — no tmux session \`${workflow}-agents\`. Every agent below is down regardless of its heartbeat.`]),
    ...team.map(heartbeatLine),
    '',
    '## Work in Flight',
    `- Pending mail in mail/in/: ${countFiles(path.join(root, 'mail/in'))}`,
    `- Tasks in tasks/todo/: ${countFiles(path.join(root, 'tasks/todo'))}`,
    `- Tasks in tasks/working-on/: ${countFiles(path.join(root, 'tasks/working-on'))}`,
    ...(awaiting.length === 0 ? ['- Nobody is reporting an awaiting status'] : awaiting.map(agent => `- ${agent.display}: awaiting ${agent.awaiting.waitingOn ?? '?'}${agent.awaiting.reason ? ` (${agent.awaiting.reason})` : ''}`)),
    '',
    '## Restart Requests',
    ...(requests.length === 0 ? ['- None pending'] : requests),
    '',
    '## Stalled Work',
    ...(stalledMail.length === 0 && stalledTasks.length === 0
        ? [`- Nothing older than ${STALLED_MINUTES} minutes`]
        : [...stalledMail.map(file => `- mail/in/${file.name} — ${file.ageMinutes}m`), ...stalledTasks.map(file => `- tasks/todo/${file.name} — ${file.ageMinutes}m`)]),
    ''
];

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, `[HEALTH-REPORT]-${timestamp}.md`), lines.join('\n'));

// Snapshots are transient — the newest few are the only ones anyone reads, and
// an unbounded pile is what made the old role's output easy to ignore.
const reports = fs
    .readdirSync(reportsDir)
    .filter(name => name.startsWith('[HEALTH-REPORT]-'))
    .sort()
    .reverse();
for (const stale of reports.slice(KEEP_REPORTS)) {
    fs.rmSync(path.join(reportsDir, stale), { force: true });
}

const summary = down.length > 0 ? `${down.length} agent(s) DOWN: ${down.map(agent => agent.agent).join(', ')}` : `all ${team.filter(agent => agent.enabled).length} enabled agents accounted for`;
console.log(`Health report written to ${path.relative(REPO_ROOT, reportsDir)} — ${summary}`);
process.exit(down.length > 0 ? 1 : 0);
