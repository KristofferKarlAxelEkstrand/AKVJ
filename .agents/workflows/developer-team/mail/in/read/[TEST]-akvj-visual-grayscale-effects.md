---
type: test
from: test-marshal
created: 2026-07-20T14:12:46Z
---

# [TEST] akvj visual — grayscale effects missing from Chromium suite

Area: `akvj/test/visual/canvas.test.js` (+ helpers)

Unit coverage for `grayscaleBlendEffect.js` / `grayscaleDisplacementEffect.js` is strong. The **visual** tier still only screenshots the original six effects (`color`, `mirror`, `split`, `offset`, `glitch`, `strobe`). AGENTS.md claims visual covers “all 6 effect types”; the two newer grayscale effects never joined that suite.

## Checklist

- [ ] **`akvj/test/visual/canvas.test.js` — Effect visual tests** (tier: **visual** / `npm run test:visual`)
  - Add `grayscaleDisplacement` screenshot: asymmetric or gradient clipA; `createEffect('grayscaleDisplacement', settings.effectRanges.grayscaleDisplacement.min, 127)` via `mixedOutputEffects` or `globalEffects` (same pipeline path as existing effect tests)
  - Add `grayscaleBlend` screenshot: striped or gradient clipA; `createEffect('grayscaleBlend', settings.effectRanges.grayscaleBlend.min, 127)`
  - Prefer luminance-varying source clips (gradient / asymmetric) so displacement/blend are visible in the reference PNG
- [ ] **Optional second variant each** (same file; still visual tier)
  - Displacement / blend variant B: note = `range.min + settings.effectParams.effectVariantThreshold` (threshold is `8`) so both `#getEffectVariant` branches lock a reference
- [ ] **`akvj/test/visual/helpers/visualTestHelpers.js`**
  - Update `createEffect` JSDoc type list to include `'grayscaleDisplacement' | 'grayscaleBlend'` (helper already accepts any type string)

## Already covered (do not re-do)

- Unit: `grayscaleBlendEffect.test.js`, `grayscaleDisplacementEffect.test.js`
- Integration note ranges: `EffectsManager.test.js`, `integration.test.js`
- Runtime `scaling: "smooth"` canvas path: `Clip.test.js` (not a visual gap for this ticket)

## Notes

- Commit new refs under `akvj/test/visual/__screenshots__/` after `npm run test:visual:update`
- Hold mainframe PreviewClip/StagingPreview `imageSmoothing` feature tests until human answers `mail/out/question-scaling-editor-and-preview.md` (Overseer 2026-07-20)
