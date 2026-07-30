---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 496 — Concurrent MIDI project switch can destroy the newly loaded catalog

From: `[BUG]-akvj-project-switch-race-before-guard.md` (overseer).

## Files

- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#handleProjectSwitch`, `#switchProject`, `#resolveProjectIdFromNote`

## Bug

`#isSwitchingProject` is set only inside `#switchProject`, **after** the note-based path has already awaited `#resolveProjectIdFromNote` (network/index fetch). Two ch-14 note-ons can interleave: both pass the flag check, both resolve, then one `destroyClips` wipes the other's newly assigned catalog.

String `projectId` path is safer (flag set before first I/O). The live MIDI path is the broken one.

## Fix

- Set `#isSwitchingProject = true` (and ideally `appState.projectSwitching`) **before** any await in `#handleProjectSwitch`, or re-check the flag after resolve and before `#switchProject`.
- Serialize switches (queue latest note, or drop if already switching — but never interleave two loads).
- Ensure error path still clears the flag / dispatches load error when aborting early after a failed resolve.

## Tests

- Two overlapping `dispatchProjectSelection` calls while `fetchProjectsIndex` / `loadClipsFromProject` are delayed; assert only one catalog ends active and destroyed clips are never `setClips`'d.
- Pattern: `akvj/test/AdventureKidVideoJockey.test.js` project-switch suite.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
