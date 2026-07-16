# Implement "True Shuffle" Playback Mode

## Background
We recently introduced a `shuffle` playback mode in `akvj/src/js/visuals/Clip.js`. Currently, the implementation merely prevents the *same* frame from being selected sequentially (i.e., avoiding 2, 2, 2). 

## Problem
A "true shuffle" guarantees that every frame in the clip is shown exactly once before any frame is repeated, much like a randomized music playlist or a shuffled deck of cards. Our current implementation does not prevent patterns like 1, 2, 1, 3, 1.

## Required Changes
1. **Update `Clip.js` state**:
   - Add a private array field `#unplayedShuffleFrames = []`.
2. **Update `#advanceNextFrame()` logic for `shuffle`**:
   - When entering shuffle mode or when the `#unplayedShuffleFrames` array is empty, repopulate it with all available frame indices `[0, 1, ..., numberOfFrames - 1]`.
   - Instead of just picking a random number, splice a random index out of `#unplayedShuffleFrames`.
   - Make sure to handle edge cases where the clip only has 1 or 2 frames.
3. **Update Unit Tests**:
   - Update `test/Clip.test.js` to assert that true shuffle plays all frames exactly once before repeating any.
