---
type: test
from: test-marshal
to: team-lead
created: 2026-07-20T20:50:00Z
---

# Midi.js security paths and unsupported-browser path untested

Swept `akvj/src/js/midi-input/Midi.js` (342 lines) against `akvj/test/midi.test.js` (297 lines, 10 tests). The happy paths are well covered (note on/off, CC, system real-time, project selection, hotplug, destroy, rejection, injected settings). Three security features and one compatibility path have zero coverage.

## Gaps

### 1. Max MIDI device limit (`#connectInput` lines 128-132)

Security feature: enforces `settings.midi.maxMidiDevices` (default 8) to prevent resource exhaustion. Never exercised.

- [ ] Connect `maxMidiDevices + 1` devices; assert the last is rejected with `console.warn` and not added to `getConnectedDevices()`
- [ ] Verify the limit reads from injected settings (not just the default 8) — inject `maxMidiDevices: 2`, connect 3, assert only 2 connected

### 2. Invalid byte validation (`#handleMIDIMessage` lines 210-216)

Security feature: validates each byte is a number, integer, in 0-255 range. Rejects malformed messages with `console.warn`. Never exercised.

- [ ] Send a message with a non-number byte (e.g. `new Uint8Array([0x90, 'x', 127])` cast) — assert no dispatch, warn called
- [ ] Send a message with a negative byte — assert rejected
- [ ] Send a message with a >255 byte — assert rejected
- [ ] Send a message with a non-integer byte (e.g. 60.5) — assert rejected

Note: `Uint8Array` clamps to integers 0-255 by construction, so these tests need to use a plain `Array` or mock `message.data` to actually exercise the validation. If the validation is truly unreachable through normal `Uint8Array` messages, that's worth noting — the guard may be dead code in practice.

### 3. WebMIDI unsupported path (`#isSupported` / `#initializeMIDIAccess` lines 32-39)

When `navigator.requestMIDIAccess` is undefined (Firefox/Safari), the constructor logs "WebMIDI is not supported" and `ready` resolves to `Promise.resolve()`. Never exercised — all tests use the fake MIDI fixture which always provides `requestMIDIAccess`.

- [ ] Construct `Midi` with `navigator.requestMIDIAccess = undefined`; assert `midi.ready` resolves, no throw, `getConnectedDevices()` returns `[]`, `appState.midiConnected` stays false
- [ ] Assert `destroy()` is safe on an unsupported instance (no `midiAccess` to clean up)

### 4. `getConnectedDevices()` name fallback (line 194)

`input.name ?? input.id ?? 'unknown'` — the `id` and `'unknown'` fallbacks are never hit. All test fixtures provide devices with a `name`.

- [ ] Connect a device with `name: undefined` (but `id` set) — assert `getConnectedDevices()` returns the id
- [ ] Connect a device with `name: undefined, id: undefined` — assert returns `'unknown'`

## Verified clean

- `akvj/test/midi.test.js` — 10 tests covering: note on/off, velocity-0-as-note-off, CC, system real-time (clock/start/continue/stop), project selection channel, malformed length (<3 bytes), destroy cleanup, hotplug connect/disconnect, requestMIDIAccess rejection, injected settings with maxMessageLength
- `akvj/test/AppState.test.js` (455 lines, 25+ tests) — BPM setter/clamping, CC-to-BPM conversion, clock BPM calculation, rate limiting, clock timeout, transport, project events, boolean/id setters, subscribe/reset
- `akvj/test/UserMessages.test.js` — `showUserMessage` type normalization, empty text guard, `error`/`warn`/`info` helpers, `USER_MESSAGE_TYPES` export
- `akvj/test/AdventureKidVideoJockey.test.js` (467 lines, 21 tests) — `dispatchVideoJockeyReady`, project switching (6 tests), MIDI routing, error paths
- `akvj/test/midiConstants.test.js` (11 lines) — constant export verification
- `akvj/test/settings.test.js` (183 lines) — structural + value validation
