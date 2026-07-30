---
status: done
assignee: qa-reviewer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 387: Rename ClipFramesUploadPanel → ClipFramesPanel

## Source

Nitpicker `[NIT]-clip-frames-upload-panel-rename-2026-07-20.md`

## Description

Rename class/file/tag/CSS away from “upload” (panel is import/stage for create *and* edit).

- [ ] `ClipFramesUploadPanel.js` → `ClipFramesPanel.js`; tag `clip-frames-panel`; CSS class rename; rename SCSS file
- [ ] Update `index.html`, `ClipEditorController.js` JSDoc, tests, imports

## Verification

- `npm run lint -w mainframe` / `npm run test -w mainframe` / `npm run build -w mainframe` pass
