---
status: done
assignee: mainframe-developer
priority: low
---

# Task 109: Remove deriveClipId Dead Code

## Severity: Low (Tech Debt — cleanup)

## Location
- `mainframe/src/js/deriveClipId.js` (client-side)
- `mainframe/test/deriveClipId.test.js`
- `mainframe/server/paths.js` (server-side `deriveClipId` export)
- `mainframe/test/paths.test.js` (describe block for `deriveClipId`)

## Problem
Task 102 switched clip ID creation to `generateClipId()` (`crypto.randomUUID()`). Both `deriveClipId` implementations are now dead code — zero callers in production, only referenced by their own tests.

## Requirements
1. Delete `mainframe/src/js/deriveClipId.js` and `mainframe/test/deriveClipId.test.js`
2. Remove `deriveClipId` export from `mainframe/server/paths.js`
3. Remove `deriveClipId` describe block from `mainframe/test/paths.test.js`
4. Verify `isValidClipId` and other `paths.js` exports are not affected
5. Verify no other code references `deriveClipId`

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **NPM Protocol**: NEVER run `npm install` yourself.

## Notes
- Flagged by Overseer as dead code after Task 102
- Both implementations fully dead in production code
