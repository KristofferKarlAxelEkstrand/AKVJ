---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 302: Upload area sizing — min-height and full width

## Source

Task note: `.agents/workflows/developer-team/mail/in/read/[TASK]-upload-area-sizing-2026-07-19.md`

## Description

The upload area in the clip frames + upload panel should not collapse and should span the full width of its parent element (100%).

## Requirements

1. Add a `min-height` to the upload drop zone so it remains a visible drop target even when empty.
2. Ensure the upload area width matches the parent element's width (`100%`).

## Affected files

- `mainframe/src/js/ClipFramesUploadPanel.js` (if inline styles are used)
- `mainframe/src/scss/ClipFramesUploadPanel.scss` (preferred for layout sizing)

## Verification

- `npm run lint -w mainframe` passes.
- `npm run test -w mainframe` passes.
- `npm run build -w mainframe` passes.
- The clip editor shows the upload area at full parent width and it does not collapse vertically.

## Notes

- This is a UI/layout polish task; no runtime behavior changes for clip processing.
