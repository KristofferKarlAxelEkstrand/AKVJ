# [BUG] Revert MaskManager destroy() calls

## Issue Description
Task 42 added `this.#currentMask.destroy()` calls in `MaskManager.js` inside `#applyNewMask()` and `clear()`. The justification was to fix a "memory leak" by cleaning up image references and unsubscribing from MIDI clock events when a mask is replaced.

However, this fundamentally breaks the `MaskManager`. The AKVJ engine uses a singleton pattern for clips — `ClipLoader` instantiates all clips once, and the exact same `Clip` instance is returned by `resolveClip()` every time its corresponding note/velocity is triggered. 

When `MaskManager` calls `destroy()` on a mask clip, it nullifies the clip's `#image` reference. If the user ever triggers that exact same mask again, `MaskManager` will receive the previously-destroyed clip instance. Because `#image` is now null, the clip will silently fail to render. This permanently breaks any mask after it has been swapped out once.

Furthermore, there is no memory leak to fix here. The number of MIDI clock subscriptions is exactly equal to the number of clips loaded into memory, which does not grow over time. `LayerGroup.js` correctly handles this by only calling `clip.stop()` on replacement, never `clip.destroy()`.

## How to Fix
Please revert the changes made in `MaskManager.js` for Task 42:
- Remove the `try-catch` block containing `this.#currentMask.destroy();` in `#applyNewMask()`.
- Remove the `try-catch` block containing `this.#currentMask.destroy();` in `clear()`.

Leave only `this.#currentMask.stop();` in both places. Clips should only be destroyed when the entire VJ engine or `ClipLoader` is torn down.
