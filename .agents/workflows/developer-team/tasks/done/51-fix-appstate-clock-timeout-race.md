# Task 51: Fix AppState.reset() Clock Timeout Race

## Severity: Low (Race condition)

## Location
`akvj/src/js/core/AppState.js:188-199` and `akvj/src/js/core/AppState.js:310-323`

## Problem
If a MIDI clock event is already in the event queue when `reset()` is called, the event fires after reset and re-populates `#lastClockTime` and `#recentPulseIntervals`, dirtying the state.

## Fix
Add a `#isDestroyed` flag that gates `dispatchMIDIClock()` and other public methods, so post-reset events are no-ops. Or document that callers must ensure no MIDI events are in-flight when `reset()` is called.

## Key Files
- `akvj/src/js/core/AppState.js`

## Dependencies
- None (discovered during Task 37a)
- Related to Task 46 (AppState singleton refactor)
