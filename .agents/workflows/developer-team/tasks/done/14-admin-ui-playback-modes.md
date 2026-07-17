# Task: Update mainframe UI for Playback Modes

## Objective
Replace the deprecated `loop` checkbox in the mainframe UI with a `playback` dropdown select.

## Requirements
1. Replace `loopInput` checkbox in `mainframe/src/main.js` with a `<select>` dropdown
2. Options: `once`, `loop`, `pingpong`, `random`, `reverse`, `shuffle`, `scrub`
3. Default to clip's current `playback` property, falling back to `'loop'` if missing
4. Save under `playback` key, not `loop` key
5. Check canvas preview loop for `playback` compatibility

## Dependencies
- Playback modes feature already implemented in `Clip.js`
