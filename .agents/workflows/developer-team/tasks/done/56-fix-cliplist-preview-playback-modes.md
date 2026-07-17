# Task 56: Fix ClipList Preview Missing Playback Modes

## Severity: Low (Tech debt)

## Location
`mainframe/src/js/ClipList.js:323-349`

## Problem
The `animate` function in `#createClipPreviewPlayer` only handles `once` and `loop` playback modes. It does not implement `pingpong`, `reverse`, `random`, `shuffle`, or `scrub` modes. `StagingPreview.js` properly implements all modes.

## Fix
Extract the playback mode logic into a shared utility function and use it in both `ClipList` and `StagingPreview`. Alternatively, copy the `#advanceFrame` switch-case logic from `StagingPreview` into `ClipList`'s `animate` function.

## Key Files
- `mainframe/src/js/ClipList.js`
- `mainframe/src/js/StagingPreview.js` — reference for correct implementation

## Dependencies
- None (discovered during Task 37b)
