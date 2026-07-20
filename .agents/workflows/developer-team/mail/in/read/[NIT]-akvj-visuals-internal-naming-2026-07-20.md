---
type: nit
from: nitpicker
created: 2026-07-20T12:35:23Z
---

# [NIT] `akvj/src/js/visuals/` — legacy `numberOfFrames` private fields and a method/field collision

A quick re-check of the core clip modules turned up two small naming cleanups that make the internals easier to read and keep them aligned with the canonical metadata field names in `AGENTS.md`.

## 1. Private fields still use the legacy `numberOfFrames` name

`AGENTS.md` says `frames` is canonical and `numberOfFrames` is a legacy alias. Three internal classes still store the count as `#numberOfFrames`, even though their constructors accept `frames` and `clipMetadata.js` already normalizes the alias away.

- [ ] `akvj/src/js/visuals/Clip.js`
  - **Current:** `#numberOfFrames` (declaration line 18, assignment line 92, read line 193)
  - **Proposed:** `#frameCount` (or `#frames`, but `#frameCount` avoids shadowing the constructor parameter)
  - **Why:** removes the legacy alias from internal state and matches the canonical `frames` metadata field.

- [ ] `akvj/src/js/visuals/ClipTiming.js`
  - **Current:** `#numberOfFrames` (declaration line 51, assignment line 70, reads lines 324 and 350)
  - **Proposed:** `#frameCount`
  - **Why:** same as above; the constructor already takes `frames`.

- [ ] `akvj/src/js/visuals/PlaybackController.js`
  - **Current:** `#numberOfFrames` (declaration line 10, assignment line 24, reads at lines 62, 105, 117, 124, 125, 136, 141, 146, 166, 179, 180, 190, 193, 195, 204, and 221)
  - **Proposed:** `#frameCount`
  - **Why:** same as above; this is the heaviest user of the legacy name.

## 2. `ClipTiming.js` private callback collides with its public method

- [ ] `akvj/src/js/visuals/ClipTiming.js`
  - **Current:** private field `#unsubscribeFromClock` (line 62, assigned line 174, cleared line 200) and public method `unsubscribeFromClock()` (line 193)
  - **Proposed:** rename the private field to `#clockUnsubscribe` (or `#unsubscribeFromClockCallback`); keep the public method name unchanged
  - **Why:** a reader can't tell `this.#unsubscribeFromClock` (a stored callback) from `this.unsubscribeFromClock()` (the public method) without spotting the `#`. The callback is what gets invoked *inside* the method, so it should have its own name.

---

**Area swept:** `akvj/src/js/visuals/` (`Clip.js`, `ClipTiming.js`, `PlaybackController.js`)
**No out-of-lane findings this sweep.**
