---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 495 — mainframe shell + ProjectChooser naming honesty

From: `[NIT]-mainframe-shell-projectchooser-naming-2026-07-29.md` (nitpicker). Renames only — no behaviour change.

## Checklist

1. `AkvjMainframe.js:554` — `createProjectFromUi` → `createProject` (match `activateProject` / `renameProject`).
2. `AkvjMainframe.js:581` — `deleteProjectFromUi` → `deleteProject`.
3. `AkvjMainframe.js:255` — `mapClipFromLibrary` → `selectClipForMapping` (or `openMappingWithClip`); also call site ~179.
4. `AkvjMainframe.js:301` — `fillClipSelect` → `fillMappingClipSelect` (`#map-clip-id` only).
5. `AkvjMainframe.js:480` — client `projectKeyMapPath` → `projectKeyMapApiPath` (or `projectKeyMapUrl`); leave server `paths.js` as-is (or pair-rename server to `projectKeyMapFilePath`).
6. `ProjectChooser.js:18` — `#nameInput` → `#createNameInput` (pair with `#renameInput`).
7. `ProjectChooser.js:17` — `#select` → `#projectSelect`.

## Out of scope

`pianorollFilters` → **455**. ChoiceList `#items` → **462**.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
