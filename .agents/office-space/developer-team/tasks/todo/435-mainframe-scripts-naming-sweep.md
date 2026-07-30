---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/scripts/clips/
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 435 — mainframe/scripts clips pipeline naming

From: `[NIT]-mainframe-scripts-naming-sweep-2026-07-20h.md` (nitpicker).
Rename + doc fix; item 4 changes `optimized` return honesty (human review). Related behaviour bug `--no-optimize` is task **434** — do not fold it in here.

## Checklist

1. `spritesheet.js:12,141` — usage text says frames-per-row default **8**; code uses `DEFAULT_FRAMES_PER_ROW` (=16). Align docs with the constant.
2. `validate/index.js:13` (+ `optimize.js:177,222`) — `ValidationResult.dir` → `clipDir`.
3. `validate/index.js:103-110` — `validateClipId` return `{ errors: {clipId, errors} }` → `{ error: {clipId, errors} }`.
4. `optimize.js:114` — when `sharp` is null, return still sets `optimized: true` after plain copy → `optimized: false` (or rename flag to `writtenToCache`).
5. `spritesheet.js:125` — bare `'loop'` → `DEFAULT_PLAYBACK` from `clipSchema.js`.
6. `spritesheet.js:78-79` — filter/sort `f`/`a`/`b` → `filename`/`left`/`right`.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.
