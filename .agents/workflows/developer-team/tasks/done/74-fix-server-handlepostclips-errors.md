# Task 74: Fix Server handlePostClips Missing Error Handling

## Severity: Medium (Server bug)

## Location
`mainframe/server/index.js:384-398` — `handlePostClips`

## Problem
`handlePostClips` calls `createClipFromFrames()` with no try-catch. Errors from mismatched frame dimensions, existing clips, or malformed PNG data fall through to the generic 500 handler. The sibling endpoint `handleRecompileClip` properly wraps the same functions with try-catch returning 400.

Same bug class as Tasks 54 and 55, just in a different handler.

## Fix
Wrap the `createClipFromFrames` call in try-catch, matching `handleRecompileClip` pattern:

```javascript
try {
    const result = await createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, name, playback, frameRate });
    sendJson(res, 201, { ok: true, ...result });
} catch (error) {
    sendJson(res, 400, { error: error.message });
}
```

## Verification
- Run `npm run lint` to ensure no lint errors
- Run `npm run test -w mainframe` to ensure all tests pass

## Key Files
- `mainframe/server/index.js` — `handlePostClips`
- `mainframe/server/spritesheet.js` — source of thrown errors

## Dependencies
- None. Same bug class as Tasks 54/55.
- Found by QA Reviewer
