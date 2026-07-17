# Task 41: Fix Clip Double-Advancement Risk

## Severity: Low (Race condition)

## Location
`akvj/src/js/visuals/Clip.js:106-137` — `#renderFrame()`, `play()`, `renderToContext()`

## Problem
The `#renderFrame` method calls `#advanceFrame(timestamp)` then `#drawToContext(ctx)`. The guard `#lastAdvanceTimestamp === timestamp` only prevents frame advancement — the draw still happens. If both `play()` and `renderToContext()` are called with the same timestamp, the frame is drawn twice but only advanced once.

In practice, the `Renderer` only calls `renderToContext()`, so this is not currently triggered. But `play()` is public API and could cause issues if used by external consumers or if a clip ends up in multiple layer groups.

## Fix Options
1. Make `play()` internal-only (rename to `#play()` or remove from public API)
2. Document more strongly that `play()` and `renderToContext()` are mutually exclusive per frame
3. Track which context was last drawn to and skip re-drawing if the same timestamp+context is seen

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `akvj/src/js/visuals/Clip.js` — the file to fix
- `akvj/test/Clip.test.js` — existing tests

## Constraints
- Do NOT change current rendering behavior
- Maintain 60fps performance requirement
- Follow private field naming conventions

## Dependencies
- None (discovered during Task 37a code review)
