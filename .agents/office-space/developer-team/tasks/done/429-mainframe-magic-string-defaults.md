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

# 429 — Use existing constants for magic-string defaults in mainframe client

From: `[NIT]-mainframe-js-magic-string-defaults-2026-07-20e.md` (nitpicker). No behaviour change —
replace bare string defaults with named constants that already exist (or hoist one that does).

## 1. `'default'` project ID — 9 sites across 3 client files

`DEFAULT_PROJECT_ID = 'default'` lives in `mainframe/server/paths.js:29` (Node-only). Hoist to
`mainframe/shared/` (e.g. `clipSchema.js` or new `projects.js`), re-export from `paths.js`, import
in:

- `mainframe/src/js/mainframeState.js` (L30, L176, L243)
- `mainframe/src/js/AkvjMainframe.js` (L591)
- `mainframe/src/js/ProjectChooser.js` (L14, L37, L123, L191, L192)

## 2. `'name'` default sort mode — ~10 sites across 5 files

Export `DEFAULT_SORT_MODE = 'name'` from `SortChoices.js` (or shared module); `SortChoices.defaultValue`
should reference it. Import in `mainframeState.js`, `ClipList.js`, `AkvjMainframe.js`.

## 3. `'loop'` default playback in `StagingPreview.js`

`DEFAULT_PLAYBACK` already exported from `mainframe/shared/clipSchema.js` via
`mainframe/src/js/clipSchema.js`. Import and use at L29 and L76 (currently imports `PLAYBACK_MODES`
only).

## 4. `'fit'` default scale mode in `StagingPreview.js`

`DEFAULT_SCALE_MODE` is already imported on L6 but unused at the field default. Use it at L30;
JSDoc L68 → `[scaleMode=DEFAULT_SCALE_MODE]`.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
