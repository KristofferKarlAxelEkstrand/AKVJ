---
status: done
assignee: akvj-developer
priority: medium
---

# Task 253: Add `frameDurationsMs` to AKVJ Metadata Normalization

## Epic
`.agents/workflows/developer-team/epics/done/timing-alignment-analysis.md` — Phase 1 (COMPLETED)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-timing-alignment-tasks.md`

## Affected Files
- `akvj/src/js/visuals/clipMetadata.js`

## Description
Add support for `frameDurationsMs` (ms per frame) to AKVJ's metadata normalization to align with mainframe's ms-based timing system. This enables direct ms-per-frame control and simpler math across both systems.

### Requirements
- Add `frameDurationsMs` to normalized metadata structure
- Support both `frameRatesForFrames` (legacy FPS-based) and `frameDurationsMs` (new ms-based)
- Convert `frameDurationsMs` → FPS internally for backward compatibility with existing timing engine
- Ensure backward compatibility with clips that only have `frameRatesForFrames`

## Discrete Actions
1. Update `clipMetadata.js` normalization to accept and process `frameDurationsMs`
2. Add conversion logic: `frameDurationsMs` → `frameRatesForFrames` (FPS = 1000 / durationMs)
3. Ensure clips with only `frameRatesForFrames` continue to work unchanged
4. Add tests for ms-based metadata normalization

## Verification
- `npm run lint && npm run test -w akvj && npm run build -w akvj`
- Test that clips with `frameDurationsMs` normalize correctly
- Test backward compatibility with `frameRatesForFrames`-only clips

## Related
- Can be done in parallel with sync epic tasks 241-242
- Blocks task 254 (AKVJ timing engine ms support)
