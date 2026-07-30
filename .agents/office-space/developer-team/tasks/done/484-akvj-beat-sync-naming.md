---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 484 — Beat mode naming: BPMSync → BeatSync

From: `mail/in/read/[NIT]-clip-timing-beat-sync-naming-2026-07-29.md` (nitpicker). Rename only.

## Do

1. `akvj/src/js/visuals/ClipTiming.js` — `#isUsingBPMSync` / `isUsingBPMSync` / `#initBPMSync` → BeatSync equivalents. Call sites + `akvj/test/ClipTiming.test.js`.
2. `akvj/src/js/core/AppState.js` — `#recentPulseIntervals` → `#recentPulseIntervalsMs` (array of ms deltas).

## Verify

`npm run lint -w akvj`, `npm run test -w akvj` (ClipTiming especially).

Scope: **akvj-developer**.
