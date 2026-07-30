---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/shared/
  - mainframe/scripts/clips/
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 501 — mainframe/shared + scripts naming honesty

From: `[NIT]-mainframe-shared-scripts-naming-honesty-2026-07-29.md` (nitpicker). Renames / constant extract only. Skipped items owned by **432** / **435**.

## Checklist

1. `shared/spritesheetCore.js:277,298` — cell size params `width`/`height` → `frameWidth`/`frameHeight` on `buildComposites` / `renderSpriteSheet`.
2. `shared/frameTiming.js:10` — `DEFAULT_FRAME_DURATION_MS = 1000` → use same-file `MS_PER_SECOND`.
3. `scripts/clips/lib/generate.js:57-59` — local `metadata` → `meta`.
4. `scripts/clips/lib/copy.js:41-44` — `filesMatch(file1, file2)` / `content1`/`content2` → path/bytes names (`leftPath`/`rightPath`, `leftBytes`/`rightBytes`).
5. `scripts/clips/index.js:121-144` — watch debounce: `debounceTimerId`; `REBUILD_DEBOUNCE_MS = 100`; `POLLING_INTERVAL_MS = 300`.
6. `scripts/clips/index.js:58` + `Pipeline.js:50,64` — `options.project` → `projectId` (CLI flag may stay `--project=`).

## Out of scope

**432** (`fitNone`, `buildComposites` rename, `DEFAULT_TARGET_*`, bare `'loop'`). **435** (spritesheet usage text, `ValidationResult.dir`, optimize `optimized` flag, CLI `f`/`a`/`b`).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
