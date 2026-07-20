---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 318: Mainframe shared helpers unit-honesty sweep

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-shared-unit-honesty-sweep-2026-07-19.md`

## Description

Apply two unit-honesty cleanups to `mainframe/shared/frameTiming.js`.

## Findings and actions

### 1. Bare `1000` for milliseconds-per-second conversion

**File:** `mainframe/shared/frameTiming.js`

- Added `const MS_PER_SECOND = 1000;` near the top of the module.
- Replaced all four bare `1000` uses with `MS_PER_SECOND` in `msToFps` and `fpsToMs`.

### 2. Stale JSDoc default for `fallbackFps`

**File:** `mainframe/shared/frameTiming.js`

- Updated `@param {number} [fallbackFps=DEFAULT_FALLBACK_FPS]` in `msToFps` and `durationsMsToFrameRates` JSDoc.

## Affected files

- `mainframe/shared/frameTiming.js`

## Verification

- `npm run lint -w mainframe` — passed
- `npm run test -w mainframe` — passed
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed
  - UI heavy suite: 137 tests passed
- `npm run build -w mainframe` — passed

## Notes

- Unit-honesty/naming cleanup only; no runtime behavior changes.
