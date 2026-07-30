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

# Task 241: `PlaybackController.setLinearProgress()` for Clock-Driven Beat Sync

## Epic
`.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md` — Phase 1

## Source
`.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`
(Sync-to-BPM Redesign — human-approved spec)

## Affected Files
- `akvj/src/js/visuals/PlaybackController.js`
- `akvj/test/PlaybackController.test.js` (or wherever its tests currently live)

## Description
The redesigned sync model drives clock-synced clips by progress (0.0-1.0 through the
clip's `totalPulses`) rather than by stepping one frame at a time. `ClipTiming` will
compute a **linear** frame index (0 → N-1) from that progress via a precomputed
cumulative-proportion table, but `PlaybackController` is the sole owner of mapping that
linear index to the actual displayed frame per playback mode — `ClipTiming` must not
special-case playback modes itself.

Add `setLinearProgress(progress)` to `PlaybackController`:
- `loop` / `once`: direct mapping (linear index === displayed frame)
- `reverse`: `N - 1 - linearIndex`
- `pingpong`: maps progress across the forward+backward span (0 → N-1 → 0, i.e. `2N-2`
  steps) — progress `0.5` lands on the last frame, progress `1.0` returns to frame 0
- `random` / `shuffle`: not applicable — sync does not apply to these modes (see spec
  "Resolved questions" #4), so this method should not be called for them; document that
  assumption rather than silently handling it
- On `once` completion (progress reaches 1.0 for loop/once/reverse/pingpong per the
  spec's per-mode rules): signal finished so the caller can stop rendering — do not
  invent new completion semantics here, `ClipTiming` (task 243) owns deciding when
  playback is "done" and calling this method

This method is purely a progress → frame-index mapping function; it should not need to
know about beats, pulses, or BPM — that's `ClipTiming`'s job (task 243), which will call
this method once `setLinearProgress` exists.

## Discrete Actions
1. Add `setLinearProgress(progress)` to `PlaybackController.js`, following existing
   private-field / bound-handler conventions in the file.
2. Cover all four applicable playback modes (`loop`, `once`, `reverse`, `pingpong`) with
   unit tests, including boundary values (`progress = 0`, `progress = 1`, midpoint for
   pingpong).
3. Do not touch `random` / `shuffle` handling — leave existing behavior for those modes
   untouched; this method simply isn't invoked for them.

## Verification
- Add unit tests for `setLinearProgress()` covering loop/once/reverse/pingpong mapping
  and boundary progress values.
- Run `npm run lint && npm run test -w akvj && npm run build -w akvj`.

## Related
- Blocks task 243 (`ClipTiming.js` rewrite), which will call this method for
  clock-driven beat mode.
- Independent of task 242 — can be worked in either order or in parallel.
