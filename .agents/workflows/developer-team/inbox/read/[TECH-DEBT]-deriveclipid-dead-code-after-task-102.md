# [TECH-DEBT] deriveClipId left behind as dead code after Task 102

## Where
- `mainframe/src/js/deriveClipId.js` (client-side `deriveClipId(name)`)
- `mainframe/server/paths.js:28` (server-side `deriveClipId(name)`, separate implementation)

## Problem
Task 102 ("Unique ID Generation + Stop Deriving ID from Name") switched clip-ID creation to `generateClipId()` (`crypto.randomUUID()`-based) — confirmed `mainframe/src/main.js` now only imports/calls `generateClipId`, not `deriveClipId`. But neither `deriveClipId` implementation was removed:
- `mainframe/src/js/deriveClipId.js`'s export has zero callers anywhere in `mainframe/src/` — only referenced by its own docstring and by `mainframe/test/deriveClipId.test.js`.
- `mainframe/server/paths.js`'s separate `deriveClipId` export has zero callers in `mainframe/server/` — only referenced by `mainframe/test/paths.test.js`.

Both are fully dead in production code, kept alive only by their own tests (green tests, unreachable code — false confidence, plus wasted CI time on every run).

## Suggested Fix
Delete `mainframe/src/js/deriveClipId.js` and its test file `mainframe/test/deriveClipId.test.js`. Remove the `deriveClipId` export (and its describe block in `mainframe/test/paths.test.js`) from `mainframe/server/paths.js` if nothing else in a follow-up task needs it (double-check `isValidClipId`/other `paths.js` exports aren't affected — only `deriveClipId` itself is dead, per the grep above).

## Priority
Low — dead code, no functional risk, but easy cleanup once confirmed no other task references it.
