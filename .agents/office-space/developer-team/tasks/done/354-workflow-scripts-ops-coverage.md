---
status: done
assignee: utility-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 354: Add workflow scripts ops-coverage tests

## Source

- `.agents/workflows/developer-team/mail/in/[TEST]-workflow-scripts-ops-coverage.md`

## Description

Add unit tests for two Node CLI orchestrators in `.agents/workflows/scripts/` that currently have zero direct coverage:

- `check-workflow.js` — verify exit code 0 when all sub-checks pass, exit code 1 with failed labels when any sub-check fails, default/custom workflow argument handling, and inherited stdio.
- `machine-review.js` — verify missing task-id, task not found, task without `review: machine`, `review: [machine, other]` array handling, all checks passing writes `[APPROVED]-<slug>.md` to `slack/team-lead`, and a failing npm check writes `[REJECTED]-<slug>.md` with command and last 25 output lines.

Both scripts back the ops path (`agents:check` and the machine-review gate). Use the suggested mocking/fake-binary approach from the ticket to keep the tests fast and deterministic.

## Verification

- `npm run test:workflow-scripts` passes with the new cases
- `npm run test:workflow-team` still passes
- `npm run lint` passes

## Machine Review Output (2026-07-20)

Rejected — 1 of 3 checks failed.

### workflow (`npm run agents:check`)

> akvj@0.0.0 agents:check
> node .agents/workflows/scripts/check-workflow.js developer-team

── references ─────────────────────────────────────────
── specs ─────────────────────────────────────────
All 9 specs valid (3 approved, 6 draft).

── messages ─────────────────────────────────────────
Messages: 5 valid, 0 repaired, 0 quarantined, 0 unrepaired. Types: 17 known.

Dangling references (2 of 174 checked):
  .agents/workflows/developer-team/tasks/todo/358-akvj-visuals-clipDrawRect-coverage.md:12 → akvj/test/clipDrawRect.test.js
  .agents/workflows/developer-team/tasks/todo/359-akvj-visuals-effects-nits.md:12 → ./effectConstants.js
Workflow checks failed: references
