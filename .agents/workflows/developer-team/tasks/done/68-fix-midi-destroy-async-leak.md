# Task 68: Fix Midi destroy() Async Race Condition

## Severity: High (Memory leak / duplicate events)

## Location
`akvj/src/js/midi-input/Midi.js` — `#requestAccess()` and `destroy()`

## Problem
Task 43's lazy initialization exposed a race condition: if `destroy()` is called before `navigator.requestMIDIAccess()` resolves, the promise still resolves and attaches event listeners to the orphaned instance. This causes memory leaks and duplicate MIDI events during HMR.

## Fix
Add a `#destroyed = false` flag:
1. Add `#destroyed = false;` to class fields
2. Set `this.#destroyed = true;` in `destroy()`
3. Check `this.#destroyed` in `#requestAccess()` after the await, before proceeding

```javascript
async #requestAccess() {
    try {
        const midiAccess = await navigator.requestMIDIAccess();
        if (this.#destroyed) return;
        this.#midiAccess = midiAccess;
        this.#handleMIDISuccess(this.#midiAccess);
    } catch (error) {
        if (this.#destroyed) return;
        this.#handleMIDIFailure(error);
    }
}
```

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify HMR doesn't leave orphaned MIDI instances

## Key Files
- `akvj/src/js/midi-input/Midi.js`

## Constraints
- Follow private field naming conventions (`#destroyed`)
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 43 ✅ Complete (but introduced this bug)
- Found by QA Reviewer during audit of Task 43
