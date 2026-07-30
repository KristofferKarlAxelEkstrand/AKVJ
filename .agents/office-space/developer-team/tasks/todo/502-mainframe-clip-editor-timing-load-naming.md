---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/server/frameLoad.js
  - mainframe/src/js/ClipEditorController.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 502 — clip-editor timing load naming

From: `[NIT]-clip-editor-timing-load-naming-2026-07-29.md` (nitpicker). Renames / comment honesty. Skipped items owned by **432** / **498**.

## Checklist

1. `server/frameLoad.js:106` — `durationsFromFrameRates` → `durationsMsFromFrameRates` (returns ms).
2. `src/js/editorMeta.js:15,30` — drop unused `frameRate` from `editorValuesFromMeta` return (or rename `firstFrameRate` + tests); load path uses `durationsMs`.
3. `ClipEditorController.js:485` — `expandedDurations` → `expandedDurationsMs`.
4. `ClipEditorController.js:719-722` — `durations`/`first`/`uniform` → `durationsMs`/`firstDurationMs`/`isUniform` in `syncGlobalDurationMsControl`.
5. `ClipEditorController.js:792-808` — `#previewDurationsMs` dead free/beat branch; always staged free-timing ms; fix JSDoc.

## Out of scope

**432** (`firstRate` → `firstFrameRate`, bare `'1 bar'`). **498** (`raw` param, `spriteMeta` on frameLoad). **500** (dead beats UI / orphan preview — separate bug).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
