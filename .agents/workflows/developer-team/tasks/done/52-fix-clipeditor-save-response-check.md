# Task 52: Fix ClipEditor Save Not Checking HTTP Response

## Severity: Medium (UX bug)

## Location
`mainframe/src/js/ClipEditor.js:264-268`

## Problem
The `saveButton` click handler performs a `fetch()` PUT but never checks `response.ok`. If the server returns an error, the editor still dispatches `clipsaved` and shows "Saved" — false confirmation.

## Fix
After `fetch()`, check `response.ok` and parse the response body. If not ok, throw an error with the server's error message. Match the pattern used in `mainframe/src/main.js`'s `api()` helper.

## Key Files
- `mainframe/src/js/ClipEditor.js`
- `mainframe/src/main.js` — reference for `api()` pattern

## Dependencies
- None (discovered during Task 37b)
