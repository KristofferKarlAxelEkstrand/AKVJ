# Update mainframe UI for Playback Modes

## Background
We recently replaced the boolean `loop` property in clip `meta.json` files with a robust `playback` string enum (supporting `once`, `loop`, `pingpong`, `random`, `reverse`, `shuffle`, and `scrub`). 

## Problem
The VJ mainframe UI (`npm run dev:mainframe`) located at `mainframe/src/main.js` currently renders an HTML checkbox for the deprecated `loop` parameter. When saving clip metadata via the UI, it will inject the old `loop` boolean format into the clip's `meta.json` rather than the new `playback` parameter.

## Required Changes
1. **Update `mainframe/src/main.js`**:
   - Locate where the `loopInput` checkbox is created (around line 465).
   - Replace it with a `<select>` dropdown menu containing all the valid playback strings.
   - Default the selection to the clip's current `playback` property, falling back to `'loop'` if missing.
   - Ensure the form submission logic saves the selected value under the `playback` key and no longer saves the `loop` key.
2. **Review Canvas Preview**:
   - Check if the mainframe UI's canvas preview loop (around line 329) needs to be updated to respect `playback` (e.g., stopping playback if it is `'once'`).
