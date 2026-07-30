---
status: done
assignee: none
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# [TASK] 245 - AppState.js comment cleanup

From: Nitpicker ([NIT]-appstate-comment-cull-2026-07-19.md)

## Scope

Remove narrating comments from `akvj/src/js/core/AppState.js` that add no information beyond the code they sit on. Keep comments that explain *why* (security/perf rationale).

## Files to edit

`akvj/src/js/core/AppState.js`

## Comments to delete

- Line 282 — `// 1 second window` (on `const windowSizeMs = 1000;`)
- Line 284 — `// Initialize window on first pulse` (on `if (this.#clockPulseWindowStart === 0)`)
- Line 290 — `// Reset window if it has expired` (on the window-expiry `if`)
- Line 296 — `// Check if we've exceeded the rate limit` (on the rate-limit `if`)
- Line 326 — `// 1 second window` (duplicate)
- Line 330 — `// Start new time window` (on the branch)
- Line 334 — `// Increment counter in current window` (on `this.#clockPulseCount++;`)
- Line 337 — `// Rate limit exceeded - ignore this pulse` (on the `return;`)

## Comments to keep

- Line 261 (JSDoc) — "Rate limiting: Reject excessive clock pulses to prevent CPU exhaustion"
- Line 324 — "// Rate limiting: prevent CPU exhaustion from clock flooding"

## Verification

Run `npm run lint -w akvj` and `npm run test -w akvj` after changes.
