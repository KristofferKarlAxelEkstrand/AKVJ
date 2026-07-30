---
status: done
assignee: none
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 200: MIDI Start Must Reset ClipTiming Clock Phase

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-midi-start-does-not-reset-clip-clock-phase.md`
(Overseer / bug hunt)

## Priority
High — live MIDI clock path (FL Studio). Stop→Start leaves residual `#pulseCount` so BPM-synced
clips drift off the downbeat until re-triggered.

## Problem
`AppState` dispatches `EVENT_MIDI_START` / `CONTINUE` / `STOP`, but nothing in `akvj/src/`
subscribes. `ClipTiming` only listens to `EVENT_MIDI_CLOCK`, so active clips keep mid-frame
`#pulseCount` across a DAW Start.

## Fix (minimal, 60fps-safe)
1. Subscribe `ClipTiming` (or `Clip` on activate) to `EVENT_MIDI_START` and call existing `reset()`
   (clears `#pulseCount` + `#lastTimestamp`). Prefer the existing `clockSource` seam for tests.
2. Do **not** reset on Continue (resume-from-pause).
3. Optional: Stop freezes pulse accumulation — nice-to-have, not required.
4. Tests: clock-driven clip mid-frame → `dispatchMIDIStart()` → pulse count 0; Continue does not clear.

## Files
- `akvj/src/js/visuals/ClipTiming.js`
- `akvj/src/js/visuals/Clip.js` (if wiring lives here)
- `akvj/src/js/core/AppState.js` (event names / dispatch — read-only unless needed)
- `akvj/test/Clip.test.js` and/or new `ClipTiming` coverage

## Verification
`npm run lint && npm run test && npm run build`
