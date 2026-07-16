# Task: Implement "True Shuffle" Playback Mode

## Objective
Upgrade the `shuffle` playback mode from "no immediate repeat" to true shuffle (every frame shown once before any repeat).

## Requirements
1. Add `#unplayedShuffleFrames = []` private array field to `Clip.js`
2. When entering shuffle mode or array is empty, repopulate with all frame indices
3. Splice a random index from `#unplayedShuffleFrames` instead of picking random number
4. Handle edge cases (1-2 frames)
5. Update `test/Clip.test.js` to assert true shuffle behavior

## Dependencies
- `shuffle` playback mode already implemented in `Clip.js`
