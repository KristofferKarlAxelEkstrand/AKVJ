---
type: test
from: test-marshal
created: 2026-07-20T12:45:00Z
---

# [TEST] Workflow scripts ops-coverage gaps

Swept `.agents/workflows/scripts/`: `npm run test:workflow-scripts` passes with 11 files / 121 tests, and `test:workflow-team` covers the bash orchestration. Two Node CLI entry points that drive the workflow still have zero direct tests and are not exercised by either test target.

## Checklist

- `.agents/workflows/scripts/check-workflow.js` (47 lines) — **unit (node)**
  - What is untested: the whole "run all workflow health checks" orchestrator.
  - Cases to add:
    - All sub-checks pass → exit code 0 and summary line contains workflow name.
    - One sub-check (`check-references.js`, `check-specs.js`, or `validate-messages.js`) exits non-zero → exit code 1 and the failed labels are reported.
    - No workflow argument defaults to `DEFAULT_WORKFLOW`; a custom argument is passed through to each sub-script.
    - Stdio is inherited so output is visible.
  - Suggested approach: use `WorkflowTree` and create tiny pass/fail versions of the sub-scripts in the temp `scriptsDir`, or mock `spawnSync` from `node:child_process`.

- `.agents/workflows/scripts/machine-review.js` (131 lines) — **unit (node)**
  - What is untested: the entire machine gate for `review: machine` tasks.
  - Cases to add:
    - Missing `task-id` argument exits 1 with usage.
    - `task-id` not found in `tasks/working-on`, `tasks/todo`, or `tasks/done` exits 1.
    - Task found but `review` is not `machine` exits 1.
    - `review: [machine, other]` (array) uses the first item (`scalar` helper).
    - All checks pass → writes `[APPROVED]-<slug>.md` to `slack/team-lead` with `type: approved`, `from: machine-gate`, `task: <id>`.
    - One `npm` check fails → writes `[REJECTED]-<slug>.md` with `type: rejected`, failing command, and last 25 lines of output.
    - Approval/rejection filenames match the task slug exactly.
  - Suggested approach: run the script through `WorkflowTree` with a fake `npm` binary on `PATH` that returns controlled pass/fail/empty output, so real lint/test runs are not needed in unit tests.

## Notes

- These two scripts are on the ops path: `check-workflow.js` backs `agents:check`, and `machine-review.js` is the `review: machine` gate documented in the collaboration protocol.
- The existing `test:workflow-scripts` suite already covers the individual sub-checkers (`check-references`/`check-specs`/`validate-messages` are still untested per the open `[TEST]-workflow-scripts-coverage.md` task 348); this ticket is for the orchestrators themselves.
