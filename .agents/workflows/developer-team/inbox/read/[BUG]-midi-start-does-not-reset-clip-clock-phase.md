# [BUG] MIDI Start does not reset ClipTiming clock phase

## Priority
High — live performance path. User drives AKVJ from FL Studio and has explicitly prioritized MIDI clock / BPM-sync accuracy (“near 1:1” with the music). Transport Start is how a DAW re-aligns the song; clips that keep a mid-frame pulse residual will drift off the downbeat after every Stop→Start.

## Where
- `akvj/src/js/core/AppState.js` — `dispatchMIDIStart()` / `dispatchMIDIContinue()` / `dispatchMIDIStop()` (events are dispatched)
- `akvj/src/js/visuals/ClipTiming.js` — `#pulseCount`, `reset()`, `subscribeToClock()` / `#handleClockPulse()`
- `akvj/src/js/visuals/Clip.js` — wires `ClipTiming`; `reset()` clears pulse count only on clip (re)trigger

## Problem
`AppState` correctly receives MIDI Start / Continue / Stop and dispatches `EVENT_MIDI_START` / `CONTINUE` / `STOP`. **Nothing in `akvj/src/` subscribes to those events** (confirmed via repo-wide grep; also noted as dead event surface in `epics/refactor-for-greateness*.md`).

`ClipTiming` only listens to `EVENT_MIDI_CLOCK`. Its per-clip `#pulseCount` advances toward `#pulsesPerFrame[frame]` and wraps to 0 when a frame advances. On a DAW **Start** (0xFA):

1. AppState clears its own clock interval state.
2. Active BPM-synced clips keep whatever residual `#pulseCount` they had (e.g. 4 of 6).
3. The next clock train therefore advances the first frame early/late relative to the new song phase — clips stay musically out of phase until each clip is re-triggered (which calls `ClipTiming.reset()`).

MIDI Continue should **not** force a phase reset (resume-from-pause semantics). Stop alone can leave residual count; the critical missing wire is **Start → reset pulse phase on all clock-driven clips**.

Task 80 (“Audit and Harden MIDI Clock”) listed “Start/Stop/Continue handling” in scope and is in `tasks/done/`, but this wiring was never landed — the events are still publisher-only.

## Suggested Fix
Minimal, keep vanilla / 60fps-safe:

1. Have `ClipTiming` (or `Clip` on activate) also subscribe to `EVENT_MIDI_START` and call the existing `reset()` (clears `#pulseCount` + `#lastTimestamp`). Prefer injecting via the existing `clockSource` seam so tests stay injectable.
2. Do **not** reset on Continue.
3. Optionally on Stop: freeze pulse accumulation (today `#handleClockPulse` already no-ops when `bpmSource !== CLOCK` after timeout; explicit Stop handling is nice-to-have, not required for the phase bug).
4. Add unit tests: clock-driven clip mid-frame → `dispatchMIDIStart()` → `#pulseCount === 0` (and Continue does not clear).

## Reproduction (conceptual)
1. Load a beat-synced looping clip; drive MIDI clock at 120 BPM until mid-frame (`pulseCount` ≠ 0).
2. Send MIDI Stop, then MIDI Start (FL Studio transport restart).
3. Observe first frame advance not aligned to the new Start boundary.

## Notes
- Related prior fix (stale `#lastTimestamp` when falling off clock → time mode) is already in place; this ticket is specifically about **phase** on Start, not the wall-clock fallback.
- `goal.md` real-world usage: FL Studio, full 16-channel aim, clock reliability load-bearing.
