---
status: backlog
assignee: none
priority: medium
---

# Task 347: AKVJ overlay and utility naming cleanups

## Source

Nitpicker `[NIT]-akvj-ui-utils-recheck-naming-2026-07-20.md`

## Description

Three small readability cleanups in `akvj/src/js/ui/` and `akvj/src/js/utils/`:

### 1. `DebugOverlay.js` — BPM/MIDI subscription name

- **File:** `akvj/src/js/utils/DebugOverlay.js`
- **Current:** `#subscribeBPMEvents()`
- **Change:** Rename to `#subscribeBpmAndMidiConnectionEvents()` (or split into `#subscribeBpmEvents` + `#subscribeMidiConnectionEvents`).
- **Rationale:** The method subscribes to both `EVENT_BPM_CHANGED` and `EVENT_MIDI_CONNECTION_CHANGED`; the current name only advertises the BPM half.

### 2. `velocitySelection.js` — `buildVelocityCache` JSDoc typing

- **File:** `akvj/src/js/utils/velocitySelection.js`
- **Current:** `@param {Object<string, Object>} clipsByNote`
- **Change:** `@param {Object<string, Object<string, Clip>>} clipsByNote`
- **Rationale:** The same `clipsByNote` shape is already typed precisely on `resolveClip`; the vague `Object` makes readers jump files to remember the structure. (`Clip` may be imported or left as an `@typedef` reference if not currently in scope.)

### 3. `UserMessages.js` — `top` shadows a global and is ambiguous

- **File:** `akvj/src/js/ui/UserMessages.js`
- **Current:** Local `top` in `#renderStack`, `#trapTab`, and `#handleFocusIn` (e.g. `const top = this.#messageStackElement?.querySelector('akvj-user-message');`)
- **Change:** Rename to `topMessage` or `topMessageElement`.
- **Rationale:** `top` shadows `window.top` and reads as a direction, not an element. It's always the front-most `akvj-user-message`.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
