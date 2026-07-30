---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 463 — spritesheet recompile empty PNG + updateClipFromFrames coverage

From: `[TEST]-mainframe-spritesheet-update-recompile-coverage.md` (test-marshal). Test-only — extend `mainframe/test/spritesheet.test.js`.

## Cover

1. `recompileClip` — raw dir exists, zero `.png` files → throw `/No raw PNG frames found/`.
2. `updateClipFromFrames` unit block: invalid clipId; empty/non-array buffers; missing clip folder; happy path (raw PNG count + return shape); optional `frameBakeConfigs` vs shared `scaleMode`.

## Out of scope

`spritesheetCore.js` kernel (already covered). Tasks 432 / 456.

## Verify

`npm run test -w mainframe`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**.
