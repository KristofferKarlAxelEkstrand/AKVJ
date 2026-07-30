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

# Task 265: Fix ClipTiming error message prefix

## Description

The error messages logged by `ClipTiming.#initFrameRates` currently use a `"Clip:"` prefix, which is misleading because the source class is `ClipTiming`, not `Clip`. Update the four `console.warn` calls in `akvj/src/js/visuals/ClipTiming.js` to use a `"ClipTiming:"` prefix instead.

## Affected file

- `akvj/src/js/visuals/ClipTiming.js`

## Affected lines

| Line | Current message prefix | Proposed prefix |
| ---- | ---------------------- | --------------- |
| 242  | `Clip:`                | `ClipTiming:`   |
| 250  | `Clip:`                | `ClipTiming:`   |
| 260  | `Clip:`                | `ClipTiming:`   |
| 266  | `Clip:`                | `ClipTiming:`   |

## Acceptance criteria

- All four warning strings identify their source as `ClipTiming:`.
- No other behavior changes.
- Unit tests (if any) continue to pass.
