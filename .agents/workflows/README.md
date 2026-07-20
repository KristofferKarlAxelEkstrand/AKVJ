# AKVJ Agent Workflows

This directory contains advanced, folder-based Kanban workflows for AI agents. These workflows are autonomous pipelines designed for long-term, multi-phase goals.

## Shared Scripts

The `scripts/` directory contains shared utilities used across workflows:

| Script | Purpose |
| --- | --- |
| `run-team` | Starts and manages agent teams in tmux; also runs the health monitor |
| `control-center` | Interactive dashboard for starting, stopping, and attaching to teams; CLI auth status (`u`); refresh model catalog (`m`) |
| `await-messages.js` | The wake cycle: watches an agent's folders, wakes on new mail, on a timed sweep, or on a slow safety-net re-check |
| `generate-prompt.js` | Composes an agent's full startup prompt from its config, role prompt, and shared partials |
| `detect-stalled-work.js` | Files a restart request for the agent that owns an item left untouched — once per item |
| `validate-messages.js` | Keeps message envelopes well-formed; repairs in place, quarantines only the unreadable |
| `memory-log.js` | Appends to and compacts agent memory so the read-before-every-wake cost stays bounded |
| `generate-dashboard.js` | Builds the team dashboard from tasks and message envelopes |
| `check-references.js` | Fails when a doc points at a file that no longer exists |
| `check-specs.js` | Validates spec frontmatter, the spec index, and the specs tasks cite |
| `check-workflow.js` | Runs all three checks above — `npm run agents:check` |
| `machine-review.js` | Verdict-by-verification for `review: machine` tasks, so QA is not the gate for formatting and renames |
| `agents-status.js` | "Are the agents up?" — one table, exits non-zero if any enabled agent is down |
| `health-report.js` | Team-health snapshot written each monitor pass (replaced the Health Inspector agent) |
| `post-awaiting.js` | Publishes what an agent is currently waiting on |
| `archive-task.js` | Moves a completed task to `tasks/done/` and marks it done |
| `lib/` | Shared frontmatter and message-envelope helpers |
| `test/` | Vitest suite — `npm run test:workflow-scripts` |

Each workflow's `.temp/` holds await state (gitignored, auto-created).

## Testing

```bash
npm run test:workflow-scripts   # vitest: pollers, prompts, messages, memory, dashboard
npm run test:workflow-team      # bash: run-team discovery, monitor, cli_turn_command, validate_all_agents
```

`test:all` and CI run both. CI also ShellChecks `run-team`, `control-center`, `selftest-run-team.sh`, and `lib/cli-tools.sh`.

## How Workflows Operate

Each workflow has its own dedicated folder containing:
1. **Co-workers**: Agent configuration files (`*.prompt.json`)
2. **Mail**: `mail/in/` for incoming requests; `mail/out/` for human decision queue
3. **Tasks**: Kanban queue with `todo/`, `working-on/`, and `done/` lifecycle
4. **Epics**: Multi-task initiatives with `drafts/`, `todo/`, and `done/` lifecycle
5. **Spec**: How the product works today. Human-approved and binding once `status: approved`; indexed in `spec/README.md`
6. **Memory**: Persistent ledger tracking agent progress across sessions
7. **Slack**: File-based IPC for agent communication
8. **Health**: Health monitoring and restart tracking

To use a workflow, use the `run-team` script to start agents, then drop work into the `mail/in/` directory.

---

## Active Workflows

### 👥 Developer Team
Autonomous, multi-agent development workflow — **seven core** agents (Team Lead, AKVJ Developer, Mainframe Developer, Utility Developer, QA Reviewer, Overseer, Nitpicker) plus **three optional** specialists (Test Marshal, Quartermaster, Field Tester).

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
