---
status: done
assignee: mainframe-developer
priority: low
---

# Task 140: Remove "New Clip" Heading

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-remove-new-clip-heading.md`

## Current State
- `mainframe/src/index.html:35`: `<h2 id="clip-editor-heading">New clip</h2>`
- `mainframe/src/js/ClipEditorController.js:445,450`: `updateEditorChrome()` sets
  `this.#clipEditorHeading.textContent` to `` `Edit clip: ${this.#editingClipId}` `` when
  editing, `'New clip'` when creating.
- `mainframe/test/ClipEditorController.test.js:78`: asserts heading text is `'New clip'` —
  needs updating.
- The "New clip" **button** (`#clip-editor-new`, `index.html:37`) and tab label stay — only
  the heading text goes.

## Requirement
- When creating a new clip, the heading should show **no "New clip" text** (empty/hidden).
- When editing an existing clip, keep `Edit clip: {id}` exactly as today.
- Update the test at `ClipEditorController.test.js:78` to match the new behavior.
- Update `.agents/workflows/developer-team/spec/feature-edit-clip.md` (currently documents
  heading switching between "New clip" and "Edit clip: {id}").

## Files
- `mainframe/src/index.html`
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/test/ClipEditorController.test.js`
- `.agents/workflows/developer-team/spec/feature-edit-clip.md`
