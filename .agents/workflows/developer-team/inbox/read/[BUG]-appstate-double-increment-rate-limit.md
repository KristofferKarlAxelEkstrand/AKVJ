# [BUG] AppState.js double-increment bug in MIDI clock rate limiting

**Priority**: High
**Component**: `akvj/src/js/core/AppState.js`
**Discovered by**: Nitpicker (flagged by Team Lead)
**Context**: Introduced by Devin-side Task 227 "security hardening", never reviewed through this team's QA pipeline

## Bug Description

The MIDI clock rate-limiting code in `AppState.js` has a double-increment bug:

- `#checkClockRateLimit` (line 302) increments `#clockPulseCount`
- `#processClockPulse` (line 335) also increments `#clockPulseCount`
- `dispatchMIDIClock` (lines 266-271) calls both methods sequentially on every clock pulse

This causes the pulse counter to increment twice per valid pulse, making the effective rate limit roughly half of the configured `maxClockPulsesPerSecond` value.

## Code Location

`akvj/src/js/core/AppState.js`:
- Lines 265-273: `dispatchMIDIClock` calls both methods
- Lines 280-304: `#checkClockRateLimit` increments at line 302
- Lines 323-340: `#processClockPulse` increments at line 335

## Additional Issue

The two methods have duplicate window-reset logic with slightly different conditions:
- `#checkClockRateLimit`: `timestamp - this.#clockPulseWindowStart > windowSizeMs` (line 291)
- `#processClockPulse`: `this.#clockPulseWindowStart === 0 || now - this.#clockPulseWindowStart > pulseWindowMs` (line 329)

This creates maintenance risk if only one condition is edited later.

## Expected Behavior

The pulse counter should increment exactly once per valid clock pulse, and the rate limit should match the configured `maxClockPulsesPerSecond`.

## Suggested Fix

Consolidate the rate-limiting logic into a single method that:
1. Checks and resets the time window
2. Checks the rate limit
3. Increments the counter exactly once
4. Returns whether the pulse should be processed

This eliminates duplication and ensures single-increment semantics.
