---
status: done
assignee: akvj-developer
priority: high
---

# Task 243: `ClipTiming.js` — Speed-Multiplier + Progress-Based Clock-Driven Rewrite

## Epic
`.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md` — Phase 3 (depends on
tasks 241 and 242 — do not start until both report done)

## Source
`.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`
(Sync-to-BPM Redesign — human-approved spec, especially "How it works in ClipTiming")

## Affected Files
- `akvj/src/js/visuals/ClipTiming.js`
- Its test file (e.g. `akvj/test/ClipTiming.test.js` or `Clip.test.js` — check current
  test coverage location)

## Description
This is the core of the redesign. `ClipTiming` currently assigns beat duration
per-frame (`frameDurationBeats`), distorting each clip's natural relative frame timing.
Rewrite it to preserve `frameRatesForFrames` and scale the **whole clip** as a unit.

### Time-based beat mode (no MIDI clock)
1. Compute `naturalDuration` = sum of `1000 / fps` for every frame, using the default
   frame rate (`#initDefaultFrameRate()` / existing fallback) for frames without an
   explicit `frameRatesForFrames` entry.
2. Compute `targetDuration = (syncBeats × 60000) / bpm`.
3. Compute `speedMultiplier = targetDuration / naturalDuration`.
4. `getFrameInterval(frameIndex)` returns `(1000 / fps) × speedMultiplier`.

### Clock-driven beat mode (MIDI clock active)
1. **At init time** (clip construction, since `frameRatesForFrames` is static clip
   metadata): precompute a cumulative frame-proportion table from natural per-frame
   durations (see spec example — 4 frames → 5-entry table from 0.0 to 1.0).
2. Compute `totalPulses = round(syncBeats × 24)` — fixed, independent of BPM.
3. On each clock pulse: increment `pulseCount`, compute
   `progress = pulseCount / totalPulses`.
4. Look up the linear frame index for `progress` via the cumulative-proportion table.
5. Call `PlaybackController.setLinearProgress(progress)` (task 241) — **do not**
   re-implement per-playback-mode frame mapping here, that's `PlaybackController`'s job.
6. `loop`: wrap `pulseCount %= totalPulses` and continue. `once`: signal finished, stop
   rendering (clip shows nothing once complete — same for `reverse` and `pingpong`
   `once` combos, per spec "Resolved questions" #6/#7).
7. `random` / `shuffle`: sync does not apply — leave their existing internal
   advance-on-interval logic untouched, do not route them through progress/pulse
   tracking at all.

### Architecture change
Replace the current step-based `onAdvance()` → `PlaybackController.advance()` call for
clock-driven beat mode with the progress-based path above. **`advance()` continues to be
used unchanged for free mode and time-based beat mode** — only clock-driven beat mode
switches to `setLinearProgress()`.

### MIDI clock dropout mid-playback
If the MIDI clock stops while a clock-driven clip is mid-playback, fall back to
time-based mode using the project's fallback BPM — continue seamlessly (no freeze, no
reset/retrigger). See spec "Resolved questions" #8.

### Retrigger + clock sync
On retrigger, `pulseCount` resets to 0 and the clip runs its own independent pulse count
from the trigger moment — full `totalPulses` duration, regardless of the global clock's
current bar/beat position. See spec "Resolved questions" #9.

### No cap on extreme speed multipliers
Do not add capping or warning logic for extreme `syncBeats`/natural-duration ratios —
let it happen as authored. See spec "Resolved questions" #10.

## Discrete Actions
1. Remove the existing per-frame beat-duration / `pulsesPerFrame` logic.
2. Implement time-based speed-multiplier mode per above.
3. Implement the cumulative-proportion table + progress-based clock-driven mode per
   above, calling `PlaybackController.setLinearProgress()`.
4. Implement MIDI-clock-dropout fallback to time-based mode.
5. Implement retrigger reset behavior for `pulseCount`.
6. Confirm `random` / `shuffle` modes are untouched (sync fields ignored for them).

## Verification
- Unit tests for speed-multiplier calculation (use the spec's worked example: 4-frame
  clip, `frameRatesForFrames: { 0: 1, 1: 2, 2: 1, 3: 4 }`, `1 bar` at 120 BPM →
  speedMultiplier ≈ 0.727).
- Unit tests for the cumulative-proportion table and progress-based clock advancement
  (loop wrap, once completion, reverse, pingpong via `PlaybackController`).
- Unit test for MIDI clock dropout → time-based fallback.
- Unit test for retrigger resetting `pulseCount` independent of global clock position.
- Run `npm run lint && npm run test -w akvj && npm run build -w akvj`.

## Related
- Depends on task 241 (`PlaybackController.setLinearProgress`) and task 242
  (`clipMetadata.js` resolving `syncBeats`) — both must be done first.
- This is the last akvj-side phase; mainframe phases (244, 245) can proceed in parallel
  and don't block or get blocked by this task.
