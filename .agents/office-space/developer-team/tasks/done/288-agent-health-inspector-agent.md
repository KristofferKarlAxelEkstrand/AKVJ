---
status: done
assignee: akvj-developer
priority: medium
epic: agent-health-system
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 288: Agent Health System — Health Inspector Agent

Part of `.agents/workflows/developer-team/epics/todo/agent-health-system.md`.

## Goal

Create a new `health-inspector` agent that spawns fresh on a random wake (40–50 min), audits team health, writes a report to `mail/out/[HEALTH-REPORT]-{timestamp}.md`, and exits.

## Deliverables

1. **Prompt/config files:**
   - `.agents/workflows/developer-team/co-workers/health-inspector.prompt.json`
   - `.agents/workflows/developer-team/co-workers/health-inspector.prompt.md`
2. **Integration:** Add `health-inspector` to the agent startup list in `.agents/workflows/scripts/run-team`.
3. **Audit logic:** On wake:
   - Read `health/heartbeats/` and flag stale heartbeats (>300s).
   - Count pending mail in `mail/in/`.
   - Count stalled tasks in `tasks/todo/`.
   - Read `health/awaiting/` to report what each agent is waiting on.
   - Read `health/restart-requests/` and list pending restarts.
   - Check file ages for stalled work.
4. **Report format:** Follow the template in the epic (Heartbeats, Work in Flight, Restart Requests, Stalled Work, Recommended Action).

## Verify

- Running the agent produces a valid health report in `mail/out/`.
- Report data matches the actual team state.
- Agent exits cleanly after writing the report.

## Affected files

- New: `.agents/workflows/developer-team/co-workers/health-inspector.prompt.json`
- New: `.agents/workflows/developer-team/co-workers/health-inspector.prompt.md`
- `.agents/workflows/scripts/run-team`

## Notes

- The agent should be stateless and always spawn fresh.
- Coordinate with Task 287 (Smart Restart Monitor) on `health/` directory conventions.
