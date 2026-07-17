# [ARCHITECTURE] Midi singleton instantiated at module load time

## Severity: Medium (Architecture)

## Location
`akvj/src/js/midi-input/Midi.js:286-288`

## Description
The `Midi` class is instantiated as a singleton at the bottom of the module:

```javascript
const midi = new Midi();
export default midi;
```

The constructor immediately calls `#setup()`, which calls `navigator.requestMIDIAccess()` as a side effect of importing the module. This means:

1. **Import side effects**: Simply importing `Midi.js` triggers Web MIDI API access, which may show a permission prompt in Chrome
2. **No cleanup on page unload**: There's no way to cleanly destroy the singleton without HMR
3. **Testing complexity**: Tests must mock `navigator.requestMIDIAccess` before importing the module, or the import itself will fail/trigger side effects
4. **Coupling**: The singleton pattern makes it impossible to have multiple MIDI instances (e.g., for testing with isolated state)

## Impact
- Makes unit testing harder (must mock before import)
- Side effects on import violate principle of least surprise
- Cannot create isolated Midi instances for testing

## Recommendation
Consider lazy initialization — export the `Midi` class and let `main.js` instantiate it:

```javascript
// In Midi.js
export default Midi;

// In main.js
import Midi from './js/midi-input/Midi.js';
const midi = new Midi();
```

This gives callers control over when MIDI access is requested and allows tests to instantiate with mocked `navigator`.
