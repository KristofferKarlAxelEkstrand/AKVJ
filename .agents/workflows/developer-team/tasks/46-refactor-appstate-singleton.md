# Task 46: Refactor AppState Singleton for Testing Isolation

## Severity: Medium (Architecture)

## Location
`akvj/src/js/core/AppState.js:326-328`

## Problem
`AppState` is exported as a singleton. `reset()` does NOT remove event listeners, causing test flakiness and listener leaks across test suites.

## Fix
Either:
1. Export the `AppState` class and let `main.js` instantiate it (like Task 43 for Midi)
2. Enhance `reset()` to also remove all event listeners
3. Add a `destroy()` method that calls `reset()` and removes all listeners

## Key Files
- `akvj/src/js/core/AppState.js`
- `akvj/test/` — tests that use AppState

## Dependencies
- None (discovered during Task 37a)
