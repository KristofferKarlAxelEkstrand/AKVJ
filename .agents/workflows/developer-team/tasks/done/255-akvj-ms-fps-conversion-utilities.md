---
status: done
assignee: akvj-developer
priority: medium
---

# Task 255: Implement ms ↔ FPS Conversion Utilities in AKVJ

## Epic
`.agents/workflows/developer-team/epics/done/timing-alignment-analysis.md` — Phase 3 (COMPLETED)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-timing-alignment-tasks.md`

## Affected Files
- `akvj/src/js/visuals/` (new module or existing utility file)

## Description
Implement conversion utilities for ms ↔ FPS to support backward compatibility with `frameRatesForFrames` while transitioning to `frameDurationsMs`. Mirror mainframe's `frameTiming.js` functionality without sharing imports.

### Requirements
- Implement `msToFps(durationMs)` utility
- Implement `fpsToMs(fps)` utility
- Implement `durationsMsToFrameRates(frameDurationsMs)` utility
- Implement `frameRatesToDurationsMs(frameRatesForFrames)` utility
- Mirror mainframe's functionality (no shared imports per architecture rules)
- Use for backward compatibility with `frameRatesForFrames`

## Discrete Actions
1. Create new utility module (e.g., `akvj/src/js/visuals/timingConversion.js`)
2. Implement conversion functions with clear documentation
3. Add comprehensive tests for all conversion functions
4. Ensure edge cases are handled (zero, negative, very large values)

## Verification
- `npm run lint && npm run test -w akvj && npm run build -w akvj`
- Test all conversion functions with various inputs
- Test round-trip conversions (ms → FPS → ms)
- Verify mainframe compatibility (same results for equivalent inputs)

## Related
- Can be done in parallel with other tasks
- Used by task 253 (metadata normalization)
- Used by task 254 (timing engine)
