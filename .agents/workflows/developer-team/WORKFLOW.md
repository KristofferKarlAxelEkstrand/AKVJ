# Multi-Agent System

## Overview

Run multiple AI agents in tmux panes with JSON configuration and file-based IPC.

## Quick Start

```bash
# List running teams
/workspaces/AKVJ/.agents/workflows/scripts/run-team --list

# Start a workflow (interactive)
/workspaces/AKVJ/.agents/workflows/scripts/run-team

# Start specific workflow
/workspaces/AKVJ/.agents/workflows/scripts/run-team developer-team

# Restart specific agent
/workspaces/AKVJ/.agents/workflows/scripts/run-team --restart developer-team overseer

# Start health monitor
/workspaces/AKVJ/.agents/workflows/scripts/run-team --monitor developer-team
```

## Architecture

**Components:**
- `run-team` - Starts and manages agents; validates every config before touching tmux; runs the health monitor in a second window
- Agent JSON configs - Per-agent settings; prompts are composed separately (below)
- `await-messages.js` - The wake cycle; writes heartbeat JSON to `health/heartbeats/` while an agent sleeps
- `post-awaiting.js` - Lets an agent publish what/who it is waiting on to `health/awaiting/`
- File-based IPC - Slack-like directory structure, with a typed envelope on every message

**Agent Prompts:**

An agent's prompt is composed, not stored. `generate-prompt.js` assembles it from three
sources, so no rule is written twice:

1. `co-workers/<agent>.prompt.md` — what only that role does, with the shared rules it
   opts into declared in frontmatter:
   ```yaml
   ---
   partials: [mailbox-hygiene, messaging, git-commits, sleep-step]
   ---
   ```
2. `co-workers/_shared/*.md` — one file per cross-cutting rule (`git-commits`,
   `mailbox-hygiene`, `sleep-step`, `concurrency-locks`, `self-verification`,
   `messaging`, `memory-discipline`). Editing one of these changes every agent that
   declares it, which is the point: these used to be copy-pasted across nine prompts.
3. The generated identity line and wake command, derived from the JSON config.

The composed text goes to `.temp/prompt-<agent>.txt` and is fed to the CLI whole, so an
agent starts with complete instructions and nothing can drift between the prompt it was
launched with and the files on disk. An unknown partial name fails pre-flight.

**Agent Config:**

Only `display` is required — everything else has a default.

```json
{
  "display": "Human Readable Name",
  "enabled": true,               // Optional: set false to skip this agent without deleting the config
  "model": "SWE-1.6",            // Optional: model name — must belong to this cli's catalog (control-center `m`); omit to let the CLI choose
  "cli": "devin",                // Optional: devin | claude | copilot | antigravity | cursor (default devin)
  "permission_mode": "yolo",     // Optional: permission mode passed to the CLI — see table below
  "watch_folders": ["slack/team-lead", "mail/in"],  // Optional: folders that wake this agent (default: slack/<agent>)
  "wait_script": "node .../await-messages.js ...",  // Optional: defaults to await-messages.js for this workflow + agent
  "random_tasks": ["Optional task"],
  "sweep": "sweep",              // Optional: label for the random wake
  "min_wait_minutes": 10,        // Optional: enables random wake when both min and max are set
  "max_wait_minutes": 20,        // Optional: enables random wake when both min and max are set
  "mission_chance": 0.3,         // Optional: probability of a random_tasks mission on random wake
  "random_wake": false,          // Optional: force random wake on/off (auto-detected from min/max if omitted)
  "fallback_wake_minutes": 60    // Optional: safety-net mailbox re-check for agents with no random wake; 0 disables
}
```

**Supported CLIs:**

| `cli`         | Binary         | Default `permission_mode`      | Other accepted modes                          |
| ------------- | -------------- | ------------------------------ | --------------------------------------------- |
| `devin`       | `devin`        | `yolo`                         | `default`                                     |
| `claude`      | `claude`       | `bypassPermissions`            | `default`, `acceptEdits`                      |
| `copilot`     | `copilot`      | `allow-all-tools`              | `allow-all`, `default`                        |
| `antigravity` | `agy`          | `dangerously-skip-permissions` | `accept-edits`, `plan`, `default`             |
| `cursor`      | `cursor-agent` | `force`                        | `yolo`, `auto-review`, `plan`, `ask`, `default` |

Defaults are the unattended setting for each CLI — agents run with no human at the pane.

`model` is validated at pre-flight against `.agents/workflows/scripts/cli-models.json`. A name that
belongs to another CLI (classic copy-paste: `"cli": "copilot"` with leftover `"model": "SWE-1.7 Max"`)
fails before tmux starts. Refresh the catalog from control-center (`m`).

`devin`, `antigravity`, and `cursor` keep one session open for the whole run
(`agy --prompt-interactive` / `cursor-agent` live TUI, plus workspace pins). The composed
sleep-step tells them to background `await-messages` themselves — do not type into an
attached pane or you will interrupt the TUI.

