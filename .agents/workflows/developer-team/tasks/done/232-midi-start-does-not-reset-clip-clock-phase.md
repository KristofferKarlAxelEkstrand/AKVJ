---
status: completed
assignee: akvj-developer
priority: high
---

# Task 232: MIDI Start Does Not Reset ClipTiming Clock Phase

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-midi-start-does-not-reset-clip-clock-phase.md`

## Affected Files
- `akvj/src/js/core/AppState.js` — `dispatchMIDIStart()` / `dispatchMIDIContinue()` / `dispatchMIDIStop()` (events are dispatched)
- `akvj/src/js/visuals/ClipTiming.js` — `#pulseCount`, `reset()`, `subscribeToClock()` / `#handleClockPulse()`
- `akvj/src/js/visuals/Clip.js` — wires `ClipTiming`; `reset()` clears pulse count only on clip (re)trigger

## Description
AppState correctly receives MIDI Start / Continue / Stop and dispatches `EVENT_MIDI_START` / `CONTINUE` / `STOP`. **Nothing in `akvj/src/` subscribes to those events** (confirmed via repo-wide grep; also noted as dead event surface in `epics/refactor-for-greateness*.md`).

ClipTiming only listens to `EVENT_MIDI_CLOCK`. Its per-clip `#pulseCount` advances toward `#pulsesPerFrame[frame]` and wraps to 0 when a frame advances. On a DAW **Start** (0xFA):

1. AppState clears its own clock interval state.
2. Active BPM-synced clips keep whatever residual `#pulseCount` they had (e.g. 4 of 6).
3. The next clock train therefore advances the first frame early/late relative to the new song phase — clips stay musically out of phase until each clip is re-triggered (which calls `ClipTiming.reset()`).

MIDI Continue should **not** force a phase reset (resume-from-pause semantics). Stop alone can leave residual count; the critical missing wire is **Start → reset pulse phase on all clock-driven clips**.

Task 80 ("Audit and Harden MIDI Clock") listed "Start/Stop/Continue handling" in scope and is in `tasks/done/`, but this wiring was never landed — the events are still publisher-only.

## Discrete Actions
1. Have `ClipTiming` (or `Clip` on activate) also subscribe to `EVENT_MIDI_START` and call the existing `reset()` (clears `#pulseCount` + `#lastTimestamp`). Prefer injecting via the existing `clockSource` seam so tests stay injectable.
2. Do **not** reset on Continue.
3. Optionally on Stop: freeze pulse accumulation (today `#handleClockPulse` already no-ops when `bpmSource !== CLOCK` after timeout; explicit Stop handling is nice-to-have, not required for the phase bug).
4. Add unit tests: clock-driven clip mid-frame → `dispatchMIDIStart()` → `#pulseCount === 0` (and Continue does not clear).

## Verification
- Add unit tests for Start/Continue/Stop behavior
- Run `npm run lint`, `npm run test -w akvj`, `npm run build -w akvj`

## Related
- Related prior fix (stale `#lastTimestamp` when falling off clock → time mode) is already in place; this ticket is specifically about **phase** on Start, not the wall-clock fallback
- `goal.md` real-world usage: FL Studio, full 16-channel aim, clock reliability load-bearing

## Status: COMPLETED

This task was already implemented in the codebase. The implementation was found in `akvj/src/js/visuals/ClipTiming.js` at line 150:

```javascript
const unsubscribeFromMidiStart = this.#clockSource.subscribe(EVENT_MIDI_START, () => this.reset());
```

The implementation correctly:
- Subscribes to `EVENT_MIDI_START` and calls `reset()` to clear pulse phase
- Does NOT subscribe to `EVENT_MIDI_CONTINUE` (preserves resume semantics)
- Uses the injected `clockSource` seam for testability
- Has comprehensive unit tests in `ClipTiming.test.js` (lines 158-211)

The task description was outdated - it stated "Nothing in `akvj/src/` subscribes to those events" but the implementation was already in place. This was likely completed as part of the comprehensive MIDI clock hardening work.

All verification passed:
- ✅ `npm run lint` - No errors
- ✅ `npm run test -w akvj` - All tests passing
- ✅ `npm run build -w akvj` - Production build successful
