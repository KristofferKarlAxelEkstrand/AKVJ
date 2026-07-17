# [BUG] MaskManager does not destroy old mask clip when replaced

## Severity: Low (Memory leak)

## Location
`akvj/src/js/visuals/MaskManager.js:74-81` — `#applyNewMask()`

## Description
When a new mask is applied, the old mask clip is stopped via `this.#currentMask.stop()` but `destroy()` is never called on it. The `Clip.destroy()` method unsubscribes from MIDI clock events and nulls the image reference. Without calling `destroy()`, the old mask clip retains its MIDI clock subscription and image reference.

Each mask clip that uses BPM sync (`frameDurationBeats`) subscribes to `EVENT_MIDI_CLOCK` via `appState.subscribe()`. If masks are changed frequently during a performance, these subscriptions accumulate as dangling event listeners.

## Impact
- Accumulating event listeners on `appState` for each replaced mask clip
- Image references retained for old masks, preventing GC
- In a long performance session with frequent mask changes, this could cause measurable memory growth and increased clock event processing time

## Recommendation
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