`claude` and `copilot` run a single prompt and exit, so they run in a shell loop: CLI turn →
`wait_script` blocks until new mail → next turn. That makes `wait_script` mandatory for those
two (it is the only blocking step), and its default already covers it. The loop also enforces
`ONESHOT_MIN_LOOP_SECONDS` (default 30) so an instantly-exiting CLI (e.g. unauthenticated
copilot) plus a fast wait cannot hot-spin — without that floor, `pane_has_live_cli` keeps seeing
the flickering binary and the monitor treats the agent as busy until `HUNG_AGENT_SECONDS`.

Cursor Grok effort/speed is **not** a separate config field — pick the variant via the model ID
(e.g. `cursor-grok-4.5-high`, `cursor-grok-4.5-high-fast`, `cursor-grok-4.5-low`).

Install missing CLIs from control-center's `i` menu (`npm run control-center`). Auth status and
login hints appear on the CLI TOOLS panel; re-probe auth with `u`, refresh models with `m`.

## Core Agents

- **Team Lead** - Coordinates work, triages requests
- **AKVJ Developer** - Core AKVJ development
- **Mainframe Developer** - Mainframe tooling
- **Utility Developer** - Everything outside both workspaces: root config, monorepo + workflow scripts, CI, e2e
- **QA Reviewer** - Code review and QA (`review: machine` tasks bypass it via `machine-review.js`)
- **Overseer** - High-level oversight (10-20 min sweeps)
- **Nitpicker** - Code quality (15-30 min sweeps)

## Optional Agents

- **Test Marshal** - Test coverage (20-40 min sweeps)
- **Quartermaster** - Dependencies (30-60 min sweeps)
- **Field Tester** - Runs suites, the clip pipeline, and the API to find real failures (25-45 min sweeps); files `[BUG]` with repro steps

*(Health Inspector retired 2026-07-20 — `health-report.js` does the same audit every monitor pass, instantly and for free. Its config is kept with `"enabled": false` if you ever want narrative analysis back.)*

## Guard Rails

Every agent runs with permissions bypassed (`yolo` / `bypassPermissions`), so the protocol's "the
human owns commits" is prompt text — a rule, not a control. `.githooks/` is the control, armed by
`run-team` at startup via `core.hooksPath`:

| Hook | Refuses |
| --- | --- |
| `pre-push` | every push |
| `pre-commit` | `.env` / keys / credential-shaped diffs, `run-team`, `await-messages.js`, `control-center`, `.github/workflows/`, binary assets |

The human overrides with `AKVJ_HUMAN=1` (`AKVJ_HUMAN=1 git commit …`). Agents do not work around a
blocked hook — they escalate through `mail/out/`.

## Is The Team Up?

```bash
npm run agents:status     # one table: state, poller pid, heartbeat age, pane, awaiting, task
npm run agents:health     # write a fresh snapshot to health/reports/
npm run agents:ensure     # start the team only if its session is missing (safe from cron)
```

`agents:status` exits non-zero when an enabled agent is down, so it doubles as a shell check. The
dashboard also carries a **Team Health** banner now, so a death is visible in the file people
already open.

`npm run control-center` shows the same reading — its TEAMS line counts agents whose poller pid is
alive (it used to count tmux panes, which a dead CLI leaves behind), and a **TEAM HEALTH** panel
under it lists down agents, open alerts, and anyone flapping. `agents:status` is the detail view,
not the only view.

The monitor records every event to `health/uptime.log` (append-only JSONL: `down`, `restart`,
`recovered`, `flap`) and keeps an alert file per down agent in `health/alerts/`, cleared
automatically on recovery. "How long was QA down?" is answerable from the log.

**Flap escalation:** past `FLAP_MAX_RESTARTS` (3) inside `FLAP_WINDOW_SECONDS` (900), the monitor
stops restarting that agent, raises an alert, and files a `mail/out/` question. An agent dying that
often is broken in a way a restart does not fix, and looping forever only hides it.

**Surviving a reboot:** nothing notices if the tmux session itself dies. `--ensure` is the guard —
add it to cron if you want the team to come back on its own. It starts the session **detached**
(no `tmux attach`), so cron does not hang on a missing TTY:

```cron
*/5 * * * * cd /workspaces/AKVJ && npm run agents:ensure >> /tmp/akvj-agents.log 2>&1
```

## Health Monitoring

**Restart Requests:**
Agents can request restarts by creating files:
```bash
echo '{"reason":"stuck"}' > .agents/workflows/developer-team/health/restart-requests/overseer.json
```

**Health Directory:**
```
.agents/workflows/{workflow}/health/
├── heartbeats/           # Agent heartbeat files (updated by await-messages.js)
├── restart-requests/     # Agent restart requests
├── awaiting/             # Agents report what/who they are waiting on
├── reports/              # health-report.js snapshots (transient, newest 3)
├── alerts/               # One file per agent currently down; cleared on recovery
├── uptime.log            # Append-only: down / restart / recovered / flap
└── {agent}-pane.json    # Pane tracking (stable pane_id + positional pane_index)
```

