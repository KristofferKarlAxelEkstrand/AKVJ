import { execFileSync } from 'node:child_process';
import { DEFAULT_WORKFLOW } from './root.js';
import { summarizeTeamHealth } from './lib/health.js';

/**
 * "Are the agents up?" — answered in under a second, without attaching to tmux.
 *
 * Usage:
 *   node agents-status.js [workflow] [--quiet] [--summary]
 *
 * Before this, the honest answer was "attach to the session and look", or read
 * a health report that could be fifty minutes old. The dashboard the human
 * actually opens carried no liveness data at all.
 *
 * Exits non-zero when an enabled agent is down, so this works as a shell check
 * or a cron guard as well as by eye.
 */

const args = process.argv.slice(2);
const workflow = args.find(arg => !arg.startsWith('--')) || DEFAULT_WORKFLOW;
const quiet = args.includes('--quiet');
const summary = args.includes('--summary');

/**
 * Panes tmux currently has for this workflow's session, keyed by agent id.
 *
 * Pane titles are set to the config `display` name (e.g. "Team Lead"), so we
 * map display → agent id before lookup. tmux not running is not an error — it
 * means the team is stopped, which is a perfectly good answer.
 *
 * @param {{agent: string, display: string}[]} agents
 * @returns {Map<string, string>} agent id → pane command
 */
function livePanes(agents) {
    const panes = new Map();
    const titleToAgent = new Map();
    for (const agent of agents) {
        titleToAgent.set(agent.display, agent.agent);
        titleToAgent.set(agent.agent, agent.agent);
    }
    try {
        const output = execFileSync('tmux', ['list-panes', '-t', `${workflow}-agents`, '-a', '-F', '#{pane_title}\t#{pane_current_command}'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        for (const line of output.trim().split('\n')) {
            const [title, command] = line.split('\t');
            if (!title) {
                continue;
            }
            const key = titleToAgent.get(title.trim());
            if (key) {
                panes.set(key, command?.trim() ?? '');
            }
        }
    } catch {
        // No tmux, or no session: leave the map empty.
    }
    return panes;
}

const report = summarizeTeamHealth(workflow);
const enabled = report.agents;
const down = report.down;
const panes = summary ? new Map() : livePanes(enabled);

/**
 * Tab-separated records for the control center, which paints them but owns no
 * liveness logic of its own — the pane count it used to show counted panes
 * whose CLI had already died.
 *
 * team   <up> <total> <down> <alerts> <flaps>
 * down   <agent> <heartbeatAge|never> <pid|unknown>
 * alert  <agent> <reason>
 * flap   <agent> <restarts>
 */
function printSummary() {
    const rows = [['team', report.up, report.total, down.length, report.alerts.length, report.flapping.length]];
    for (const agent of down) {
        rows.push(['down', agent.agent, agent.heartbeatAge === null ? 'never' : `${agent.heartbeatAge}s`, agent.pid ?? 'unknown']);
    }
    for (const alert of report.alerts) {
        // An alert for an agent already listed as down adds no information.
        if (!down.some(agent => agent.agent === alert.agent)) {
            rows.push(['alert', alert.agent, alert.reason]);
        }
    }
    for (const entry of report.flapping) {
        rows.push(['flap', entry.agent, entry.restarts]);
    }
    for (const row of rows) {
        console.log(row.join('\t'));
    }
}

if (summary) {
    printSummary();
} else if (!quiet) {
    const columns = [
        ['agent', agent => agent.agent],
        [
            'state',
            agent => {
                if (agent.state === 'up') {
                    return 'up';
                }
                if (agent.state === 'down') {
                    return 'DOWN';
                }
                if (agent.stateReason === 'poller-gone') {
                    return 'busy';
                }
                return '?';
            }
        ],
        ['pid', agent => (agent.pid === null ? '—' : agent.pidAlive ? String(agent.pid) : 'gone')],
        ['heartbeat', agent => (agent.heartbeatAge === null ? 'never' : `${agent.heartbeatAge}s`)],
        ['pane', agent => (panes.size === 0 ? '—' : (panes.get(agent.agent) ?? 'missing'))],
		[
			'awaiting',
			agent => {
				const waitingOn = agent.awaiting?.waitingOn;
				if (waitingOn == null || waitingOn === '') {
					return '—';
				}
				return Array.isArray(waitingOn) ? waitingOn.join(',') : String(waitingOn);
			}
		],
		['task', agent => agent.task ?? '—']
	];

	const rows = enabled.map(agent => columns.map(([, read]) => read(agent)));
	const widths = columns.map(([heading], index) =>
		Math.max(heading.length, ...rows.map(row => String(row[index] ?? '').length))
	);
	const render = cells => cells.map((cell, index) => String(cell ?? '').padEnd(widths[index])).join('  ').trimEnd();

    console.log(render(columns.map(([heading]) => heading)));
    console.log(render(widths.map(width => '─'.repeat(width))));
    for (const row of rows) {
        console.log(render(row));
    }

    if (report.disabled.length > 0) {
        console.log(`\ndisabled: ${report.disabled.map(agent => agent.agent).join(', ')}`);
    }
    if (!report.sessionRunning) {
        console.log(`\nNo tmux session "${workflow}-agents" — the team is not running, so every agent reads DOWN.`);
        console.log('Any live pid above belongs to an orphan poller that outlived the session.');
    }
}

if (down.length > 0) {
    console.error(report.sessionRunning ? `\n${down.length} agent(s) down: ${down.map(agent => agent.agent).join(', ')}` : `\nTeam "${workflow}" is not running — all ${down.length} enabled agent(s) are down.`);
    process.exit(1);
}

if (!quiet && !summary) {
    console.log(`\nAll ${enabled.length} enabled agents accounted for.`);
}
