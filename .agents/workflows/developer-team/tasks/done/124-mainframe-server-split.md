---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 124: Split `mainframe/server/index.js` + Mapping Service

## Severity: Refactor

## Summary
Break the ~804-line `server/index.js` god file into routes/handlers and unify the three key-map validator implementations into one `mappingService`.

## Acceptance Criteria
- Extract `server/routes/` (or `server/handlers/`) and a thin `createMainframeServer()`.
- Add `server/httpUtils.js` for `readBody`, `sendJson`, `applyCors`, and `MAX_BODY_BYTES`.
- Extract `parseClipFramesBody(body)` and `decodeFrameDataUrls(frames)` for shared use by `handlePostClips` and `handlePutClipFrames`.
- Extract `server/mappingService.js` (validate + flatten + nest) used by server write paths; reconcile with the pipeline validator.
- Add try/catch to `handlePutMapping` so error handling is symmetric with the project key-map PUT.
- Verify `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe` pass.

## Notes
- Critical path for Projects (per-project key-maps).
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §M1, M2.
