# Scrub Support for Crossfade Mask

## Background
We have added MIDI CC scrubbing capabilities to the primary layer groups (`LayerGroupA`, `LayerGroupB`, `LayerGroupC`) so that a VJ can manually scrub through clip animations using a dedicated knob.

## Problem
The `MaskManager` (which handles the crossfade mask on the Mixer channel) currently plays back at its own automated speed. Since the VJ might want to tightly couple the crossfade pattern's animation to a physical knob turn (e.g., manually opening and closing a specific mask shape), we should support `playback: 'scrub'` on the Mixer channel as well.

## Required Changes
1. **Settings Update**:
   - In `akvj/src/js/core/settings.js`, add a dedicated CC mapping for the mask scrub (e.g., `mixer_CC: 19`) under the `scrub` configuration block.
2. **MaskManager Update**:
   - Add a `setScrubPosition(normalizedValue)` method to `akvj/src/js/visuals/MaskManager.js`. This should iterate over its internal mask clips and apply the scrub value, similar to how `LayerGroup.js` does it.
3. **LayerManager Routing**:
   - In `akvj/src/js/visuals/LayerManager.js`, update `#handleControlChange` to route the incoming mixer CC value to `this.#maskManager.setScrubPosition()`.
