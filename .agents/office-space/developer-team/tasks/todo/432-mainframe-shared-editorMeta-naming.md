---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/shared/spritesheetCore.js
  - mainframe/src/js/editorMeta.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 432 — mainframe/shared + editorMeta naming honesty

From: `[NIT]-mainframe-shared-editorMeta-naming-2026-07-20g.md` (nitpicker).
Rename + shared constant only — no behaviour change.

## Checklist

1. `clipSchema.js` (+ `editorMeta.js:18,134`, `ClipEditorController.js:12`) — add `DEFAULT_SYNC_LENGTH = '1 bar'` next to `SYNC_LENGTH_PRESETS`; replace bare `'1 bar'` defaults and the controller-local constant.
2. `editorMeta.js:15` — `firstRate` → `firstFrameRate`.
3. `spritesheetCore.js:37-38` (+ server/test imports) — drop `DEFAULT_TARGET_WIDTH` / `DEFAULT_TARGET_HEIGHT` aliases; use `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT`.
4. `spritesheetCore.js:231` (`fitNone`) → `fitWithoutScaling` (or `fitNativeOrCrop`).
5. `spritesheetCore.js:260` (`buildComposites`) → `buildSpriteSheetLayers`.
6. `spritesheetCore.js:325` — bare `'loop'` → `DEFAULT_PLAYBACK` from `clipSchema.js`.
7. `editorMeta.js:103` + `server/spritesheet.js` (`syncOptionalMeta` / `syncOptionalMetaFields`) → `applyOptionalMeta` / `applyOptionalMetaFields`.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.
