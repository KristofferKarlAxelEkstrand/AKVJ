# Bug: Mainframe `server.test.js` and `spritesheet.test.js` hooks time out

## Observed failure

`npm run test -w mainframe` failed on the main Vitest config with two hook timeouts:

- `test/server.test.js` — `beforeAll` timed out in 10000ms while importing `../server/index.js` and starting the test server.
- `test/spritesheet.test.js` — `beforeEach` timed out in 10000ms while creating a temporary clips directory.

Because `server.test.js` `beforeAll` fails, all 74 server API tests are skipped and the suite fails.

## Context

- Main `mainframe/vitest.config.js` uses `pool: 'threads'` and `fileParallelism: true` with `testTimeout: 30000`.
- The default `hookTimeout` is 10000ms, which is being exceeded during setup under parallel thread execution.
- `mainframe/vitest.ui.config.js` and `mainframe/vitest.ui.heavy.config.js` already avoid this by using `pool: 'forks'`, `forks.singleFork: true`, `fileParallelism: false`, and `testTimeout: 60000`.

## Recommended fix

Increase the default `hookTimeout` for the main Vitest config, and/or align the main config with the UI configs by switching to `pool: 'forks'` with `singleFork: true` and `fileParallelism: false`. The server and spritesheet setup hooks do heavy file I/O and server startup, so they need more than 10s under load.

## Reproduction

```bash
npm run test -w mainframe
```

Failure seen at 2026-07-20 ~00:57 UTC in the mainframe `vitest.config.js` run.
