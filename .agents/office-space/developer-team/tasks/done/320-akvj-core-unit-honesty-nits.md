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

# Task 320: AKVJ core unit-honesty nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-akvj-core-unit-honesty-sweep-2026-07-19.md`

## Description

Apply three unit-honesty cleanups to `akvj/src/js/core/AppState.js`.

## Findings and actions

### 1. `#processClockPulse` `interval` is missing the `Ms` unit suffix

**File:** `akvj/src/js/core/AppState.js` (line 333)

- Already uses `const intervalMs = timestamp - this.#lastClockTimestamp;`.
- No source changes required.

### 2. `#calculateBPMFromClock` sums and averages are missing `Ms` suffix

**File:** `akvj/src/js/core/AppState.js` (lines 349–353)

- Already uses:
  ```js
  let totalMs = 0;
  for (const intervalMs of this.#recentPulseIntervals) {
      totalMs += intervalMs;
  }
  const avgIntervalMs = totalMs / this.#recentPulseIntervals.length;
  ```
- No source changes required.

### 3. `#shouldProcessClockPulse` uses a bare `1000` for the rate-limit window

**File:** `akvj/src/js/core/AppState.js` (lines 5 and 285)

- `const MS_PER_SECOND = 1000;` is already defined at the top of the module.
- `#shouldProcessClockPulse` already uses `const windowSizeMs = MS_PER_SECOND;`.
- No source changes required.

## Affected files

- `akvj/src/js/core/AppState.js` (verified, no edits needed)

## Verification

- `npm run lint -w akvj` — passed
- `npm run test -w akvj` — passed (535 tests passed)
- `npm run build -w akvj` — passed

## Notes

- Naming/magic-number cleanup already applied; this task was a verification pass.
