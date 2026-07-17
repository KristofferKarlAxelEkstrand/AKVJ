# Task 54: Fix Server handlePutClipMeta Error Handling

## Severity: Medium (Server bug)

## Location
`mainframe/server/index.js:451-453`

## Problem
`handlePutClipMeta` reads `meta.json` with `JSON.parse(await fs.readFile(...))` but has no try-catch. If `meta.json` is missing or contains invalid JSON, the server returns an opaque 500 error instead of 404 or 400 with a meaningful message.

## Fix
Wrap the meta read in a try-catch. Return 404 if file not found, or 400 if JSON is invalid, with a descriptive error message.

## Key Files
- `mainframe/server/index.js`

## Dependencies
- None (discovered during Task 37b)
