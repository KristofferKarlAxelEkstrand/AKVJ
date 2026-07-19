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
- `run-team` - Main script for starting/managing agents; runs pre-flight config validation before launching any tmux session
- Agent JSON configs - Configuration per agent
- `await-messages.js` - Message wake cycle (random wake enabled by agent config `min_wait_minutes`/`max_wait_minutes`)
- File-based IPC - Slack-like directory structure

**Agent Config:**
```json
{
  "display": "Human Readable Name",
  "enabled": true,               // Optional: set false to skip this agent without deleting the config
  "model": "SWE-1.6",
  "cli": "devin",                // Optional: CLI to launch (devin or claude; default devin)
  "permission_mode": "yolo",     // Optional: permission mode passed to the CLI (default: yolo for devin, bypassPermissions for claude)
  "prompt": "Startup prompt",
  "wait_script": "node .../await-messages.js ...",
  "random_tasks": ["Optional task"],
  "sweep": "sweep",              // Optional: label for the random wake
  "min_wait_minutes": 10,        // Optional: enables random wake when both min and max are set
  "max_wait_minutes": 20,        // Optional: enables random wake when both min and max are set
  "mission_chance": 0.3,        // Optional: probability of a random_tasks mission on random wake
  "random_wake": false          // Optional: force random wake on/off (auto-detected from min/max if omitted)
}
```

## Core Agents

- **Team Lead** - Coordinates work, triages requests
- **AKVJ Developer** - Core AKVJ development
- **Mainframe Developer** - Mainframe tooling
- **QA Reviewer** - Code review and QA
- **Overseer** - High-level oversight (10-20 min sweeps)
- **Nitpicker** - Code quality (15-30 min sweeps)

## Optional Agents

- **Test Marshal** - Test coverage (20-40 min sweeps)
- **Quartermaster** - Dependencies (30-60 min sweeps)

## Health Monitoring

**Restart Requests:**
Agents can request restarts by creating files:
```bash
echo '{"reason":"stuck"}' > .agents/workflows/developer-team/health/restart-requests/overseer.json
```

**Health Directory:**
```
.agents/workflows/{workflow}/health/
├── heartbeats/           # Agent heartbeat files
├── restart-requests/     # Agent restart requests
└── {agent}-pane.json    # Pane tracking files
```

## File Structure

```
.agents/workflows/
├── scripts/
│   ├── run-team                 # Main script
│   ├── await-messages.js        # Message wake (random wake configurable per agent)
│   ├── generate-dashboard.js    # Dashboard generation
│   ├── archive-task.js          # Task archiving
└── developer-team/
    ├── co-workers/
    │   └── *.prompt.json         # Agent configs
    ├── drafts/                  # Human scratchpad for in-progress specs
    ├── epics/                   # Multi-task initiatives
    │   ├── drafts/              # Work-in-progress epics
    │   ├── todo/                # Ready-to-implement epics
    │   └── done/                # Completed/retired epics
    ├── mail/
    │   ├── in/                  # Team Lead input (replaces inbox/)
    │   └── out/                 # Overseer output (replaces outbox/)
    ├── slack/{agent}/            # Agent communication
    ├── health/                  # Health monitoring
    ├── .temp/                   # Temporary files (gitignored)
    ├── tasks/                   # Task kanban
    │   ├── todo/                # Filed, not yet picked up
    │   ├── working-on/          # Actively in progress
    │   └── done/                # Completed and QA-approved
```

## Health Monitoring

`run-team` automatically creates a second tmux window named `monitor` running the health loop. The `--monitor` flag still works for standalone use, but the monitor is always started with the team.

- `Ctrl+B` then `0` - Switch to agent panes window
- `Ctrl+B` then `1` - Switch to health monitor window
- `Ctrl+B` then Arrow keys - Switch panes within a window
- `Ctrl+B` then `d` - Detach (leave running)
- `tmux attach -t {workflow}-agents` - Reattach
- `tmux kill-session -t {workflow}-agents` - Stop all
