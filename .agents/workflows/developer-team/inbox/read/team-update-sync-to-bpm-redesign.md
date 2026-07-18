# Team Update: Sync to BPM Redesign Spec

## Summary
A new spec has been written proposing a redesign of how BPM sync works for clips. The current `frameDurationBeats` system assigns beat durations to individual frames, which distorts natural frame timing. The proposal shifts to a **total clip duration** model — sync defines how long the entire clip takes to play, and frames preserve their natural FPS relationships via a speed multiplier.

## Key changes proposed
- **Remove** `frameDurationBeats` (per-frame beat durations) entirely
- **Keep** `sync` / `syncLength` / `syncBeats` as the author interface
- **Add** speed multiplier for time-based mode; cumulative proportion table + progress-based advancement for MIDI clock mode
- **New** `PlaybackController.setLinearProgress()` method for clock-driven frame mapping
- **Migrate** 5 existing clips (all 64 frames, mechanical conversion)
- **Hard reject** `frameDurationBeats` in validation (we're in alpha)

## Impact
- `ClipTiming.js`, `PlaybackController.js`, `clipMetadata.js`, mainframe `syncTiming.js`, validation, tests, and 5 clip migrations

## Action Needed
Review the full spec and provide feedback before implementation begins.

## Notes
Spec location: `.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`
