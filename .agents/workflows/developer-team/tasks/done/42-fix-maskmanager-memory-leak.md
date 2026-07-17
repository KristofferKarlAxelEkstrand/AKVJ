# Task 42: Fix MaskManager Memory Leak on Replace

## Severity: Low (Memory leak)

## Location
`akvj/src/js/visuals/MaskManager.js:74-81` — `#applyNewMask()`

## Problem
When a new mask is applied, the old mask clip is stopped via `this.#currentMask.stop()` but `destroy()` is never called. Without `destroy()`, the old mask clip retains its MIDI clock subscription and image reference.

Each BPM-synced mask clip subscribes to `EVENT_MIDI_CLOCK` via `appState.subscribe()`. If masks are changed frequently during a performance, these subscriptions accumulate as dangling event listeners.

## Fix
Call `this.#currentMask.destroy()` before replacing it in `#applyNewMask()`. Also call `destroy()` in the `clear()` method before nulling the reference.

```javascript
#applyNewMask(clip) {
    if (this.#currentMask && this.#currentMask !== clip) {
        this.#currentMask.stop();
        this.#currentMask.destroy();  // Add this
    }
    ...
}

clear() {
    if (this.#currentMask) {
        this.#currentMask.stop();
        this.#currentMask.destroy();  // Add this
    }
    ...
}
```

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify that mask changes don't accumulate event listeners

## Key Files
- `akvj/src/js/visuals/MaskManager.js` — the file to fix
- `akvj/test/MaskManager.test.js` — existing tests

## Constraints
- Do NOT change mask behavior — only fix the cleanup
- Follow private field naming conventions
- Wrap destroy() calls in try-catch per existing error handling patterns

## Dependencies
- None (discovered during Task 37a code review)
