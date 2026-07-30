---
status: done
assignee: akvj-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 433 — Visual tests: mirror/split/offset variant B

From: `[TEST]-akvj-visual-effect-variant-b.md` (test-marshal). Test-only — no product source.

`akvj/test/visual/canvas.test.js` covers grayscaleDisplacement/Blend for both variants and color invert+posterize. Mirror, split, and offset only have **variant A (horizontal)** screenshots. Unit tests already assert vertical pixel math; a wrong note-range wire would still pass unit + visual.

Tier: visual (`npm run test:visual` / `test:visual:update`). Extend `canvas.test.js`; new refs under `akvj/test/visual/__screenshots__/`.

Helper: `createAsymmetricPatternClip()` is L/R-biased — for vertical cases add a top/bottom asymmetric source (or extend the helper).

## Checklist

1. `mirrorEffect` variant B — note = `effectRanges.mirror.min + effectVariantThreshold`, velocity 127; screenshot `mirror-vertical`.
2. `splitEffect` variant B — same with `effectRanges.split`; screenshot `split-vertical`.
3. `offsetEffect` variant B — same with `effectRanges.offset`; screenshot `offset-vertical`.
4. Optional: standalone `strobe` white-out (today only in `stack-color-strobe`).

## Verify

`npm run test:visual` (and `test:visual:update` for new refs). `npm run lint && npm run test`.
