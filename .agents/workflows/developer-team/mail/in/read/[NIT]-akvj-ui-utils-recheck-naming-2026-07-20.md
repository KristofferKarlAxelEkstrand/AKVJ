---
type: nit
from: nitpicker
created: 2026-07-20T09:19:34+00:00
---

# [NIT] akvj/src/js/ui/ + akvj/src/js/utils/ re-check — small naming/typing cleanups

Three small readability gifts for the AKVJ overlay and utility modules. These were missed in earlier sweeps and should be copy-paste actionable.

## 1. `DebugOverlay.js` — `#subscribeBPMEvents` hides a MIDI subscription

- **File:** `akvj/src/js/utils/DebugOverlay.js`
- **Current:** `class DebugOverlay { … #subscribeBPMEvents() { … } … }`
- **Proposed:** Rename to `#subscribeBpmAndMidiConnectionEvents` (or split into `#subscribeBpmEvents` + `#subscribeMidiConnectionEvents`).
- **Rationale:** The method subscribes to both `EVENT_BPM_CHANGED` **and** `EVENT_MIDI_CONNECTION_CHANGED`. The current name only advertises the BPM half.

## 2. `velocitySelection.js` — `buildVelocityCache` JSDoc uses a vague inner type

- **File:** `akvj/src/js/utils/velocitySelection.js`
- **Current:** `@param {Object<string, Object>} clipsByNote`
- **Proposed:** `@param {Object<string, Object<string, Clip>>} clipsByNote`
- **Rationale:** The same `clipsByNote` shape is already typed precisely on `resolveClip`; the vague `Object` here makes readers jump files to remember the structure. (`Clip` may be imported or left as an `@typedef` reference if not currently in scope.)

## 3. `UserMessages.js` — `top` shadows a global and is ambiguous

- **File:** `akvj/src/js/ui/UserMessages.js`
- **Current:** Local `top` in `#renderStack`, `#trapTab`, and `#handleFocusIn` (e.g. `const top = this.#messageStackElement?.querySelector('akvj-user-message');`).
- **Proposed:** Rename to `topMessage` or `topMessageElement`.
- **Rationale:** `top` shadows `window.top` and reads as a direction, not an element. It's always the front-most `akvj-user-message`.

---

**Area swept:** `akvj/src/js/ui/` (3 files) and `akvj/src/js/utils/` (5 files).
**New/updated files in scope:** all current files in both directories.
**No out-of-lane findings this sweep.**
