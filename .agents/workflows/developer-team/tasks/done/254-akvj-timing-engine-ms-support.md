---
status: done
assignee: akvj-developer
priority: high
---

# Task 254: Update AKVJ Timing Engine for ms Support

## Epic
`.agents/workflows/developer-team/epics/done/timing-alignment-analysis.md` — Phase 2 (COMPLETED)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-timing-alignment-tasks.md`

## Affected Files
- `akvj/src/js/visuals/ClipTiming.js`

## Description
Update the AKVJ timing engine to use ms-based timing via `frameDurationsMs` when available, eliminating FPS conversion overhead and aligning with mainframe's timing format.

### Requirements
- Add support for ms-based timing via `frameDurationsMs` in `ClipTiming.js`
- Use ms values directly when available (no FPS conversion needed)
- Maintain FPS fallback for backward compatibility with `frameRatesForFrames`
- Update beat sync logic to work with ms values instead of FPS conversion
- Ensure 60fps performance is maintained

## Discrete Actions
1. Update `ClipTiming.js` to check for `frameDurationsMs` first, fall back to `frameRatesForFrames`
2. Modify timing calculations to use ms values directly when available
3. Update beat sync calculations to work with ms-based timing
4. Ensure FPS-based clips continue to work via conversion
5. Add tests for ms-based timing behavior

## Verification
- `npm run lint && npm run test -w akvj && npm run build -w akvj`
- Test ms-based timing produces correct frame intervals
- Test beat sync works with ms values
- Test backward compatibility with FPS-based clips
- Verify 60fps performance is maintained

## Related
- Depends on task 253 (metadata normalization)
- Should be done after task 243 (sync epic ClipTiming rewrite)
- Depends on task 255 (conversion utilities)
