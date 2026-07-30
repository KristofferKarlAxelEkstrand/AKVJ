---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 256: Save `frameDurationsMs` to Clip Metadata in Mainframe

## Epic
`.agents/workflows/developer-team/epics/done/timing-alignment-analysis.md` — Phase 4 (COMPLETED)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-timing-alignment-tasks.md`

## Affected Files
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/scripts/clips/lib/validate/meta.js`

## Description
Update mainframe to save `frameDurationsMs` to clip metadata when editing clips, enabling ms-based timing persistence across the system.

### Requirements
- Save `frameDurationsMs` to clip metadata when editing clips
- Convert UI ms values to metadata format
- Ensure validation accepts ms arrays
- Maintain backward compatibility with `frameRatesForFrames`

## Discrete Actions
1. Update `ClipEditorController.js` to save `frameDurationsMs` from UI
2. Convert UI timing inputs to ms-based metadata format
3. Update validation in `meta.js` to accept `frameDurationsMs` arrays
4. Ensure clips with only `frameRatesForFrames` continue to validate
5. Add tests for ms-based metadata persistence

## Verification
- `npm run lint && npm run test -w mainframe && npm run build -w mainframe`
- Test that `frameDurationsMs` is saved correctly
- Test validation accepts ms arrays
- Test backward compatibility with FPS-based clips

## Related
- Can be done in parallel with sync epic task 244
- Blocks task 257 (UI update)
- Blocks task 258 (clip migration)
