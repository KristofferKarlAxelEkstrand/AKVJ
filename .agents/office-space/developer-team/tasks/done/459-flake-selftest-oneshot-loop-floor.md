---
status: done
assignee: utility-developer
priority: high
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 459 — Fix flake: oneshot loop floor in selftest-run-team

From: `[BUG]-flake-selftest-oneshot-loop-floor.md` (field-tester). Workflow selftest only — no product source.

## Symptom

`npm run test:workflow-team` / `selftest-run-team.sh` assertion **"fast turn+wait is paced by the floor"** fails intermittently (`elapsed 1s (< 2s)`). Structural check that the floor sleep is embedded still passes on the same run.

## Likely cause

`date +%s` second granularity vs a 2s floor (`ELAPSED=$(( $(date +%s) - START ))` then `[ "$ELAPSED" -ge 2 ]`) — off-by-one on second boundaries (~lines 380–388).

## Do

Make the timing assertion stable (e.g. higher-resolution clock, longer floor, or boundary-safe comparison) without weakening the hot-spin guard. Confirm structural embed check still present.

## Verify

`npm run test:workflow-team` green across several consecutive runs (repro was fail within 1–2 attempts).

Scope: **utility-developer** (`.agents/workflows/scripts/`).
