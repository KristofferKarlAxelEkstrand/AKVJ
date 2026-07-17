# [BUG] ClipEditor save does not check HTTP response status

## Location
`mainframe/src/js/ClipEditor.js:264-268`

## Description
The `saveButton` click handler in `AkvjClipEditor` performs a `fetch()` PUT to update clip metadata but never checks `response.ok`. If the server returns a 400/404/500 error, the editor still dispatches `clipsaved` and shows "Saved" status, giving the user false confirmation that metadata was persisted.

## Impact
Users may believe their metadata edits were saved when they actually failed silently. The library will refresh via `clipsaved` event but show stale data, causing confusion.

## Reproduction
1. Start mainframe
2. Edit a clip's metadata
3. If the server returns an error (e.g., invalid png filename), the UI still says "Saved"
4. Library refreshes but old metadata is shown

## Suggested Fix
After the `fetch()` call, check `response.ok` and parse the response body. If not ok, throw an error with the server's error message. This matches the pattern used in `mainframe/src/main.js`'s `api()` helper function.
