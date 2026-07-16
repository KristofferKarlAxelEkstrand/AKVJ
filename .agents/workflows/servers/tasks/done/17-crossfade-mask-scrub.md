# Task: Scrub Support for Crossfade Mask

## Objective
Add MIDI CC scrubbing support to the MaskManager so the VJ can manually control crossfade mask animation.

## Requirements
1. Add `mixer_CC: 19` to `scrub` config in `settings.js`
2. Add `setScrubPosition(normalizedValue)` method to `MaskManager.js`
3. Update `LayerManager.js` `#handleControlChange` to route mixer CC to maskManager
4. Write tests for mask scrub

## Dependencies
- Scrub CC routing already implemented for layer groups in `LayerManager.js`
