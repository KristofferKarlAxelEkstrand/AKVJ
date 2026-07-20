---
status: in-progress
assignee: akvj-developer
priority: medium
review: machine
---

# 427 — Midi.js security paths and unsupported-browser path untested

From: `[TEST]-akvj-midi-security-and-unsupported.md` (test-marshal).

`akvj/test/midi.test.js` covers happy paths well. Three security features and one compatibility
path have zero coverage. Add tests (test-only — touch no product source unless a guard turns out
to be dead code, in which case note it in the report).

- **Max MIDI device limit** (`#connectInput`, `Midi.js:128-132`) — connect `maxMidiDevices + 1`
  devices, assert the last is rejected; verify the limit reads from injected settings (inject
  `maxMidiDevices: 2`, connect 3, assert only 2 connected).
- **Invalid byte validation** (`#handleMIDIMessage`, `Midi.js:210-216`) — non-number, negative,
  >255, non-integer bytes are rejected with `console.warn` and no dispatch. Note: `Uint8Array`
  clamps to 0-255 integers by construction, so these need a plain `Array` or mocked `message.data`.
  If the validation is truly unreachable through normal `Uint8Array` messages, say so — the guard
  may be dead code in practice.
- **WebMIDI unsupported path** (`#isSupported` / `#initializeMIDIAccess`, `Midi.js:32-39`) —
  construct `Midi` with `navigator.requestMIDIAccess = undefined`; assert `ready` resolves, no
  throw, `getConnectedDevices()` returns `[]`, `appState.midiConnected` stays false; assert
  `destroy()` is safe on an unsupported instance.
- **`getConnectedDevices()` name fallback** (`Midi.js:194`) — device with `name: undefined` (id set)
  returns the id; device with `name: undefined, id: undefined` returns `'unknown'`.

Scope: `akvj/test/midi.test.js` (and `akvj/src/js/midi-input/Midi.js` only if a guard is dead code
and you remove it — note that in the report). Verify: `npm run lint`, `npm run test`.
