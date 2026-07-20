---
status: in-progress
assignee: utility-developer
priority: medium
review: machine
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