## File Structure

```
.agents/workflows/
├── scripts/
│   ├── run-team                 # Start/manage agents + health monitor
│   ├── await-messages.js        # The wake cycle
│   ├── generate-prompt.js       # Composes prompts from role + partials
│   ├── detect-stalled-work.js   # One restart request per stalled item
│   ├── validate-messages.js     # Keeps message envelopes well-formed
│   ├── memory-log.js            # Append + compact agent memory
│   ├── generate-dashboard.js    # Dashboard generation
│   ├── check-references.js      # Catches docs pointing at deleted files
│   ├── check-specs.js           # Spec frontmatter, index, and task citations
│   ├── check-workflow.js        # All three checks (npm run agents:check)
│   ├── machine-review.js        # Verdict-by-verification for review: machine tasks
│   ├── agents-status.js         # "Are the agents up?" — one table, non-zero if not
│   ├── health-report.js         # Team-health snapshot (replaced the Health Inspector)
│   ├── lib/health.js            # Shared liveness reading (pid + heartbeat)
│   ├── post-awaiting.js         # Publish what an agent is waiting on
│   ├── archive-task.js          # Task archiving
│   ├── lib/                     # Shared frontmatter + message helpers
│   └── test/                    # Vitest suite
└── developer-team/
    ├── co-workers/
    │   ├── *.prompt.json        # Agent configs
    │   ├── *.prompt.md          # Role-specific instructions
    │   └── _shared/*.md         # Cross-cutting rules, composed into prompts
    ├── drafts/                  # Human scratchpad for in-progress specs
    ├── epics/                   # Multi-task initiatives (drafts/ todo/ done/)
    ├── mail/
    │   ├── in/                  # Requests and tickets for the Team Lead
    │   └── out/                 # Questions awaiting a human decision
    ├── slack/{agent}/           # Per-agent mailboxes
    ├── spec/                    # How the product works today (human-approved)
    │   ├── README.md            # Index + the rules for writing a spec
    │   └── process/             # Collaboration protocol, routine maintenance
    ├── memory/{agent}/          # Bounded agent logs (Digest + Recent)
    ├── archive/                 # Historical material; never read on wake
    ├── health/                  # Heartbeats, restart requests, reports
    ├── .temp/                   # Await state + composed prompts (gitignored)
    └── tasks/                   # Task kanban (todo/ working-on/ done/)
```

## Agent Memory

Each agent's log has two sections and is bounded by `memory-log.js`:

- **`## Digest`** — one line per past finding. Read in full before a sweep; this is what
  stops an agent re-reporting something it already filed.
- **`## Recent`** — the newest entries with full detail.

Agents append with `memory-log.js append`; the health monitor runs `compact-all`, folding
older entries into the digest. The agent whose context is being spent cannot be the one
responsible for trimming it, so the loop does it. Pre-compaction copies live in `archive/memory/`.

## Health Monitoring

`run-team` automatically creates a second tmux window named `monitor` running the health loop. The `--monitor` flag still works for standalone use, but the monitor is always started with the team.

- Heartbeat: `await-messages.js` writes `health/heartbeats/{agent}.json` every 30s **while the agent is asleep**. It stops during a working turn, so a stale heartbeat means "not currently waiting" — which is equally true of a busy agent and a dead one. It is a hint, never proof of death.
- Auto-restart: past `STALE_HEARTBEAT_SECONDS` (default 300) the monitor checks the agent's pane. A bare shell means the agent really is gone, so it restarts. A running CLI means it is working, so it is left alone until `HUNG_AGENT_SECONDS` (default 1800) catches a genuinely wedged process. `RESTART_COOLDOWN_SECONDS` (default 120) spaces out attempts.
- Stalled work: `detect-stalled-work.js` runs each pass and files a restart request for the agent named in a stalled item's `assignee`/`to` frontmatter — **once per item**, not on a repeating timer, and never for something already in `tasks/working-on/` or a backlog task with `assignee: none`. If an item is still there after its nudge, that is a decision to make, not a wake to fix.
- Restart requests: any agent can drop `health/restart-requests/{agent}.json`; the monitor picks it up on its next pass, subject to the same cooldown.
- Awaiting status: agents can run `node .agents/workflows/scripts/post-awaiting.js {workflow} {agent} "<waitingOn>" [reason]` to publish what they are waiting on; the monitor logs these statuses and `await-messages.js` includes them in the heartbeat JSON.
- Manual restart: `bash .agents/workflows/scripts/run-team --restart {workflow} {agent}`

Tmux shortcuts:

- `Ctrl+B` then `0` - Switch to agent panes window
- `Ctrl+B` then `1` - Switch to health monitor window
- `Ctrl+B` then Arrow keys - Switch panes within a window
- `Ctrl+B` then `d` - Detach (leave running)
- `tmux attach -t {workflow}-agents` - Reattach
- `run-team --stop {workflow}` - Stop all (kills the session **and** reaps the pollers; a bare `tmux kill-session` leaves them running, and an orphan poller keeps reporting the team as up)
