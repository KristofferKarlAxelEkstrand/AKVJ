---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 181: Midi.js Test Coverage — CC, System Real-Time, Project Selection, MIDI Failure

## Source
`.agents/workflows/developer-team/inbox/[TEST]-akvj-midi-coverage.md`
(Test Marshal — critical MIDI message types and failure path untested).

## Scope

### 1. Control Change messages (HIGH)
- Send CC message (0xB0) → verify `appState.dispatchMIDIControlChange(channel, controller, value)` called
- This is the path for mixer crossfading (ch 5), effects parameters (ch 10, 13), BPM source changes

### 2. System Real-Time messages (HIGH)
- Clock (0xF8) → `appState.dispatchMIDIClock`
- Start (0xFA) → `appState.dispatchMIDIStart`
- Continue (0xFB) → `appState.dispatchMIDIContinue`
- Stop (0xFC) → `appState.dispatchMIDIStop`
- Critical for BPM-synced clip playback

### 3. Project selection via MIDI (HIGH)
- Note On on `settings.channelMapping.projectSelection` channel → `appState.dispatchProjectSelection(note)` called
- Live-performance critical feature

### 4. MIDI access failure (MEDIUM)
- `navigator.requestMIDIAccess()` rejection → `appState.midiConnected = false` + error message dispatched

## Use existing `useFakeMIDIFixture` pattern from `midi.test.js`.

## Verification
- `npm run test -w akvj`
- `npm run lint`

## Files
- `akvj/test/midi.test.js` (existing — add cases)
- `akvj/src/js/midi-input/Midi.js` (reference)
