---
status: done
assignee: akvj-developer
priority: medium
---

# Task 323: AKVJ test trustworthiness flake hunt

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/read/[TEST]-flake-akvj-test-trustworthiness.md`

## Description

Fix low-trust, environment-conditional, and vacuous assertions in `akvj/test/`.

## Findings and actions

### 1. `ProjectCatalog.test.js` cache-busting test was environment-conditional

**File:** `akvj/test/ProjectCatalog.test.js`

- Replaced the single `if (import.meta.env.DEV) { ... } else { ... }` test with two explicit tests.
- Used `vi.stubEnv('DEV', true/false)` to control the environment deterministically.
- Added `vi.unstubAllEnvs()` to the `afterEach` cleanup.
- Each test now asserts the exact URL shape (`?t=...` vs. the raw `activeProjectUrl`) in a controlled environment.

### 2. `Clip.test.js` single-frame and shuffle reset tests used vacuous `not.toThrow()`

**File:** `akvj/test/Clip.test.js`

- `handles a single-frame clip` now asserts `ctx.drawImage` is called three times and `clip.currentFrame` remains `0` across renders.
- `resetting the clip clears the unplayed shuffle pool` now:
  - records the two frames drawn before reset,
  - calls `clip.reset()`,
  - performs the first post-reset render to initialize `ClipTiming`,
  - renders `frames` more times and asserts the resulting sequence contains every frame index exactly once.

## Affected files

- `akvj/test/ProjectCatalog.test.js`
- `akvj/test/Clip.test.js`

## Verification

- `npm run lint` (root) — passed
- `npm run lint -w akvj` — passed
- `npm run test -w akvj` — passed (536 tests passed)
- `npm run build -w akvj` — passed

## Notes

- Test-only changes; no source code behavior changed.
