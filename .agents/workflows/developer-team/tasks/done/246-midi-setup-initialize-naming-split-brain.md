---
status: done
assignee: akvj-developer
priority: low
---

# Task 246: `Midi.js` — `initialize*`/`setup*` Naming Split-Brain + Shadowed `error`

## Source
`.agents/workflows/developer-team/inbox/read/[NIT]-midi-input-recheck-naming-sweep-2026-07-19.md`
(The Nitpicker)

## Affected Files
- `akvj/src/js/midi-input/Midi.js`

## Description
Re-check after a prior `#setup()` → `#initializeMIDIAccess()` rename. The sibling
bootstrap steps and promise tracking still use the old `setup*` verb, so the file now
reads as two vocabularies for the same concept:

1. **Naming split-brain** (`initialize*` vs `setup*`):
   - `Midi.js:17` — field `#setupPromise` (exposed via the `ready` getter,
     `Midi.js:24-26`)
   - `Midi.js:79` — method `#setupStateChangeListener(midiAccess)`
   - `Midi.js:108` — method `#setupMIDIInputs(midiAccess)`
   - Called from `#handleMIDISuccess` (`Midi.js:57-64`) right alongside the already-fixed
     `#initializeMIDIAccess()` (`Midi.js:28`).

2. **Shadowed `error` in `#handleMIDIFailure`** (`Midi.js:66-74`):
   ```js
   #handleMIDIFailure(error) {
       console.error('Failed to get MIDI access:', error);
       try {
           appState.midiConnected = false;
       } catch (error) {              // <- shadows the outer `error` param
           console.warn('Failed to set appState.midiConnected = false on MIDI failure:', error);
       }
       appState.error(`MIDI access failed: ${error?.message ?? 'Unknown error'}...`);
   }
   ```
   Harmless today (each block only reads its own binding), but momentarily ambiguous to
   a reader.

## Discrete Actions
1. Rename to converge on the `initialize*` vocabulary (the already-fixed anchor):
   - `#setupPromise` → `#initializationPromise`
   - `#setupStateChangeListener` → `#initializeStateChangeListener`
   - `#setupMIDIInputs` → `#initializeMIDIInputs`
2. Rename the inner shadowed `catch (error)` in `#handleMIDIFailure` to
   `catch (resetError)` (or similar non-shadowing name).

## Verification
- `npm run lint && npm run test -w akvj && npm run build -w akvj`
- Confirm no remaining references to the old `setup*` names (grep `Midi.js` and its
  test file after the rename).

## Related
- Low-priority naming/readability cleanup — no behavior change.
