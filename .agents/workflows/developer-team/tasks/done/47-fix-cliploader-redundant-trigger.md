# Task 47: Remove ClipLoader Redundant Trigger Type Setting

## Severity: Low (Tech debt)

## Location
`akvj/src/js/visuals/ClipLoader.js:82-99` and `akvj/src/js/visuals/ClipLoader.js:109-135`

## Problem
`triggerType` and `triggerGroup` are set both in the `Clip` constructor (via `#createClip()`) AND overwritten externally in `#buildClipsObject()`. Redundant double-set creates confusion about source of truth.

## Fix
Option 2 (cleaner): Remove the external set in `#buildClipsObject()` and rely on the constructor. The Clip should own its trigger behavior.

## Key Files
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/test/ClipLoader.test.js`

## Dependencies
- None (discovered during Task 37a)
