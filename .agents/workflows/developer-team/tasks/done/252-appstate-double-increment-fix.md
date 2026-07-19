---
status: done
assignee: akvj-developer
priority: high
---

# Task 252: Fix AppState.js double-increment bug in MIDI clock rate limiting

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-appstate-double-increment-rate-limit.md`

## Affected Files
- `akvj/src/js/core/AppState.js`
- Its test file (add/update tests for rate-limiting behavior)

## Description
The MIDI clock rate-limiting code in `AppState.js` has a double-increment bug introduced by Devin-side Task 227 "security hardening", never reviewed through this team's QA pipeline.

### Bug Details
- `#checkClockRateLimit` (line 302) increments `#clockPulseCount`
- `#processClockPulse` (line 335) also increments `#clockPulseCount`
- `dispatchMIDIClock` (lines 266-271) calls both methods sequentially on every clock pulse

This causes the pulse counter to increment twice per valid pulse, making the effective rate limit roughly half of the configured `maxClockPulsesPerSecond` value.

### Additional Issue
The two methods have duplicate window-reset logic with slightly different conditions:
- `#checkClockRateLimit`: `timestamp - this.#clockPulseWindowStart > windowSizeMs` (line 291)
- `#processClockPulse`: `this.#clockPulseWindowStart === 0 || now - this.#clockPulseWindowStart > pulseWindowMs` (line 329)

This creates maintenance risk if only one condition is edited later.

## Discrete Actions
1. Consolidate the rate-limiting logic into a single method that:
   - Checks and resets the time window
   - Checks the rate limit
   - Increments the counter exactly once
   - Returns whether the pulse should be processed
2. Update `dispatchMIDIClock` to call the consolidated method instead of both `#checkClockRateLimit` and `#processClockPulse`
3. Add/update tests to verify the pulse counter increments exactly once per valid clock pulse
4. Add/update tests to verify the rate limit matches the configured `maxClockPulsesPerSecond`

## Verification
- Tests verify single-increment semantics
- Tests verify rate limit accuracy
- Run `npm run lint && npm run test -w akvj && npm run build -w akvj`

## Related
- Bug introduced by Devin-side Task 227 "security hardening"
- Originally flagged by Nitpicker in `[NIT]-appstate-comment-cull-2026-07-19.md`
