---
status: in-progress
assignee: utility-developer
priority: high
review: machine
---

# Task 376: Fix `agents-status.js` eqeqeq (blocks root lint)

## Source

Machine-gate rejection of task 369 — root `npm run lint` fails on unrelated Overseer fix.

## Description

`.agents/workflows/scripts/agents-status.js` ~L120: `waitingOn == null` → `waitingOn === null || waitingOn === undefined` (eqeqeq).

Lint-only. Unblocks machine-review for 369 / 372.

## Verification

- `npm run lint` passes at repo root
