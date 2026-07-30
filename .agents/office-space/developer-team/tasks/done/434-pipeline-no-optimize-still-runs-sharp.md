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

# 434 — `--no-optimize` still runs sharp

From: `[BUG]-pipeline-no-optimize-still-runs-sharp.md` (nitpicker).

`mainframe/scripts/clips/Pipeline.js` `#optimize` (~190–196): when `noOptimize` is true it logs "Skipping optimization" then still calls `optimize(validClips, cacheDir)`. `lib/optimize.js` loads sharp and optimizes when available — flag may be a no-op for the sharp path.

## Fix

- Honour `noOptimize`: do not call `optimize()` (or make `optimize()` a pure no-op that does not load/run sharp).
- Add/extend a test that `--no-optimize` / `noOptimize: true` never invokes sharp.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.
