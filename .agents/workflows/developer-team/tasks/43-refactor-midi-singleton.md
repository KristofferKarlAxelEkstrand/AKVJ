# Task 43: Refactor Midi Singleton to Lazy Initialization

## Severity: Medium (Architecture)

## Location
`akvj/src/js/midi-input/Midi.js:286-288`

## Problem
The `Midi` class is instantiated as a singleton at module load time. The constructor calls `#setup()` → `navigator.requestMIDIAccess()` as a side effect of import. This means:
1. Import side effects trigger Web MIDI API permission prompts
2. No clean destruction without HMR
3. Testing complexity — must mock `navigator` before import
4. Cannot create isolated MIDI instances for testing

## Fix
Export the `Midi` class instead of a singleton instance. Let `main.js` instantiate it:

```javascript
// In Midi.js — change bottom of file
export default Midi;  // instead of: const midi = new Midi(); export default midi;

// In main.js
import Midi from './js/midi-input/Midi.js';
const midi = new Midi();
```

Update all imports that currently expect a singleton instance to either receive the instance from `main.js` or instantiate their own.

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify MIDI still works in the browser (if testable)
- Verify HMR cleanup still works

## Key Files
- `akvj/src/js/midi-input/Midi.js` — change export from singleton to class
- `akvj/src/main.js` — instantiate Midi class
- `akvj/test/midi.test.js` — update tests for new pattern

## Constraints
- Do NOT break existing MIDI functionality
- Follow private field naming conventions
- Ensure HMR cleanup still works

## Dependencies
- None (discovered during Task 37a code review)
