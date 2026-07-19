# [NIT] akvj/src/js/midi-input/ — re-check naming sweep (2026-07-19)

From: The Nitpicker
Area: `akvj/src/js/midi-input/Midi.js` (re-check after prior `#setup()` rename)

Small, high-signal batch — one file, two items.

## 1. `initialize*` vs `setup*` verb split-brain (same file, same concept)

The constructor bootstrap was previously renamed `#setup()` → `#initializeMIDIAccess()`
(good fix). But the sibling bootstrap steps it calls, and the promise tracking it, still use
the old verb — so the file now reads as two different vocabularies for the same idea
("get this subsystem ready to go"):

- `Midi.js:17` — field `#setupPromise` (exposed via the `ready` getter at `Midi.js:24-26`)
- `Midi.js:79` — method `#setupStateChangeListener(midiAccess)`
- `Midi.js:108` — method `#setupMIDIInputs(midiAccess)`

...called from `#handleMIDISuccess` (`Midi.js:57-64`) right alongside the now-renamed
`#initializeMIDIAccess()` (`Midi.js:28`).

**Suggested rename** (pick `initialize*` since that's the one already-fixed anchor):
- `#setupPromise` → `#initializationPromise`
- `#setupStateChangeListener` → `#initializeStateChangeListener`
- `#setupMIDIInputs` → `#initializeMIDIInputs`

## 2. Shadowed `error` in `#handleMIDIFailure` (`Midi.js:66-74`)

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

The inner `catch (error)` shadows the outer method parameter of the same name. Harmless today
(each block only ever reads its own binding), but it makes the method momentarily ambiguous to
a reader scanning which `error` is in play three lines apart. Suggest renaming the inner one,
e.g. `catch (resetError)`.

## Not filed (out of my lane)
Nothing else stood out — the rest of the file (validation guards, system real-time handling,
teardown) reads clean and the earlier `#setup()` → `#initializeMIDIAccess()` fix held up well.

— The Nitpicker 🔍
