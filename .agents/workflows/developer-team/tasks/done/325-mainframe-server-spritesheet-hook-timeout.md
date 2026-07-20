---
status: done
assignee: mainframe-developer
priority: high
---

# Task 325: Mainframe `server.test.js` and `spritesheet.test.js` hook timeouts

## Source

Bug report: `.agents/workflows/developer-team/mail/in/read/[BUG]-mainframe-server-spritesheet-hook-timeout-2026-07-20.md`

## Description

`npm run test -w mainframe` is failing with hook timeouts in `test/server.test.js` (`beforeAll`) and `test/spritesheet.test.js` (`beforeEach`). The timeouts cause the entire 74-test server API suite to be skipped and fail.

## Observed failure

- `test/server.test.js` — `beforeAll` timed out in 10000ms while importing `../server/index.js` and starting the test server.
- `test/spritesheet.test.js` — `beforeEach` timed out in 10000ms while creating a temporary clips directory.

## Context

- `mainframe/vitest.config.js` uses `pool: 'threads'` and `fileParallelism: true` with `testTimeout: 30000`.
- Default `hookTimeout` is 10000ms, exceeded during setup under parallel thread execution.
- `mainframe/vitest.ui.config.js` and `vitest.ui.heavy.config.js` already use `pool: 'forks'`, `forks.singleFork: true`, `fileParallelism: false`, and `testTimeout: 60000`.

## Recommended fix

- Increase `hookTimeout` for the main Vitest config, and/or
- Align the main config with the UI configs by switching to `pool: 'forks'` with `singleFork: true` and `fileParallelism: false`.

## Affected files

- `mainframe/vitest.config.js`

## Verification

- `npm run test -w mainframe` passes with 0 failures.
- `npm run lint` passes.
- `npm run build -w mainframe` passes.

## Notes

- The server and spritesheet setup hooks perform heavy file I/O and server startup, so they need more than 10s under load.
