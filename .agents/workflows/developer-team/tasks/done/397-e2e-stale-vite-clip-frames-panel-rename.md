---
status: done
assignee: qa-reviewer
priority: high
---

# Task 397: Stale Vite after ClipFramesPanel rename breaks clip-editor e2e

## Source

Field Tester `[BUG]-e2e-clip-editor-drop-zone-stale-vite-rename.md`

## Description

After task **387** rename, long-running `npm run mainframe` on `:9999` still serves deleted `ClipFramesUploadPanel.js` while disk has `ClipFramesPanel.js`. Panel never upgrades → missing `#clip-editor-drop-zone` / `#clip-editor-files`; e2e fails. Fresh Vite is fine.

## Fix options (pick durable)

- Playwright: do not `reuseExistingServer` when module graph is stale / force restart for mainframe e2e
- Vite: full reload / invalidate when a deleted module is still imported
- Document that mainframe must be restarted after CE file renames (weakest)

## Verification

- `npx playwright test e2e/mainframe.spec.js:79 e2e/mainframe.spec.js:92` green against a long-lived mainframe after a rename-class scenario (or equivalent guard)
