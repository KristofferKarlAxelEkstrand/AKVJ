---
status: done
assignee: mainframe-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 258: Migrate Existing Clips to ms-Based Timing

## Epic
`.agents/workflows/developer-team/epics/done/timing-alignment-analysis.md` — Phase 6 (COMPLETED)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-timing-alignment-tasks.md`

## Affected Files
- Clip metadata files in `projects/default/clips/` and other projects

## Description
Convert existing clips from `frameRatesForFrames` (FPS-based) to `frameDurationsMs` (ms-based) timing to complete the timing alignment transition.

### Requirements
- Convert existing `frameRatesForFrames` → `frameDurationsMs` in clip metadata
- Use reverse of mainframe's `durationsMsToFrameRates()` logic (FPS = 1000 / durationMs)
- Update default clips in `projects/default/clips/`
- Ensure playback timing remains identical after conversion

## Discrete Actions
1. Identify all clips with `frameRatesForFrames` in the repository
2. Convert each clip's timing data to `frameDurationsMs` format
3. Update clip metadata files
4. Run clip pipeline to validate all clips
5. Test that playback timing is unchanged

## Verification
- `npm run clips` (validate/optimize/generate/copy pipeline)
- `grep -r "frameRatesForFrames" projects/` returns no results after migration
- Test playback timing is unchanged for migrated clips
- Run `npm run test -w akvj && npm run test -w mainframe`

## Related
- Depends on tasks 253 and 256 (both systems support ms)
- Lower priority, can be done after core timing work
