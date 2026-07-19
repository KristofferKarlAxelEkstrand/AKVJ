# Epic: Sync-to-BPM Redesign

## Status: Complete (2026-07-19)

## Spec
`.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`

## Summary
Redesigns how the already-shipped Clip Timing & Sync feature (Tasks 136-149) computes
beat-synced playback: moves from a per-frame `frameDurationBeats` model to a
**total-clip-duration + speed-multiplier** model that preserves each clip's natural
relative frame timing (`frameRatesForFrames`) instead of distorting it. All open
questions on the spec are resolved (see spec doc "Resolved questions" 1-11) — this is
implementation-ready.

This is real rework, not a tweak: it removes `frameDurationBeats` as a concept entirely
(field + expansion logic, both in akvj's `clipMetadata.js` and mainframe's mirrored
`syncTiming.js`), replaces step-based clock advancement with progress-based advancement
for clock-driven beat mode, requires a new `PlaybackController.setLinearProgress()`
method, hard-rejects `frameDurationBeats` in mainframe validation (alpha, no legacy
fallback), and migrates the 5 existing clips that use `frameDurationBeats` today
(mechanical — table is in the spec).

## Phases (dependency order)

| Phase | Task | Owner | Status | Description |
| --- | --- | --- | --- | --- |
| 1 | 241 | akvj-developer | backlog | `PlaybackController.setLinearProgress(progress)` — maps 0.0-1.0 progress to a frame index per playback mode (loop/once/reverse/pingpong; random/shuffle ignore sync) |
| 2 | 242 | akvj-developer | backlog | `clipMetadata.js` — remove `frameDurationBeats` resolution/expansion, resolve `syncLength` → `syncBeats` only |
| 3 | 243 | akvj-developer | backlog | `ClipTiming.js` rewrite — speed-multiplier time-based mode + progress-based clock-driven mode (depends on 241 + 242) |
| 4 | 244 | mainframe-developer | backlog | Mainframe `syncTiming.js` mirror + validation hard-rejects `frameDurationBeats` in `meta.json` |
| 5 | 245 | mainframe-developer | backlog | Migrate the 5 existing clips off `frameDurationBeats` to `syncBeats` (depends on 244) |

Phases 1-2 and phase 4 have no dependency on each other and can run in parallel across
the two developers. Phase 3 needs both 241 and 242 done first. Phase 5 needs 244's
validation change to land first (so the migrated clips pass validation).

## Check before re-proposing
- This epic is newly opened — nothing shipped yet, all 5 phases above are legitimate open work.
- If new sync/BPM findings come in before this epic completes, check whether they're
  already covered by one of the 5 phases before filing a new task.
