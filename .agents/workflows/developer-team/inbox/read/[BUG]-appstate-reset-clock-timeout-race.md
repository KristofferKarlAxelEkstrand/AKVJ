# [BUG] AppState.reset() does not clear clock timeout callback's pending execution

## Severity: Low (Race condition)

## Location
`akvj/src/js/core/AppState.js:188-199` — `#resetClockTimeout()` and `akvj/src/js/core/AppState.js:310-323` — `reset()`

## Description
`#resetClockTimeout()` sets a `setTimeout` that, when fired, changes `#bpmSource` to `BPM_SOURCE_DEFAULT` and dispatches `EVENT_BPM_SOURCE_CHANGED`. The `reset()` method clears the timeout:

```javascript
if (this.#clockTimeoutId !== null) {
    clearTimeout(this.#clockTimeoutId);
    this.#clockTimeoutId = null;
}
```

This is correct — `clearTimeout` cancels the pending callback. However, there's a subtle race: if `dispatchMIDIClock()` is called and `#resetClockTimeout()` runs, setting a new timeout, and then `reset()` is called in the same microtask, the timeout is properly cleared.

The actual issue is more subtle: `#processClockPulse` modifies `#lastClockTime` and `#recentPulseIntervals`, and `reset()` clears these. But if a MIDI clock event is already in the event queue when `reset()` is called, the event will fire after reset and re-populate these fields, causing the state to be dirty again.

## Impact
Low — only affects test scenarios where reset() is called while MIDI events are still being dispatched. In production, reset() is only called during teardown.

## Recommendation
Add a `#isDestroyed` flag that gates `dispatchMIDIClock()` and other public methods, so post-reset events are no-ops. Or, document that callers must ensure no MIDI events are in-flight when reset() is called.
