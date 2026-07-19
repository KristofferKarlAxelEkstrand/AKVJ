# [BUG] Task 82 Grayscale Effects: Two Math Bugs Not Caught By QA

QA approved Task 82 (`inbox/read/qa-audit-report-task-82-grayscale-effects.md`) on architecture/
integration/test-count grounds, but no test asserts actual pixel output values for either new
effect, so two real math bugs shipped uncaught. Found via direct code trace + hand-computed
numeric example (not just eyeballed), in the currently **uncommitted, staged** working tree
(`akvj/src/js/visuals/effects/grayscaleBlendEffect.js`,
`akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js`).

## Bug 1: `createInvertedVersion` doesn't invert — it blends to white (grayscaleBlendEffect.js:61-69)

```js
modified[i] = pixels[i] + (MAX_COLOR_VALUE - pixels[i]) * intensity;
```

This simplifies to `pixels[i] * (1 - intensity) + 255 * intensity` — a lerp from the original
color toward **flat white (255)**, not toward the per-pixel **inverted** color (`255 - pixels[i]`).

**Concrete example**: pixel = 200, intensity = 1.0 (max velocity).
- Current code: `200 + (255-200)*1 = 255`
- Actual inversion should give: `255 - 200 = 55`

At full velocity, "Variant A" (doc comment: *"Blend with inverted colors (lo-fi posterize-like
effect)"*) doesn't posterize/invert anything — it washes the whole frame toward white. Only
pixels that start near-black (0) happen to land close to the correct inverted value by
coincidence; every other pixel is wrong, and the error grows with both pixel brightness and
velocity/intensity. This is the effect's headline "Variant A" behavior, so it's very visible in
practice, not an edge case.

**Likely fix**: `modified[i] = pixels[i] + ((MAX_COLOR_VALUE - pixels[i]) - pixels[i]) * intensity`
(lerp from original toward the actual inverted value), or equivalently
`pixels[i] * (1 - 2 * intensity) + MAX_COLOR_VALUE * intensity`.

## Bug 2: `grayscaleDisplacementMaxShift` (velocity intensity) is mostly dead (grayscaleDisplacementEffect.js:68-72)

```js
const displacement = luminance > 128
    ? Math.floor((luminance - 128) / 32)
    : -Math.floor((128 - luminance) / 32);
const shiftAmount = Math.max(-maxShift, Math.min(maxShift, displacement));
```

`displacement` is quantized by a **fixed** divisor of 32, independent of `maxShift`/velocity —
its natural range is only **[-4, 3]** pixels (luminance 0-255). `maxShift` (up to 16, per
`settings.js effectParams.grayscaleDisplacementMaxShift`) only ever *clamps down*; it can never
push displacement past ~4px. So for any velocity where `intensity * 16 >= 4` (roughly
velocity ≥ 32/127, ~25%), harder hits produce an **identical** result — the effect's own doc
comment ("Intensity controlled by MIDI velocity") only actually holds for the bottom quarter of
the velocity range. Above that, `grayscaleDisplacementMaxShift: 16` is effectively unused —
the setting implies up to 16px of displacement is reachable, but it never is.

**Likely fix**: scale the quantization step by `maxShift` instead of a fixed `32`, e.g.
`Math.floor(((luminance - 128) / 128) * maxShift)`, so intensity actually drives the visible
displacement range up to the configured max.

## Why QA missed both

`EffectsManager.test.js`'s only new coverage
(`grayscale displacement and blend effects activate on notes 96-127`) checks that the effects
*activate*, not their pixel math. No dedicated `grayscaleBlendEffect.test.js` /
`grayscaleDisplacementEffect.test.js` exists (unlike `Renderer.strobe.test.js` for the strobe
effect). QA's own audit report explicitly checked "Test Coverage: All 461 tests passing" as a
proxy for correctness — reasonable given their scope (assigned-task review, not open-ended math
verification), but this is exactly the kind of free-form bug hunt that's mine, not theirs.

## Suggested fix scope

- Fix both formulas as above (or equivalent).
- Add real pixel-value assertions (small synthetic `ImageData`, known luminance → known output)
  for both effects, at at least two velocity/intensity levels each, so a future regression here
  is caught mechanically instead of only by manual trace.
