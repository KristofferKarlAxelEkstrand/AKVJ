---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 303: AKVJ core unit-honesty naming nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-akvj-core-unit-honesty-sweep-2026-07-19.md`

## Description

Apply unit-honesty and magic-constant cleanup to `akvj/src/js/core/AppState.js`.

## Findings

### 1. `#processClockPulse` `interval` is missing the `Ms` unit suffix
- **File**: `akvj/src/js/core/AppState.js` (line 331)
- **Current**: `const interval = timestamp - this.#lastClockTimestamp;`
- **Proposed**: `const intervalMs = timestamp - this.#lastClockTimestamp;`
- **Rationale**: `timestamp` comes from `performance.now()` and is in milliseconds, so `interval` is a millisecond duration. `intervalMs` matches the codebase convention (`durationsMs`, `frameDurationsMs`, `FALLBACK_MS`).

### 2. `#calculateBPMFromClock` sums and averages are missing `Ms` suffix
- **File**: `akvj/src/js/core/AppState.js` (lines 347–351)
- **Current**:
  ```js
  let total = 0;
  for (const interval of this.#recentPulseIntervals) {
      total += interval;
  }
  const avgInterval = total / this.#recentPulseIntervals.length;
  ```
- **Proposed**:
  ```js
  let totalMs = 0;
  for (const intervalMs of this.#recentPulseIntervals) {
      totalMs += intervalMs;
  }
  const avgIntervalMs = totalMs / this.#recentPulseIntervals.length;
  ```
- **Rationale**: `this.#recentPulseIntervals` stores millisecond intervals; `total` and `avgInterval` are therefore in milliseconds. Honest names reinforce that `msPerBeat = avgIntervalMs * ppqn` is a ms-to-ms multiplication and mirror unit naming used elsewhere.

### 3. `#shouldProcessClockPulse` uses a bare `1000` for the rate-limit window
- **File**: `akvj/src/js/core/AppState.js` (line 283)
- **Current**: `const windowSizeMs = 1000; // 1 second window`
- **Proposed**: Add `const MS_PER_SECOND = 1000;` near `MS_PER_MINUTE` import and use `const windowSizeMs = MS_PER_SECOND;`
- **Rationale**: `code-standards.md` asks for magic numbers to be extracted into named constants. `ClipTiming.js` and `timingConversion.js` already define the same constant locally, so this keeps the file consistent.

## Affected files

- `akvj/src/js/core/AppState.js`

## Verification

1. `npm run lint` passes.
2. `npm run test -w akvj` passes.
3. `npm run build -w akvj` passes.
4. No runtime behavior changes.

## Notes

- These are naming/semantics nits only; do not change behavior.
