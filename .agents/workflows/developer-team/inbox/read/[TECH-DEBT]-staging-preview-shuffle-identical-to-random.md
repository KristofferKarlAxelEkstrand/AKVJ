# [TECH-DEBT] StagingPreview shuffle mode is identical to random mode

## Location
`mainframe/src/js/StagingPreview.js:240-245`

## Description
In the `#advanceFrame` method, both `shuffle` and `random` cases use the same logic: `Math.floor(Math.random() * frameCount)`. True shuffle should avoid repeating the same frame consecutively, or should maintain a shuffled order (Fisher-Yates) and iterate through it.

## Impact
`shuffle` and `random` playback modes are functionally identical in the staging preview, which may mislead users testing shuffle behavior.

## Suggested Fix
Implement a Fisher-Yates shuffle queue for `shuffle` mode: pre-compute a shuffled order, iterate through it, and re-shuffle when exhausted. This matches the expected behavior of "shuffle" (every frame plays once before any repeats).
