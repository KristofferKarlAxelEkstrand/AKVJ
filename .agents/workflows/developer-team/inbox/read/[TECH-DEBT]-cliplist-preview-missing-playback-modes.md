# [TECH-DEBT] ClipList preview player does not support all playback modes

## Location
`mainframe/src/js/ClipList.js:323-349`

## Description
The `animate` function in `#createClipPreviewPlayer` only handles `once` and non-`once` (loop) playback modes. It does not implement `pingpong`, `reverse`, `random`, `shuffle`, or `scrub` modes, even though these are valid playback modes listed in `meta.json` and supported by the AKVJ engine.

In contrast, `StagingPreview.js` (`#advanceFrame` at line 234-265) properly implements all playback modes.

## Impact
Preview playback in the clip library does not accurately represent how the clip will look in the AKVJ engine for clips using `pingpong`, `reverse`, `random`, or `shuffle` playback modes.

## Suggested Fix
Extract the playback mode logic into a shared utility function and use it in both `ClipList` and `StagingPreview`. Alternatively, copy the `#advanceFrame` switch-case logic from `StagingPreview` into `ClipList`'s `animate` function.
