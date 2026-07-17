# [BUG] handlePutClipMeta does not handle missing meta.json

## Location
`mainframe/server/index.js:451-453`

## Description
`handlePutClipMeta` reads the current `meta.json` with `JSON.parse(await fs.readFile(...))` but has no try-catch. If `meta.json` is missing or contains invalid JSON, the server returns a 500 error instead of a 400 or 404 with a meaningful message.

## Impact
If a clip directory exists but has no `meta.json` (or corrupted JSON), attempting to edit metadata via the UI results in an opaque 500 error.

## Suggested Fix
Wrap the meta read in a try-catch. Return 404 if file not found, or 400 if JSON is invalid, with a descriptive error message.
