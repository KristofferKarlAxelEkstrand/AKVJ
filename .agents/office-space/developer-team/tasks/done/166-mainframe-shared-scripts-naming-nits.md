---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 166: Fix 2 Naming Nits in mainframe/shared/ + mainframe/scripts/

## Source
`.agents/workflows/developer-team/inbox/[NIT]-mainframe-shared-scripts-sweep-2025-07-18.md`
(Nitpicker sweep — 2 actionable nits out of 19 files reviewed).

## Nits

### 1. `loadKeyMap(layoutPath)` → `loadKeyMap(keyMapPath)`
- **File:** `mainframe/scripts/clips/lib/validateMapping.js`
- **Function:** `loadKeyMap(layoutPath)` (line 23)
- **Problem:** Parameter named `layoutPath` but it's a path to `key-map.json`. The domain term
  everywhere else is "key-map" (`keyMapPath` in `Pipeline.js`, `projectKeyMapPath` in `paths.js`).
  The caller at line 15 already passes `keyMapPath`.
- **Fix:** Rename parameter `layoutPath` → `keyMapPath`.

### 2. `writeMetaFile(outputDir, frames, ...)` → `writeMetaFile(outputDir, frameCount, ...)`
- **File:** `mainframe/scripts/clips/spritesheet.js`
- **Function:** `writeMetaFile(outputDir, frames, framesPerRow, frameRate)` (line 119)
- **Problem:** `frames` is a number (frame count), not an array. Call site passes `files.length`.
  `spritesheet-core.js` already uses `frameCount` for the same concept.
- **Fix:** Rename parameter `frames` → `frameCount`.

## Verification
- `npm run lint`
- `npm run test -w mainframe`
- `npm run clips:validate` (exercises `validateMapping.js`)

## Files
- `mainframe/scripts/clips/lib/validateMapping.js`
- `mainframe/scripts/clips/spritesheet.js`
