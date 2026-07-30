---
status: done
assignee: qa-reviewer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 363: Health monitor must skip disabled agents

## Source

Overseer `[BUG]-health-monitor-restarts-disabled-agents.md`

## Description

`health-inspector` is `enabled: false` / `_retired` in `co-workers/health-inspector.prompt.json`, but `run-team` `monitor_workflow` still auto-restarts it from a leftover heartbeat + pane and files flap questions in `mail/out/`.

## Fix

In `.agents/workflows/scripts/run-team` `monitor_workflow`:

- After resolving `stale_agent` / `agent_to_restart`, read `.enabled` from its prompt.json (default `true`) and `continue` when `false`
- Apply the same skip in restart-request handling
- Prune that agent's heartbeat/alert on skip

## Verification

- Disabled agent with a stale heartbeat is not restarted
- `agents:status` still lists it under `disabled:`
- No new `mail/out/question-*-flapping.md` for disabled agents from this path
