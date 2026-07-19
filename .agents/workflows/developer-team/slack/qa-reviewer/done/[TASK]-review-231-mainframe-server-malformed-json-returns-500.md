# [REPORT] Task 231: Mainframe server malformed JSON returns 500

## Summary
Fixed mainframe server handlers that were returning HTTP 500 for malformed JSON request bodies instead of the correct HTTP 400 (Bad Request).

## Changes Made

### 1. Added `parseJsonBody` helper to `mainframe/server/httpUtils.js`
- Created a new helper function that wraps `JSON.parse` in a try/catch block
- Returns `null` and sends HTTP 400 with clear error message when `SyntaxError` occurs
- Properly distinguishes between client errors (malformed JSON) and server errors

### 2. Updated all affected handlers to use `parseJsonBody`
Updated the following handlers in `mainframe/server/handlers/`:
- `clips.js`: `handlePostClips`, `handlePutClipFrames`, `handlePutClipMeta`, `handleRecompileClip`, `handlePutMapping`
- `projects.js`: `handlePostProjects`, `handlePutProject`, `handlePutProjectKeyMap`
- `misc.js`: `handleExpandGif`

Each handler now:
- Calls `parseJsonBody(req, res)` instead of raw `JSON.parse`
- Checks if the result is `null` (indicating malformed JSON) and returns early
- Continues with normal processing for valid JSON

### 3. Removed unused imports
- Removed `readBody` imports from handler files that no longer use it directly
- Cleaned up JSDoc type annotations to use `import('http')` instead of named imports

## Verification
- All linting passes (`npm run lint`)
- All tests pass including new malformed JSON tests (569 tests passed)
- Added comprehensive test coverage for malformed JSON bodies in `mainframe/test/server.test.js`

## Impact
- Malformed JSON request bodies now correctly return HTTP 400 instead of HTTP 500
- Error messages are clearer: "Invalid JSON in request body"
- No internal implementation details leaked to clients
- Consistent error handling across all JSON-parsing endpoints