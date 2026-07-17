# Task 65: Revert MaskManager destroy() Calls (Task 42)

## Severity: High (Broken functionality)

## Location
`akvj/src/js/visuals/MaskManager.js` — `#applyNewMask()` and `clear()`

## Problem
Task 42 added `this.#currentMask.destroy()` calls in `MaskManager.js`. This breaks the engine because AKVJ uses a singleton pattern for clips — `ClipLoader` instantiates all clips once, and the same `Clip` instance is returned every time its note/velocity is triggered.

When `MaskManager` calls `destroy()` on a mask clip, it nullifies the clip's `#image` reference. If the user triggers that same mask again, `MaskManager` receives the previously-destroyed clip instance. Because `#image` is now null, the clip silently fails to render. This permanently breaks any mask after it has been swapped out once.

There is no memory leak to fix — the number of MIDI clock subscriptions equals the number of clips loaded, which doesn't grow over time. `LayerGroup.js` correctly handles this by only calling `clip.stop()`, never `clip.destroy()`.

## Fix
Revert the changes made in Task 42:
- Remove the try-catch block containing `this.#currentMask.destroy()` in `#applyNewMask()`
- Remove the try-catch block containing `this.#currentMask.destroy()` in `clear()`
- Leave only `this.#currentMask.stop()` in both places

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify masks can be swapped and re-triggered without breaking

## Key Files
- `akvj/src/js/visuals/MaskManager.js`
- `akvj/test/MaskManager.test.js`

## Dependencies
- Task 42 ✅ Complete (but needs reverting)
- Found by QA Reviewer during audit of Task 42
