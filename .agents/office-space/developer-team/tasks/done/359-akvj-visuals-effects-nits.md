---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 359: visuals/effects magic-number leftovers

## Source

Nit sweep (partially done by task 355 — grayscale `128` already `MID_GRAY_LUMINANCE`).

## Remaining

- [x] `akvj/src/js/visuals/effects/strobeEffect.js`: `WHITE_PIXEL_VALUE = 255` → import/use `MAX_COLOR_VALUE` from `akvj/src/js/visuals/effects/effectConstants.js`
- [x] `akvj/src/js/visuals/effects/EffectsPipeline.js`: `DEFAULT_BPM_MIN` / `DEFAULT_BPM` → rename to `FALLBACK_BPM…` (or import from settings) so intent is clear

## Verification

- `npm run lint -w akvj` / `npm run test -w akvj` pass
