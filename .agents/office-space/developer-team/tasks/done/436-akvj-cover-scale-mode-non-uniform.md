---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 436 — akvj `scaleMode: cover` crops wrong (non-uniform stretch)

From: `[BUG]-akvj-cover-scale-mode-non-uniform.md` (overseer).

`akvj/src/js/visuals/clipDrawRect.js` `computeDrawRect` cover branch uses
`sWidth = sourceWidth / scale` / `sHeight = sourceHeight / scale`.

Correct cover (uniform scale, center crop) is what `mainframe/shared/frameFit.js`
`computeFrameDrawRect` already does: `sWidth = targetWidth / scale`,
`sHeight = targetHeight / scale` with `scale = max(tw/sw, th/sh)`.

## Effect

For a 100×100 cell on 240×135, akvj samples ~42×42 and stretches it to 240×135
(aspect distortion). Mainframe samples 100×56.25. Same `scaleMode: "cover"` previews
differently in mainframe than it plays in akvj.

## Fix

- Align akvj cover math with `mainframe/shared/frameFit.js` (keep `snapToPixel`).
- Update `akvj/test/clipDrawRect.test.js` “cover” expectations (currently assert the wrong 41×41 crop).
- Do **not** cross-import — mirror the formula only (Bridge rule).

## Verify

`npm run lint && npm run test && npm run test:visual` (visual cover cases may need ref updates).
