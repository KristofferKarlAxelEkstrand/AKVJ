---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 509 — mainframe heavy UI vitest forks worker timeout (~60s)

From: `[BUG]-mainframe-heavy-ui-vitest-worker-timeout.md` (field-tester).

## Symptom

`npm run test:all` / `vitest run --config vitest.ui.heavy.config.js` often fails before any tests run:

`[vitest-pool]: Failed to start forks worker` / `Timeout waiting for worker to respond` (~60.09s).

Intermittent: same config can pass (~64s, 4 files / 171 tests). Single-file runs of heavy files sometimes pass (env setup ~38–50s) and sometimes hit the same pool start timeout (`AkvjMainframe`, `PianoRoll`).

## Config

`mainframe/vitest.ui.heavy.config.js` — `pool: 'forks'`, `singleFork: true`, `isolate: false`, `fileParallelism: false`, `testTimeout: 60000`. Vitest 4.1.10.

## Likely fix directions

- Raise pool / worker startup timeout above jsdom env cost (env alone can burn ~50s).
- Or split heavy files / reduce env boot cost so worker responds before the pool limit.
- Confirm root `test:all` chain does not start heavy while other vitest pools still hold RAM/CPU.

## Verify

Repeat heavy config ≥3 times green: `cd mainframe && npx vitest run --config vitest.ui.heavy.config.js`
Also `npm run test:all` once when load is quiet.

Scope: **mainframe-developer** (config under `mainframe/`). Related pain: agent hangs on full-suite verify (498).
