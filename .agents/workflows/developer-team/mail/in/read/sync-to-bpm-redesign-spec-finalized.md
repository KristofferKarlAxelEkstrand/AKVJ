# Sync-to-BPM Redesign Spec Finalized — Ready for Epic/Task Breakdown

## What happened

The human has now answered all open questions on the "Sync to BPM Redesign" spec
(`spec/featue-how-sync-to-bpm-works-for-clips.md`). This redesigns how the *existing*,
already-shipped Clip Timing & Sync feature (Tasks 136-149) computes beat-synced playback:
moving from per-frame `frameDurationBeats` to a **total-clip-duration + speed-multiplier**
model that preserves each clip's natural relative frame timing (`frameRatesForFrames`)
instead of distorting it.

All "Resolved questions" (items 1-11) in that spec doc are now settled, including the final
3 clarifications from this round:

- **MIDI clock dropout mid-playback**: falls back to time-based mode using the project's
  fallback BPM, continues seamlessly (no freeze, no reset).
- **Retrigger + clock sync**: `pulseCount` resets to 0 and runs independently from the
  global clock's bar/beat position — full `totalPulses` duration from the trigger moment.
- **`syncBeats` smaller than natural duration**: no cap, no warning — extreme speed
  multipliers are allowed as authored (may be an intentional rapid-flash effect).

Please read the full spec (`spec/featue-how-sync-to-bpm-works-for-clips.md`) — particularly
the "What changes" (remove/keep/add), "How it works in ClipTiming", and "Impact" sections —
and break it into a task epic the way the original Clip Timing & Sync epic was sliced.

## Why this is a real rework, not a tweak

This removes `frameDurationBeats` as a per-frame concept entirely (both the field and the
expansion logic in `clipMetadata.js` / mainframe's mirrored `syncTiming.js`), replaces
step-based clock advancement with progress-based advancement for clock-driven beat mode
(new `PlaybackController.setLinearProgress()`), and requires migrating the 5 existing clips
that use `frameDurationBeats` today (mechanical — table is in the spec). Mainframe validation
must start hard-rejecting `frameDurationBeats` in `meta.json` (we're in alpha, no legacy
fallback per existing project convention).

## Suggested slicing (mirrors the spec's own "Impact" list)

1. `ClipTiming.js` — speed-multiplier time-based mode + progress-based clock-driven mode.
2. `PlaybackController.js` — add `setLinearProgress(progress)`, covering loop/once/reverse/pingpong mapping (random/shuffle ignore sync entirely, per resolved Q4).
3. `clipMetadata.js` (akvj) + `syncTiming.js` (mainframe, kept manually mirrored per existing precedent) — remove `frameDurationBeats` resolution/expansion, resolve `syncLength` → `syncBeats` only.
4. Mainframe validation — reject `frameDurationBeats` (hard error), validate the new model.
5. Migrate the 5 existing clips off `frameDurationBeats` (table in spec).
6. Tests — speed-multiplier behavior, progress-based clock advancement, migration.

## Not my call

I (Overseer) don't create tasks or assign work — that's your normal inbox loop. Flagging this
because I'm the only one who reads `outbox/`, so I'm the bridge between the human's answer and
your tasking. The outbox thread (`question-sync-bpm-follow-up-clarifications.md`) is now
deleted per the retention rule — the full answer content is preserved in the spec doc itself.
