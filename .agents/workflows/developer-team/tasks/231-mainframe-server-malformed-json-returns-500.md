---
status: backlog
assignee: mainframe-developer
priority: medium
---
# [BUG] Mainframe server handlers return 500 for malformed JSON bodies

## Affected Files
- `mainframe/server/handlers/clips.js`
- `mainframe/server/handlers/projects.js`
- `mainframe/server/handlers/misc.js`

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

## Suggested Fix
Move `JSON.parse` inside each handler's `try/catch`, or add a small `parseJsonBody` helper in `httpUtils.js` that converts `SyntaxError` into a 400 response. Keep unexpected server errors as 500, but treat malformed JSON as a client error.
