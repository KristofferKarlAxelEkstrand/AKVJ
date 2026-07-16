# Task: Update Clip Scaffolding Scripts for Playback Modes

## Objective
Update CLI scaffolding scripts to generate `playback` instead of deprecated `loop` in meta.json templates.

## Requirements
1. Update `mainframe/scripts/clips/spritesheet.js` — use `playback: 'loop'` instead of `loop: true`
2. Update `mainframe/scripts/clips/new.js` — use `playback: 'loop'` instead of `loop: true`
3. Update existing `clips/*/meta.json` files to use `playback` instead of `loop`

## Dependencies
- Playback modes feature already implemented in `Clip.js`
