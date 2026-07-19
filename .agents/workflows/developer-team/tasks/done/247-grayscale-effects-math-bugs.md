---
status: done
assignee: akvj-developer
priority: high
---

# Task 247: Task 82 Grayscale Effects — Two Math Bugs Not Caught By QA

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-grayscale-effects-math-bugs-task-82.md`

## Affected Files
- `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`
- `akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js`
- Their tests (new dedicated test files — none currently exist for either effect's pixel
  math, only activation coverage in `EffectsManager.test.js`)

## Description
Task 82 (grayscale-driven displacement/fade effects) was QA-approved on
architecture/integration/test-count grounds, but no test asserts actual pixel output
values, so two real math bugs shipped uncaught.

### Bug 1: `createInvertedVersion` blends to white instead of inverting (`grayscaleBlendEffect.js:61-69`)
```js
modified[i] = pixels[i] + (MAX_COLOR_VALUE - pixels[i]) * intensity;
```
This simplifies to `pixels[i] * (1 - intensity) + 255 * intensity` — a lerp from the
original color toward flat white (255), not toward the per-pixel inverted color
(`255 - pixels[i]`).

**Concrete example**: pixel = 200, intensity = 1.0 (max velocity).
- Current code: `200 + (255-200)*1 = 255`
- Actual inversion should give: `255 - 200 = 55`

At full velocity, "Variant A" (doc comment: "Blend with inverted colors (lo-fi
posterize-like effect)") washes the whole frame toward white instead of
posterizing/inverting. Only near-black pixels coincidentally land close to correct; every
other pixel is wrong, and the error grows with pixel brightness and velocity/intensity.
This is the effect's headline behavior — very visible in practice, not an edge case.

**Likely fix**: `modified[i] = pixels[i] + ((MAX_COLOR_VALUE - pixels[i]) - pixels[i]) * intensity`
(lerp from original toward the actual inverted value), equivalently
`pixels[i] * (1 - 2 * intensity) + MAX_COLOR_VALUE * intensity`.

### Bug 2: `grayscaleDisplacementMaxShift` (velocity intensity) is mostly dead (`grayscaleDisplacementEffect.js:68-72`)
```js
const displacement = luminance > 128
    ? Math.floor((luminance - 128) / 32)
    : -Math.floor((128 - luminance) / 32);
const shiftAmount = Math.max(-maxShift, Math.min(maxShift, displacement));
```
`displacement` is quantized by a **fixed** divisor of 32, independent of
`maxShift`/velocity — its natural range is only [-4, 3] pixels (luminance 0-255).
`maxShift` (up to 16, per `settings.js effectParams.grayscaleDisplacementMaxShift`) only
clamps down; it can never push displacement past ~4px. For any velocity where
`intensity * 16 >= 4` (roughly velocity ≥ 32/127, ~25%), harder hits produce an identical
result — the doc comment ("Intensity controlled by MIDI velocity") only holds for the
bottom quarter of the velocity range. Above that, `grayscaleDisplacementMaxShift: 16` is
effectively unused.

**Likely fix**: scale the quantization step by `maxShift` instead of a fixed `32`, e.g.
`Math.floor(((luminance - 128) / 128) * maxShift)`, so intensity actually drives the
visible displacement range up to the configured max.

### Why QA missed both
`EffectsManager.test.js`'s only new coverage checks that the effects *activate*, not
their pixel math. No dedicated `grayscaleBlendEffect.test.js` /
`grayscaleDisplacementEffect.test.js` exists (unlike `Renderer.strobe.test.js` for the
strobe effect).

## Discrete Actions
1. Fix `createInvertedVersion` in `grayscaleBlendEffect.js` to lerp toward the actual
   per-pixel inverted value, not flat white.
2. Fix the displacement quantization in `grayscaleDisplacementEffect.js` to scale by
   `maxShift` instead of a fixed divisor of 32, so velocity actually drives displacement
   up to the configured max.
3. Add dedicated test files for both effects with real pixel-value assertions (small
   synthetic `ImageData`, known luminance/color → known output), at at least two
   velocity/intensity levels each.

## Verification
- New tests assert exact pixel output for both effects (not just "effect activates").
- Run `npm run lint && npm run test -w akvj && npm run build -w akvj`.

## Related
- Follow-up on Task 82 (`tasks/done/82-grayscale-displacement-fade-effects.md`) — this is
  a bug fix on top, not a reopen of that task.
