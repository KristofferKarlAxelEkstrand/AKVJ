---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 500 — Clip editor dead UI: frame-duration-beats + orphan preview-clip

From: `[BUG]-mainframe-clip-editor-dead-ui.md` (overseer).

## Bug

1. **`#clip-editor-frame-duration-beats`** still in the form. `frameDurationBeats` is hard-rejected by validation. No JS hydrates or saves it. Timing is free ms / beat `sync` + `syncLength` only.
2. **`<preview-clip id="clip-editor-preview">`** has no controller wiring. Empty chrome.

## Fix

- Remove `#clip-editor-frame-duration-beats` (and test fixture in `ClipEditorController.test.js`).
- **Remove** orphan `#clip-editor-preview` (prefer remove; staging already has live preview).

## Files

- `mainframe/src/index.html`
- `mainframe/src/js/ClipEditorController.js` (if any refs)
- `mainframe/test/**/ClipEditorController.test.js` (or equivalent)

## Verify

- Form no longer shows beats field / empty preview shell.
- Clip create/edit save + staging preview still work.
- `npm run test -w mainframe` (ClipEditorController).

Scope: **mainframe-developer**.
