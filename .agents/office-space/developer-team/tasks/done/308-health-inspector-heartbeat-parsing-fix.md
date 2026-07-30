---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 308: Health Inspector heartbeat parsing fix

## Source

Overseer health report: `.agents/workflows/developer-team/slack/team-lead/[REPORT]-overseer-health-observations-2026-07-19.md`

## Description

The Health Inspector agent produces `undefined` report rows when a heartbeat JSON file lacks a `display` field. Make the Health Inspector robust to heartbeat files that only contain `agent` (and `ts`).

## Findings and actions

- `health/heartbeats/quartermaster-test.json` contains `{"ts": ..., "agent":"test"}` and no `display` field.
- The Health Inspector should either:
  - Skip test heartbeat files (e.g. filenames or `agent` values ending with `-test`), or
  - Fall back to the `agent` field when `display` is missing.

## Affected files

- `.agents/workflows/developer-team/co-workers/health-inspector.prompt.md` (or any health-inspector implementation)
- Possibly `.agents/workflows/developer-team/health/heartbeats/quartermaster-test.json`

## Verification

- A manual or scripted health audit no longer shows `undefined` rows.
- Health reports list the correct agent name or omit test heartbeats.

## Notes

- This is a workflow/agent fix, not product code.
