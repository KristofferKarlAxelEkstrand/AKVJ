# Update Clip Scaffolding Scripts for Playback Modes

## Background
The VJ system has migrated from the boolean `"loop": true/false` parameter to the string-based `"playback": "loop" | "once" | ...` parameter for clip metadata.

## Problem
The CLI scripts used to scaffold new clips (e.g., via `npm run clips:new`) are still generating boilerplate `meta.json` files with the deprecated `loop` parameter. The validation pipeline converts these with a warning, but we should generate valid metadata by default.

## Required Changes
1. **Update `mainframe/scripts/clips/spritesheet.js`**:
   - Change the generated JSON template to output `playback: 'loop'` instead of `loop: true` (around line 133).
2. **Update `mainframe/scripts/clips/new.js`**:
   - Change the `defaultMeta` object to use `playback: 'loop'` instead of `loop: true` (around line 31).
