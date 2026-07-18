---
status: done
assignee: none
priority: low
---

# Task 193: ClipEditorController Deep Pass — Naming & Terminology

## Source
`.agents/workflows/developer-team/inbox/read/[NIT]-clip-editor-controller-deep-pass-2026-07-18.md`
(The Nitpicker, line-by-line deep pass on `ClipEditorController.js` + bake API surface.)

## Sequencing
Item 2 renames the public `composition*` UI API to `bakeConfig*`. **Land this task before Task 192**
(`192-clipframe-stagingpreview-composition-coverage.md`) so new ClipFrame/StagingPreview tests lock
onto the final vocabulary instead of the outgoing `composition*` names.

Distinct from Task 190 (broader clip-editor refactor naming: `#abort`, `bind()`, `durationMs`, DOM
ids) — do not fold into 190; different checklist, same area.

## Checklist

1. **Drop legacy `upload*` names** in `mainframe/src/js/ClipEditorController.js` (DOM already uses
   `clip-editor-*`):
   - `#uploadForm` → `#clipEditorForm`
   - `#uploadClipIdInput` → `#clipIdInput`
   - `#uploadClipIdHint` → `#clipIdHint`
   - `#uploadSubmitButton` → `#submitButton`
   - `resetUploadClipId()` → `resetClipId()` (or `resetGeneratedClipId()`)
   Keep `document.getElementById('clip-editor-…')` targets unchanged. Update all call sites.

2. **Unify `composition` vs `bakeConfig` vocabulary** — prefer **bake config** (matches
   `FrameBakeConfig`, `frameBakeConfigs`, controller `#stagedBakeConfigs`):
   - `ClipFrame.js`: `#composition` / `composition` getter / `setComposition()` →
     `#bakeConfig` / `bakeConfig` / `setBakeConfig()`
   - `ClipFrames.js`: `getCompositions()` / `setAllCompositions()` / `areCompositionsUniform()` →
     `getBakeConfigs()` / `setAllBakeConfigs()` / `areBakeConfigsUniform()`
   - event `compositionchange` → `bakeconfigchange` (detail key `composition` → `bakeConfig`)
   - Update `ClipEditorController.js` bridge and any listeners/tests that use the old names.
   - Comments may still say "bake-time composition" in prose; identifiers must not dual-vocab.

3. **`hydrate()` local `data`** (`ClipEditorController.js` ~289): rename to `framesResponse` (or
   `clipFramesPayload`) — `data` is on the banned-vague list.

4. **`#reportOutcome(kind, text)`** (~234–237): rename param `kind` → `severity` (union remains
   `'error'|'warn'|'info'`). Update call sites.

## Verification
`npm run lint && npm run test -w mainframe && npm run build` — pure renames; existing tests should
catch missed call sites. Update any test strings that assert old event/method names.
