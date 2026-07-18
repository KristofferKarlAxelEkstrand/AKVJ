# Team Update: Remove “New clip” heading

## Summary
We can remove the “New clip” heading from the clip editor UI.

## Impact
Mainframe clip editor (`#clip-editor-heading` in `mainframe/src/index.html` / `ClipEditorController.js`). The “New clip” button and tab label can stay; only the heading that reads “New clip” should go.

## Action Needed
Drop the “New clip” heading (and any mode that sets heading text to “New clip”). Update related tests/spec if they assert that heading.

## Notes
- Spec currently says heading switches between “New clip” and “Edit clip: {id}” (`feature-edit-clip.md`).
- Existing test: `ClipEditorController.test.js` expects `clip-editor-heading` text to be `New clip`.
