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

# Task 287: Agent Health System — Smart Restart Monitor

Part of `.agents/workflows/developer-team/epics/todo/agent-health-system.md`.

## Goal

Extend `.agents/workflows/scripts/run-team` to detect stalled mail/tasks and trigger agent restarts.

## Logic

Every 30 seconds:
- For each file in `mail/in/`: if file age > 10 minutes AND no corresponding `working-on/` task for the assigned agent, write a restart request to `health/restart-requests/{agent}.json` and log.
- For each file in `tasks/todo/`: if file age > 10 minutes AND no agent has it in `working-on/`, write a restart request for the assigned agent and log.
- Respect existing `RESTART_COOLDOWN_SECONDS` (120s) to avoid restart spam.
- File age: `Date.now() - fs.statSync(file).mtime.getTime()`.
- Threshold: `10 * 60 * 1000` ms.

## Verify

- Stalled mail triggers restart (verify in monitor logs).
- Stalled tasks trigger restart.
- Cooldown prevents restart spam.
- Active work does not trigger false restarts.

## Affected files

- `.agents/workflows/scripts/run-team`
- New: `.agents/workflows/developer-team/health/restart-requests/` (directory creation)

## Notes

- Coordinate with Task 288 (Health Inspector agent) so restart requests and health reports share the `health/` directory conventions.
