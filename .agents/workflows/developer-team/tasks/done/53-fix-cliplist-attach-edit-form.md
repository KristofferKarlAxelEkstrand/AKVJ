# Task 53: Fix ClipList attachEditForm Ignoring clipId

## Severity: Medium (UX bug)

## Location
`mainframe/src/js/ClipList.js:410-426`

## Problem
`attachEditForm(clipId, formElement)` has a bug: the first loop removes any existing `.clip-edit-form` and returns immediately — regardless of which clip it belongs to. The `clipId` parameter is ignored. If clip A has an open form and you click "Edit" on clip B, clip A's form is removed and clip B's form is never attached.

## Fix
The first loop should check whether the existing form belongs to the specified `clipId` before removing it. Alternatively, remove the first loop entirely and handle form toggling in the `clipedit` event handler in `main.js` (which already does this check at line 99-103).

## Key Files
- `mainframe/src/js/ClipList.js`
- `mainframe/src/main.js` — reference for existing check logic

## Dependencies
- None (discovered during Task 37b)
