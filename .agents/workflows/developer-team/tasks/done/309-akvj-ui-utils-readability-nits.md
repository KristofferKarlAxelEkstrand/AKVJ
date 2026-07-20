---
status: in-progress
assignee: akvj-developer
priority: medium
---

# Task 309: AKVJ UI / utils readability nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-akvj-ui-utils-readability-sweep-2026-07-19.md`

## Description

Apply three small readability cleanups to `akvj/src/js/utils/DebugOverlay.js` and `akvj/src/js/utils/velocitySelection.js`.

## Findings and actions

### 1. Dead `time` field in DebugOverlay MIDI log entries

**File:** `akvj/src/js/utils/DebugOverlay.js`

**Current:** `#addLogEntry` pushes `{ type, message, time: performance.now() }` into `#midiLogEntries`.

**Proposed:** Remove the unused `time` field.

**Rationale:** `#renderLog` only reads `entry.type` and `entry.message`; `time` is dead weight.

### 2. Magic hex colors for MIDI connection status

**File:** `akvj/src/js/utils/DebugOverlay.js`

**Current:**
```js
this.#midiStatusElement.style.color = connected ? '#0f0' : '#f00';
```

**Proposed:**
- Add constants near the top of the file:
  - `MIDI_CONNECTED_COLOR = '#0f0'`
  - `MIDI_DISCONNECTED_COLOR = '#f00'`
- Use them in the ternary.

**Rationale:** Magic string literals should be named constants; named colors also make the intent obvious.

### 3. Malformed JSDoc type in `resolveClip`

**File:** `akvj/src/js/utils/velocitySelection.js`

**Current:** `@param {Object<string, Object<string, Clip>} clipsByNote`

**Proposed:** `@param {Object<string, Object<string, Clip>>} clipsByNote`

**Rationale:** The nested generic is missing its closing `>`.

## Affected files

- `akvj/src/js/utils/DebugOverlay.js`
- `akvj/src/js/utils/velocitySelection.js`

## Verification

- `npm run lint -w akvj` passes.
- `npm run test -w akvj` passes.
- `npm run build -w akvj` passes.

## Notes

- No runtime behavior changes; these are naming/constant/JSDoc cleanups.
