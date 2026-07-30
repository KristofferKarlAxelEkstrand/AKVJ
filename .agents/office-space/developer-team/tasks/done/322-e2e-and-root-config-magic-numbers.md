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

# Task 322: E2E + root config magic-number sweep

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-e2e-and-root-config-magic-numbers-sweep-2026-07-19.md`

## Description

Replace bare timeout values in `e2e/mainframe.spec.js` and `playwright.config.js` with named constants.

## Findings and actions

### 1. `e2e/mainframe.spec.js` repeats bare `15000` timeout values

**File:** `e2e/mainframe.spec.js` (lines 95, 168, 172)

**Current:**
```js
{ timeout: 15000 }
```
used in three test calls.

**Proposed:**
- Add `const E2E_TIMEOUT_MS = 15000;` near imports.
- Replace all three `{ timeout: 15000 }` with `{ timeout: E2E_TIMEOUT_MS }`.

### 2. `playwright.config.js` repeats bare `30000` webServer timeout

**File:** `playwright.config.js` (lines 34, 40)

**Current:**
```js
timeout: 30000
```
in both webServer entries.

**Proposed:**
- Add `const WEB_SERVER_TIMEOUT_MS = 30000;` near top after imports.
- Use `timeout: WEB_SERVER_TIMEOUT_MS` in both webServer objects.

## Affected files

- `e2e/mainframe.spec.js`
- `playwright.config.js`

## Verification

- `npm run lint` passes.
- `npm run build` passes.
- `npx playwright test` passes (or at least E2E configs load).

## Notes

- Magic-number/naming cleanup only; no runtime behavior changes.
