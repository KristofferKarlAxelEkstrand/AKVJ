---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 285: Fix Vitest worker-startup timeouts in mainframe UI tests

## Description

`npm run test -w mainframe` is intermittently failing with worker-thread startup timeouts when many jsdom/custom-element test suites run concurrently. The failures are infrastructure-level, not code regressions.

## Findings

- 45/45 test files reported `passed` at summary time; 467 tests passed.
- 10 errors, all:
  ```
  [vitest-pool]: Failed to start threads worker for test files /workspaces/AKVJ/mainframe/test/<File>.test.js
  Caused by: [vitest-pool-runner]: Timeout waiting for worker to respond
  ```
- Affected test files (DOM/custom-element UI tests in `mainframe/test/`):
  1. `AkvjMainframe.test.js`
  2. `PianoRoll.test.js`
  3. `StagingPreview.test.js`
  4. `ClipList.test.js`
  5. `ProjectChooser.test.js`
  6. `SortChoices.test.js`
  7. `MappingTable.test.js`
  8. `RoleChoices.test.js`
  9. `SimpleRouter.test.js`
  10. `ClipNameInput.test.js`

## Completed work

- Split the 10 UI test files into a dedicated `mainframe/vitest.ui.config.js`.
- Configured the UI config to use the `forks` pool with `singleFork: true` and `isolate: false`, plus `testTimeout: 60000`.
- Updated `mainframe/package.json` so `npm run test` runs `vitest.config.js` then `vitest.ui.config.js`, and added a `test:ui` shortcut.
- Verified each affected UI file passes in isolation and that the full `npm run test` suite passes reliably.

## Affected files

- `mainframe/package.json`
- `mainframe/vitest.config.js`
- `mainframe/vitest.ui.config.js`

## Verification

1. `npm run test -w mainframe` passes reliably across multiple runs.
2. Each of the 10 listed files passes in isolation.
3. `npm run lint` passes (no config syntax issues).

## Notes

- This is a test infrastructure fix, not a runtime behavior change.
- The dedicated UI config keeps the jsdom environment warm across UI suites, eliminating the worker-startup contention that produced the flakes.
