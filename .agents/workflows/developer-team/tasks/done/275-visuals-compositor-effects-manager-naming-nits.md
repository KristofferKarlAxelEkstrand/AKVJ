---
status: done
assignee: akvj-developer
priority: medium
---

# Task 275: Visuals compositing/render pipeline naming and JSDoc nits

## Source

Nitpicker report: `.agents/workflows/developer-team/mail/in/read/[NIT]-visuals-compositor-effects-manager-naming-sweep-2026-07-19.md`

## Description

Non-behavioral cleanup in `akvj/src/js/visuals/` to fix naming consistency and JSDoc precision.

## Discrete actions

1. In `akvj/src/js/visuals/Compositor.js`:
   - Rename `BIT_DEPTH_MIXING.MAX_VALUE_8BIT` to `BIT_DEPTH_MIXING.MAX_LEVEL_8BIT`.
   - Update the alpha-channel offset in `#mix1Bit` to use `idx + RGBA_CHANNEL_COUNT - 1` instead of the magic `idx + 3`.
2. In `akvj/src/js/visuals/EffectsManager.js`:
   - Replace `/** @type {Object} */ #effectRanges` with a precise type definition:
     ```js
     /**
      * @typedef {{ min: number, max: number }} EffectRange
      * @type {Record<string, EffectRange>}
      */
     #effectRanges = settings.effectRanges;
     ```
     Use the correct effect-type key type from the codebase if one exists.
3. Update any consumers of `MAX_VALUE_8BIT` to `MAX_LEVEL_8BIT`.

## Affected files

- `akvj/src/js/visuals/Compositor.js`
- `akvj/src/js/visuals/EffectsManager.js`
- Any tests that reference the renamed constant or type.

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. `npm run build` passes.
4. No runtime behavior changes.

## Notes

- Do not refactor beyond the three named nits.
- Keep the pixel-pipeline hot paths unchanged aside from the alpha offset constant.
