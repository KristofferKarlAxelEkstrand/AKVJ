# [BUG] Async Race Condition in Midi destroy() (Memory Leak)

## Issue Description
Task 43 refactored the `Midi` class for lazy initialization, but exposed a critical async race condition in the cleanup logic that causes memory leaks and duplicate MIDI events during HMR.

When `new Midi()` is called, its constructor synchronously calls `#setup()`, which kicks off `#requestAccess()`. This awaits the async `navigator.requestMIDIAccess()`. 

If `destroy()` is called *before* that promise resolves (which can easily happen during fast HMR reloads), `destroy()` executes and clears the current state. 
However, milliseconds later, the `requestMIDIAccess()` promise resolves. The `#requestAccess()` method then blindly resumes execution: it assigns `this.#midiAccess` and calls `#handleMIDISuccess()`, which attaches `midimessage` event listeners to all hardware inputs and a `statechange` listener to `midiAccess`.

Because `destroy()` was already called and the old `Midi` instance is discarded, it is permanently orphaned in memory. Every time a key is pressed on a MIDI controller, this orphaned instance (and any other active instance) will fire duplicate events into `appState`.

## How to Fix
Introduce a `#destroyed = false` flag to prevent async initialization from completing if the instance has been destroyed.

1. Add `#destroyed = false;` to the `Midi` class fields.
2. Set `this.#destroyed = true;` inside `destroy()`.
3. Update `#requestAccess()` to check the flag before proceeding:

```javascript
	async #requestAccess() {
		try {
			const midiAccess = await navigator.requestMIDIAccess();
			if (this.#destroyed) {
				return;
			}
			this.#midiAccess = midiAccess;
			this.#handleMIDISuccess(this.#midiAccess);
		} catch (error) {
			if (this.#destroyed) {
				return;
			}
			this.#handleMIDIFailure(error);
		}
	}
```
