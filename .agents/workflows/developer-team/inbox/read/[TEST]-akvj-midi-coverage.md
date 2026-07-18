# [TEST] akvj — Midi.js missing coverage for Control Change, System Real-Time, project selection, and MIDI failure

**From:** Test Marshal  
**Area:** `akvj/src/js/midi-input/Midi.js`  
**Date:** 2026-07-18  
**Tier:** unit  

## Summary

`Midi.js` (315 lines) has 6 tests in `midi.test.js` covering Note On, Note Off, malformed
messages, destroy, and hot-plug. However, three critical message types and the failure
path are completely untested.

## Findings

### 1. Control Change messages untested

`#dispatchChannelMessage` handles `commands.controlChange` (0xB0) by calling
`appState.dispatchMIDIControlChange(channel, controller, value)`. This is the path for:
- Mixer crossfading (channel 5)
- Effects parameters (channels 10, 13)
- BPM source changes

No test sends a CC message or verifies the dispatch.

### 2. System Real-Time messages untested

`#handleSystemRealTime` handles clock (0xF8), start (0xFA), continue (0xFB), stop (0xFC)
by dispatching to `appState.dispatchMIDIClock`, `dispatchMIDIStart`, `dispatchMIDIContinue`,
`dispatchMIDIStop`. These are critical for BPM-synced clip playback.

No test sends any system real-time message or verifies the dispatch.

### 3. Project selection via MIDI untested

`#handleNoteOn` checks `channel === settings.channelMapping.projectSelection` and calls
`#handleProjectSelection(note)` → `appState.dispatchProjectSelection(note)`. This is the
MIDI path for switching projects during live performance.

No test sends a Note On on the project selection channel or verifies the dispatch.

### 4. MIDI access failure untested

`#handleMIDIFailure(error)` sets `appState.midiConnected = false` and dispatches an error
message via `appState.error()`. No test simulates `navigator.requestMIDIAccess()` rejection
to verify this path.

## Existing coverage (clean)

- Note On with velocity > 0 ✓
- Note On with velocity 0 → Note Off ✓
- Note Off command ✓
- Malformed messages (length < 3) ✓
- destroy() cleanup ✓
- Hot-plug connect/disconnect ✓

## Priority

**High** — Control Change and System Real-Time are core VJ features. BPM sync and effects
control depend on these paths. Project selection is a live-performance critical feature.
All are untested despite being well-isolated for unit testing with the existing
`useFakeMIDIFixture` pattern.
