---
status: completed
assignee: mainframe-developer
priority: medium
---

# Task 231: Mainframe Server Handlers Return 500 for Malformed JSON Bodies

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-mainframe-server-malformed-json-returns-500.md`

## Affected Files
- `mainframe/server/handlers/clips.js`
- `mainframe/server/handlers/projects.js`
- `mainframe/server/handlers/misc.js`
- `mainframe/server/httpUtils.js` (potential helper location)

## Description
Several HTTP handlers parse the request body with `JSON.parse(...)` before entering their local `try/catch` blocks. If the client sends syntactically invalid JSON, the resulting `SyntaxError` propagates up to the global `try/catch` in `mainframe/server/index.js`, which returns HTTP 500 and the raw error message. This both leaks internal path/parse details and masks a client error (it should be 400).

Handlers with the parse outside the `try` block include:
- `handlePostClips`
- `handlePutClipFrames`
- `handlePutClipMeta`
- `handleRecompileClip`
- `handlePostProjects`
- `handlePutProject`
- `handleExpandGif`

`handlePutMapping` wraps `JSON.parse` in its own `try/catch`, which is the preferred pattern.

## Discrete Actions
1. Move `JSON.parse` inside each handler's `try/catch` block, OR
2. Add a small `parseJsonBody` helper in `httpUtils.js` that converts `SyntaxError` into a 400 response
3. Keep unexpected server errors as 500, but treat malformed JSON as a client error (400)

## Verification
- Test each affected handler with malformed JSON body and verify 400 response
- Add coverage for malformed JSON request bodies in server tests (per inbox/[TEST]-mainframe-server-missing-invalid-json-coverage.md)
- Run `npm run lint`, `npm run test -w mainframe`, `npm run build -w mainframe`

## Related
- Security: Prevents leaking internal error details to clients
- API consistency: Proper HTTP status codes for client vs server errors

## Status: COMPLETED

This task was already implemented in the codebase. The fix is at `mainframe/server/httpUtils.js:64-75`:

```javascript
export async function parseJsonBody(req, res) {
	const body = await readBody(req);
	try {
		return JSON.parse(body.toString('utf8') || '{}');
	} catch (error) {
		if (error instanceof SyntaxError) {
			sendJson(res, 400, { error: 'Invalid JSON in request body' });
			return null;
		}
		throw error;
	}
}
```

This implements discrete action 2 from the task - adding a `parseJsonBody` helper in `httpUtils.js` that converts `SyntaxError` into a 400 response. All affected handlers now use this helper instead of calling `JSON.parse` directly.

### Test Coverage Already in Place (server.test.js:804-854)
The tests for malformed JSON request bodies already exist and verify:
- POST /api/clips returns 400 for malformed JSON
- PUT /api/clips/:clipId/frames returns 400 for malformed JSON
- PUT /api/clips/:clipId returns 400 for malformed JSON
- POST /api/clips/:clipId/recompile returns 400 for malformed JSON
- POST /api/projects returns 400 for malformed JSON
- PUT /api/projects/:id returns 400 for malformed JSON
- PUT /api/mapping returns 400 for malformed JSON
- PUT /api/projects/:id/key-map returns 400 for malformed JSON
- POST /api/expand-gif returns 400 for malformed JSON

The task description described the problem as if the fix wasn't implemented, but the implementation was already in place. This was likely completed as part of the server hardening work.

All verification passed:
- ✅ `npm run lint` - No errors
- ✅ `npm run test -w mainframe` - All tests passing (including malformed JSON tests)
- ✅ `npm run build -w mainframe` - Production build successful
