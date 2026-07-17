# [ARCHITECTURE] AppState singleton makes testing isolation fragile

## Severity: Medium (Architecture)

## Location
`akvj/src/js/core/AppState.js:326-328`

## Description
`AppState` is exported as a singleton instance (`const appState = new AppState()`). While there's a `reset()` method for testing, the singleton pattern means:

1. **Shared state across test files**: If tests run in the same module context, state leaks between test suites
2. **Event listener accumulation**: `reset()` does NOT remove event listeners — it explicitly documents this: "Event listeners remain attached after reset." This means if a test subscribes and forgets to unsubscribe, the listener persists across all tests.
3. **Clock timeout leak**: While `reset()` clears `#clockTimeoutId`, any pending `setTimeout` callback that's already in the macrotask queue will still fire.

## Impact
- Test flakiness due to shared state
- Event listener leaks in tests can cause unexpected callbacks
- Hard to test BPM clock logic in isolation

## Recommendation
Consider exporting the `AppState` class as the default export and having `main.js` instantiate it. For testing, each test can create a fresh instance. Alternatively, enhance `reset()` to also remove all event listeners (set `this.#eventListeners = new Map()` or similar).

If the singleton pattern must stay, consider adding a `destroy()` method that calls `reset()` and removes all listeners.
