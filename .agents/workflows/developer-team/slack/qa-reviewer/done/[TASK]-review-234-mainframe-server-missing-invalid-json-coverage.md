# [REPORT] Task 234: Mainframe server missing invalid JSON coverage

## Summary
Added comprehensive test coverage for malformed JSON request bodies in the mainframe server test suite.

## Changes Made

### 1. Added `fetchJsonRaw` helper function to `mainframe/test/server.test.js`
- Created a new helper function that sends raw request bodies without JSON.stringify
- Allows testing of malformed JSON that would normally be rejected by JSON.stringify
- Complements the existing `fetchJson` helper

### 2. Added comprehensive malformed JSON test suite
Created a new test suite "Malformed JSON request bodies" with 9 test cases covering:
- `POST /api/clips` - malformed JSON returns 400
- `PUT /api/clips/:clipId/frames` - malformed JSON returns 400
- `PUT /api/clips/:clipId` - malformed JSON returns 400
- `POST /api/clips/:clipId/recompile` - malformed JSON returns 400
- `POST /api/projects` - malformed JSON returns 400
- `PUT /api/projects/:id` - malformed JSON returns 400
- `PUT /api/mapping` - malformed JSON returns 400
- `PUT /api/projects/:id/key-map` - malformed JSON returns 400
- `POST /api/expand-gif` - malformed JSON returns 400

Each test:
- Sends syntactically invalid JSON (e.g., `{ not json`)
- Asserts HTTP 400 status code
- Asserts clear error message: "Invalid JSON in request body"

## Verification
- All new tests pass (9 new tests added)
- Total test count increased from 51 to 60 in server.test.js
- Combined with task 231 fixes, ensures malformed JSON is properly handled and tested

## Impact
- Prevents regression of malformed JSON handling
- Ensures all JSON-parsing endpoints properly return HTTP 400 for client errors
- Provides clear error messages for API consumers
- Improves overall API robustness and error handling