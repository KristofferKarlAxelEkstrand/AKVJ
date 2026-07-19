# AKVJ Agent Workflows

This directory contains advanced, folder-based Kanban workflows for AI agents. These workflows are autonomous pipelines designed for long-term, multi-phase goals.

## Shared Scripts

The `scripts/` directory contains shared utilities used across workflows:
- `run-team` - Main script for starting/managing agent teams in tmux
- `await-messages.js` - Message wake cycle for agents; random wake enabled by `min_wait_minutes` / `max_wait_minutes` in the agent config
- `generate-dashboard.js` - Dashboard generation for task tracking
- `archive-task.js` - Task archiving utility
- Each workflow's `.temp/` - Await state files (gitignored, auto-created)

## How Workflows Operate

Each workflow has its own dedicated folder containing:
1. **Co-workers**: Agent configuration files (`*.prompt.json`)
2. **Mail**: `mail/in/` for incoming requests; `mail/out/` for human decision queue
3. **Tasks**: Kanban queue with `todo/`, `working-on/`, and `done/` lifecycle
4. **Epics**: Multi-task initiatives with `drafts/`, `todo/`, and `done/` lifecycle
5. **Spec**: Overarching goals that agents must adhere to
6. **Memory**: Persistent ledger tracking agent progress across sessions
7. **Slack**: File-based IPC for agent communication
8. **Health**: Health monitoring and restart tracking

To use a workflow, use the `run-team` script to start agents, then drop work into the `mail/in/` directory.

---

## Active Workflows

### 👥 Developer Team
Autonomous, multi-agent development workflow — **six core** agents (Team Lead, AKVJ Developer, Mainframe Developer, QA Reviewer, Overseer, Nitpicker) plus **two optional** specialists (Test Marshal, Quartermaster).

**Quick Start:**
```bash
# Start the team
/workspaces/AKVJ/.agents/workflows/scripts/run-team developer-team

# List running teams
/workspaces/AKVJ/.agents/workflows/scripts/run-team --list

# Restart specific agent
/workspaces/AKVJ/.agents/workflows/scripts/run-team --restart developer-team overseer
```

See [`developer-team/README.md`](developer-team/README.md) for detailed instructions and [`developer-team/WORKFLOW.md`](developer-team/WORKFLOW.md) for technical documentation.
