# Team Update: Timing Alignment Tasks

## Summary
The timing alignment analysis (`.agents/workflows/developer-team/epics/timing-alignment-analysis.md`) identifies gaps between AKVJ's FPS-based timing (`frameRatesForFrames`) and mainframe's ms-based timing (`frameDurationsMs`). We need to align these systems while integrating with the ongoing sync-to-bpm-redesign epic.

## Impact
This affects both AKVJ engine timing and mainframe clip management. The alignment will enable direct ms-per-frame control, simpler math, and shared timing format across both systems.

## Action Needed
The team should implement timing alignment in these specific tasks, coordinated with the existing sync-to-bpm-redesign epic:

### AKVJ Developer Tasks

**Task 246**: Add `frameDurationsMs` to AKVJ metadata normalization
- File: `akvj/src/js/visuals/clipMetadata.js`
- Add `frameDurationsMs` to normalized metadata
- Support both `frameRatesForFrames` (legacy) and `frameDurationsMs` (new)
- Convert `frameDurationsMs` → FPS internally for backward compatibility
- Priority: Medium (can be done in parallel with sync epic tasks 241-242)

**Task 247**: Update AKVJ timing engine for ms support
- File: `akvj/src/js/visuals/ClipTiming.js`
- Add support for ms-based timing via `frameDurationsMs`
- Use ms values directly when available (no FPS conversion needed)
- Maintain FPS fallback for backward compatibility
- Update beat sync to work with ms values instead of FPS conversion
- Priority: High (depends on Task 246, should be done after Task 243)

**Task 248**: Implement ms ↔ FPS conversion utilities in AKVJ
- File: `akvj/src/js/visuals/` (new module or existing)
- Implement `msToFps()`, `fpsToMs()`, `durationsMsToFrameRates()` utilities
- Mirror mainframe's `frameTiming.js` functionality (no shared imports)
- Use for backward compatibility with `frameRatesForFrames`
- Priority: Medium (can be done in parallel with other tasks)

### Mainframe Developer Tasks

**Task 249**: Save `frameDurationsMs` to clip metadata
- File: `mainframe/src/js/ClipEditorController.js` (or similar)
- Save `frameDurationsMs` to clip metadata when editing clips
- Convert UI ms values to metadata format
- Ensure validation accepts ms arrays
- Priority: Medium (can be done in parallel with sync epic task 244)

**Task 250**: Update mainframe UI for ms-based timing
- File: `mainframe/src/js/` (relevant UI components)
- Update UI to work with ms values natively
- Ensure staging preview continues to work with ms values
- Update any FPS-based inputs to use ms instead
- Priority: Low (can be done after Task 249)

**Task 251**: Migrate existing clips to ms-based timing
- Convert existing `frameRatesForFrames` → `frameDurationsMs` in clip metadata
- Use reverse of mainframe's `durationsMsToFrameRates()` logic
- Update default clips in `projects/default/clips/`
- Priority: Low (depends on Tasks 246 and 249)

### QA Reviewer Tasks

**Task 252**: Review timing alignment implementation
- Review timing alignment analysis document
- Verify AKVJ ms support works correctly
- Test backward compatibility with FPS values
- Validate mainframe ms persistence
- Priority: Medium (depends on Tasks 246-249)

## Coordination with Sync-to-BPM Redesign Epic

The timing alignment work should be coordinated with the existing sync-to-bpm-redesign epic:

- **Tasks 241-243** (sync epic): Core sync redesign - prioritize first
- **Task 246** (timing alignment): Can be done in parallel with Tasks 241-242
- **Task 247** (timing alignment): Should be done after Task 243 (sync epic)
- **Tasks 244-245** (sync epic): Mainframe sync work - can be done in parallel with Task 249
- **Tasks 248, 250-251** (timing alignment): Lower priority, can be done after core sync work

## Notes
- Timing alignment analysis: `.agents/workflows/developer-team/epics/timing-alignment-analysis.md`
- Sync-to-BPM redesign epic: `.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md`
- Mainframe's existing ms utilities: `mainframe/shared/frameTiming.js`
- Must maintain backward compatibility with `frameRatesForFrames` during transition
- Cannot share imports between AKVJ and mainframe per architecture rules
