# Task 48: Cache DebugOverlay DOM Element References

## Severity: Low (Code quality)

## Location
`akvj/src/js/utils/DebugOverlay.js:136-175`

## Problem
DebugOverlay uses `document.getElementById()` on every MIDI event and BPM change instead of caching element references during `#createOverlay()`.

## Fix
Cache element references as private fields during `#createOverlay()`. Use `querySelector` on the element (not `document`) because the element isn't in the DOM yet during construction.

## Key Files
- `akvj/src/js/utils/DebugOverlay.js`
- `akvj/test/DebugOverlay.test.js`

## Dependencies
- None (discovered during Task 37a)
