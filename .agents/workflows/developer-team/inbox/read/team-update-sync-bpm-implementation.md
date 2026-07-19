# Team Update: Sync-to-BPM Redesign Implementation

## Summary
The sync-to-bpm-redesign epic (`.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md`) is ready for implementation. The epic already has 5 phases defined (tasks 241-245), but additional timing alignment work is needed to integrate `frameDurationsMs` from mainframe into the AKVJ engine.

## Impact
This affects both AKVJ timing system and mainframe clip management. The redesign removes `frameDurationBeats` and introduces a total-clip-duration + speed-multiplier model. Additionally, we need to align the timing systems to use `frameDurationsMs` (ms per frame) instead of `frameRatesForFrames` (FPS per frame).

## Action Needed
The team should implement this epic in the following breakdown:

### AKVJ Developer Tasks
1. **Task 241**: `PlaybackController.setLinearProgress(progress)` — maps 0.0-1.0 progress to frame index per playback mode
2. **Task 242**: `clipMetadata.js` — remove `frameDurationBeats`, resolve `syncLength` → `syncBeats` only
3. **Task 243**: `ClipTiming.js` rewrite — speed-multiplier + progress-based clock-driven mode
4. **NEW**: Add `frameDurationsMs` support to `clipMetadata.js` normalization
5. **NEW**: Update `ClipTiming.js` to use ms values directly when available
6. **NEW**: Maintain FPS fallback for backward compatibility

### Mainframe Developer Tasks
1. **Task 244**: Mainframe `syncTiming.js` mirror + validation hard-rejects `frameDurationBeats`
2. **Task 245**: Migrate 5 existing clips off `frameDurationBeats` to `syncBeats`
3. **NEW**: Save `frameDurationsMs` to clip metadata when editing clips
4. **NEW**: Update UI to work with ms values natively
5. **NEW**: Convert existing `frameRatesForFrames` → `frameDurationsMs` in clip metadata

### QA Reviewer Tasks
1. Review timing alignment analysis (`.agents/workflows/developer-team/drafts/timing-alignment-analysis.md`)
2. Test ms-based timing in AKVJ engine
3. Validate mainframe ms persistence
4. Verify clip migration completeness

## Notes
- Detailed timing alignment analysis available in `drafts/timing-alignment-analysis.md`
- Epic spec: `spec/featue-how-sync-to-bpm-works-for-clips.md`
- Current epic phases 1-2 and phase 4 can run in parallel
- Phase 3 needs both 241 and 242 done first
- New timing alignment tasks should be prioritized after core epic tasks
