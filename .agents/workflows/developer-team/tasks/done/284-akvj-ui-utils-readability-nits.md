---
status: done
assignee: akvj-developer
priority: medium
---

# Task 284: AKVJ UI / utils small readability nits

## Description

Non-behavioral cleanup in `akvj/src/js/ui/` and `akvj/src/js/utils/` to remove dead fields and magic values, and fix a malformed JSDoc type.

## Findings

### 1. Dead `time` field in DebugOverlay MIDI log entries
- **File**: `akvj/src/js/utils/DebugOverlay.js`
- **Current**: `#addLogEntry` pushes `{ type, message, time: performance.now() }` into `#midiLogEntries`.
- **Proposed**: Remove the `time` field (or rename to `timestamp` and use it for stale-entry pruning).
- **Rationale**: `#renderLog` only reads `entry.type` and `entry.message`, so `time` is dead weight.

### 2. Magic hex colors for MIDI connection status
- **File**: `akvj/src/js/utils/DebugOverlay.js`
- **Current**:
  ```js
  this.#midiStatusElement.style.color = connected ? '#0f0' : '#f00';
  ```
- **Proposed**: Add constants at the top of the file, e.g. `MIDI_CONNECTED_COLOR = '#0f0'` and `MIDI_DISCONNECTED_COLOR = '#f00'`, then:
  ```js
  this.#midiStatusElement.style.color = connected ? MIDI_CONNECTED_COLOR : MIDI_DISCONNECTED_COLOR;
  ```
- **Rationale**: Per `code-standards.md`, magic string literals should be named constants.

### 3. Malformed JSDoc type in `resolveClip`
- **File**: `akvj/src/js/utils/velocitySelection.js`
- **Current**: `@param {Object<string, Object<string, Clip>} clipsByNote`
- **Proposed**: `@param {Object<string, Object<string, Clip>>} clipsByNote`
- **Rationale**: The nested generic is missing its closing `>`.

## Affected files

- `akvj/src/js/utils/DebugOverlay.js`
- `akvj/src/js/utils/velocitySelection.js`

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. No runtime behavior changes.

## Notes

- These are naming/readability nits only; do not change log rendering behavior unless `timestamp` pruning is implemented.
