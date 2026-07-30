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

# Task 376: Fix `agents-status.js` eqeqeq (blocks root lint)

## Source

Machine-gate rejection of task 369 — root `npm run lint` fails on unrelated Overseer fix.

## Description

`.agents/workflows/scripts/agents-status.js` ~L120: `waitingOn == null` → `waitingOn === null || waitingOn === undefined` (eqeqeq).

Lint-only. Unblocks machine-review for 369 / 372.

## Verification

- `npm run lint` passes at repo root
