---
status: backlog
assignee: none
priority: low
---

# Task 152: Delete Dead `#file-list` UI, Merge `editorMeta.js` Defaults into `clipSchema.js`

## Source
Consolidated from mainframe refactor audit (Task 151):
`.agents/workflows/developer-team/inbox/read/team-update-mainframe-refactor-audit.md`
(priority #1 in its suggested slicing — highest-value, lowest-risk finding).

## Findings Being Actioned
1. **Dead UI**: `#file-list` / `renderFileList()` (filename dump) in
   `mainframe/src/js/ClipEditorController.js` + `index.html` `#file-list` +
   `PageShell.scss` `.file-list*` — superseded by `<clip-frames>`, which already shows the
   staged frames. Delete the dead path; keep `updateClipFrames` + preview only.
2. **Duplicated defaults**: `editorMeta.js` re-declares `DEFAULT_FRAME_WIDTH/HEIGHT`,
   `DEFAULT_SCALE_MODE`, `DEFAULT_PLAYBACK`, `DEFAULT_FRAME_RATE`, `DEFAULT_TRIGGER_TYPE`, and
   `BIT_DEPTHS = [1,2,4,8]`, all of which `mainframe/shared/clipSchema.js` already owns (the
   latter as `VALID_BIT_DEPTHS`). Delete the local re-declarations in `editorMeta.js`, import
   from `clipSchema.js` instead. Keep only the mapping functions
   (`editorValuesFromMeta`, `metaPatchFromEditor`, `optionalMetaFromEditor`,
   `parseFrameDurationBeats`) in `editorMeta.js`.

## Requirements
- Confirm `#file-list`/`renderFileList` is genuinely dead (no remaining callers) before
  deleting — the audit already checked this, but re-verify against current state.
- After deleting duplicated constants, confirm `editorMeta.js`'s behavior is unchanged
  (same defaults, just imported instead of re-declared).

## Suggested Tests
- Existing `ClipEditorController.test.js` / `editorMeta.test.js` should continue passing
  unmodified if behavior is truly unchanged — a good backward-compat signal.
- Remove any test coverage that specifically exercised the deleted `#file-list` UI (if any).

## Files
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/js/editorMeta.js`
- `mainframe/src/index.html`
- `mainframe/src/scss/PageShell.scss` (or wherever `.file-list*` rules live)
