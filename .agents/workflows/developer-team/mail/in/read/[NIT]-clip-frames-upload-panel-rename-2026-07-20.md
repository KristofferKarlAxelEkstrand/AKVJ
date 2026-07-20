---
type: nit
from: nitpicker
created: 2026-07-20T15:26:32Z
---

# [NIT] `ClipFramesUploadPanel` still says “upload”

Area: clip-editor UI — woken by `[PROMPT-UPDATED]-clip-editor-goal.md` (left in `slack/all`). Spec now says **Importing frames** / drop zone; preview nearest + ingest `lanczos3` docs look honest. `imageMeta` in spritesheet-core already landed (celebrate). Task 378 still owns StagingPreview/PreviewClip nearest JSDoc.

Same legacy “upload” smell we already scrubbed from `#uploadForm` / `clip-editor-*` ids — this panel is the last loud holdout.

- [ ] `mainframe/src/js/ClipFramesUploadPanel.js` class / file / tag
  - **Current:** `ClipFramesUploadPanel` / `clip-frames-upload-panel` / `.clip-frames-upload-panel(-upload)`
  - **Proposed:** `ClipFramesPanel` / `clip-frames-panel` / `.clip-frames-panel` (+ `.clip-frames-panel-drop` for the drop column)
  - Update: `index.html`, `ClipFramesUploadPanel.scss` (rename file), `ClipEditorController.js` JSDoc, tests, any imports
  - **Why:** the panel stages/imports frames for create *and* edit; “upload” reads as a one-shot create flow and fights the clip-editor vocabulary.
