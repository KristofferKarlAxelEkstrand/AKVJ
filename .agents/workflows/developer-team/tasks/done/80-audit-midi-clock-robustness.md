# Task 80: Audit and Harden MIDI Clock / BPM-Sync Robustness

## Severity: High (User priority — "an ok way to use the midi clock is important")

## Context
User drives AKVJ live from FL Studio over MIDI for real performances, aiming for tight 1:1 sync with the music. MIDI clock correctness is actively load-bearing, not theoretical. This task audits the full MIDI clock → BPM → clip advancement pipeline for robustness.

## Scope
1. **MIDI clock reception** — verify `Midi.js` correctly receives and dispatches clock pulses (24 PPQN)
2. **BPM calculation** — verify `AppState.js` correctly derives BPM from clock pulse intervals
3. **Clock timeout fallback** — verify the 500ms timeout correctly falls back to CC/default BPM
4. **Clip clock subscription** — verify Task 70's subscribe-on-activate pattern works correctly in production
5. **`frameDurationBeats` timing** — verify BPM-synced clips advance at the correct rate
6. **Start/Stop/Continue handling** — verify MIDI Start, Continue, and Stop messages are handled correctly
7. **Edge cases** — tempo changes mid-performance, clock drift, missing pulses, very fast/slow tempos
8. **Latency** — verify <20ms MIDI-to-visual latency requirement is met

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Test with simulated MIDI clock pulses at various BPMs (60, 120, 174, 300)

## Key Files
- `akvj/src/js/midi-input/Midi.js` (clock reception)
- `akvj/src/js/core/AppState.js` (BPM calculation, clock timeout)
- `akvj/src/js/visuals/Clip.js` (BPM-synced advancement)
- `akvj/src/js/core/settings.js` (BPM settings, PPQN)

## Constraints
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 70 (Clip clock subscription) — completed
- Task 43 (Midi lazy init) — completed
- Task 68 (Midi destroy async race) — completed
