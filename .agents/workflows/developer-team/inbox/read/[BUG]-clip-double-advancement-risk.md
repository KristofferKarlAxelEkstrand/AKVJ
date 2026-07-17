# [BUG] Clip double-advancement risk when both play() and renderToContext() are called

## Severity: Low (Race condition)

## Location
`akvj/src/js/visuals/Clip.js:106-137` — `#renderFrame()`, `play()`, `renderToContext()`

## Description
The `#renderFrame` method calls `#advanceFrame(timestamp)` then `#drawToContext(ctx)`. The `#advanceFrame` method guards against double-advancement using `#lastAdvanceTimestamp === timestamp`, but this guard only prevents advancement — the **draw** still happens.

If both `play()` and `renderToContext()` are called with the same timestamp (e.g., a clip is in Layer Group A and also somehow rendered to another context), the frame will be drawn twice but only advanced once. This is noted in the JSDoc comment on `renderToContext()` but relies on caller discipline.

In practice, the `Renderer` calls `renderToContext()` for layer group clips and never calls `play()`, so this is not currently triggered. However, the `play()` method is public API and could be called by external consumers.

## Impact
Low — current architecture doesn't trigger this. But it's a latent bug if the API is used by external code or if a clip ends up in multiple layer groups.

## Recommendation
Consider making `play()` internal-only or documenting more strongly that `play()` and `renderToContext()` are mutually exclusive per frame. Alternatively, track which context was last drawn to and skip re-drawing if the same timestamp+context is seen.
