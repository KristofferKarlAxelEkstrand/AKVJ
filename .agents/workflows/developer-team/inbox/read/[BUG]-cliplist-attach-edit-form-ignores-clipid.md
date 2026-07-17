# [BUG] ClipList attachEditForm ignores clipId parameter

## Location
`mainframe/src/js/ClipList.js:410-426`

## Description
The `attachEditForm(clipId, formElement)` method has a bug in its first loop. It iterates over all `<li>` children looking for an existing `.clip-edit-form`, and if found, removes it and **returns immediately** — regardless of which clip the form belongs to. This means:

1. If clip A has an open edit form and you click "Edit" on clip B, the form for clip A is removed and clip B's form is never attached.
2. The `clipId` parameter is completely ignored in the first loop.

The second loop (which actually uses `clipId` to find the correct `<li>`) is never reached if any edit form exists anywhere in the list.

## Impact
Users can only have one clip edit form open at a time, and opening a new one may silently close the wrong one without opening the requested one.

## Suggested Fix
The first loop should check whether the existing form belongs to the specified `clipId` before removing it. Alternatively, remove the first loop entirely and handle form toggling in the `clipedit` event handler in `main.js` (which already does this check at line 99-103).
