# [TASK] Review Task 230: BPM Sync Clock Pulse Rounds to Zero

## Task Reference
Original task: 230-akvj-bpm-sync-clock-pulse-rounds-to-zero.md

## Developer Report
Tasks 229 & 230 were completed together. See the report in `[TASK]-review-229-clip-construction-crash.md` for details on both fixes.

## Specific Fix for Task 230
**Issue**: BPM-synced clips with short `frameDurationBeats` values (< 1/24 beat) rounded to 0 pulses per frame, causing incorrect playback tempo.

**Fix Applied**:
- Modified `ClipTiming.#initBPMSync` to ensure minimum 1 pulse per frame:
  ```js
  this.#pulsesPerFrame = frameDurationBeats.map(beats => Math.max(1, Math.round(beats * settings.midi.ppqn)));
  ```
- Applied to both array and single-value code paths

**Tests Added**:
- `ClipTiming.test.js`: Added tests for very short frame durations to ensure pulsesPerFrame is never 0
- Tests for both single value and array frameDurationBeats

## Review Checklist
- [ ] Verify the fix correctly handles short frameDurationBeats values
- [ ] Check that minimum 1 pulse per frame is enforced
- [ ] Verify test coverage prevents regression
- [ ] Confirm no impact on normal BPM sync behavior
- [ ] Check code follows AKVJ conventions

## Files to Review
- `akvj/src/js/visuals/ClipTiming.js`
- `test/ClipTiming.test.js`
