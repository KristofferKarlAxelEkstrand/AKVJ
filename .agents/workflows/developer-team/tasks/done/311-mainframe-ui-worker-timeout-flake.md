---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 311: Mainframe UI tests Vitest worker-startup timeout flake

## Source

Test Marshal flake hunt: `.agents/workflows/developer-team/mail/in/read/[TEST]-mainframe-ui-worker-timeout-flake.md`

## Description

`npm run test -w mainframe` intermittently fails when Vitest cannot start worker threads for multiple custom-element test files, causing 10 errors of the form:

```
[vitest-pool]: Failed to start threads worker for test files ...
Caused by: [vitest-pool-runner]: Timeout waiting for worker to respond
```

## Affected files

DOM/custom-element UI tests in `mainframe/test/`:

- `AkvjMainframe.test.js`
- `PianoRoll.test.js`
- `StagingPreview.test.js`
- `ClipList.test.js`
- `ProjectChooser.test.js`
- `SortChoices.test.js`
- `MappingTable.test.js`
- `RoleChoices.test.js`
- `SimpleRouter.test.js`
- `ClipNameInput.test.js`

## Recommended actions

1. Reproduce by running the full mainframe suite several times.
2. Try `vitest run --pool=forks` or increasing `--pool-timeout` / `testTimeout` for the jsdom UI suite.
3. Consider splitting heavy UI tests into a separate `vitest.visual/ui.config.js` or serializing custom-element suites so they don't all spawn workers simultaneously.
4. Verify each of the 10 files passes in isolation to confirm the failure is worker-startup contention, not a test bug.

## Actions taken

- Split the jsdom custom-element UI suite into two dedicated configs:
  - `mainframe/vitest.ui.config.js` — lighter component tests: `ClipList`, `ProjectChooser`, `SortChoices`, `MappingTable`, `RoleChoices`, `SimpleRouter`, `ClipNameInput`, `ClipFramesUploadPanel`.
  - `mainframe/vitest.ui.heavy.config.js` — heavier DOM suites: `AkvjMainframe`, `PianoRoll`, `StagingPreview`, `PreviewClip`.
- Both configs use `pool: 'forks'`, `singleFork: true`, `isolate: false`, `fileParallelism: false`, and `testTimeout: 60000` so each runs in a single fork sequentially, reducing worker-startup contention.
- Updated `mainframe/package.json` so `npm run test -w mainframe` and `npm run test:ui -w mainframe` run the node suite, then the light UI suite, then the heavy UI suite sequentially.
- `mainframe/vitest.config.js` continues to exclude all UI test files so they are not duplicated in the node test run.

## Affected files

- `mainframe/vitest.ui.config.js` (updated include list)
- `mainframe/vitest.ui.heavy.config.js` (new)
- `mainframe/package.json` (updated `test` and `test:ui` scripts)

## Verification

- `npm run lint -w mainframe` — passed
- `npm run build -w mainframe` — passed
- `npm run test -w mainframe` — passed twice in a row
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed (8 files)
  - UI heavy suite: 137 tests passed (4 files)
- Each of the originally affected 10 UI test files passed within its dedicated config run.

## Notes

- Unit test infrastructure fix only; no product behavior changed.
- The split reduces the number of test files loaded into each jsdom worker, which mitigates Vitest's worker-startup timeout by lowering per-worker module/environment setup pressure.
