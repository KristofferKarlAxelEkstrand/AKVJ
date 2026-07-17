# Task 50: Add EffectsPipeline destroy() Method

## Severity: Low (Resource cleanup)

## Location
`akvj/src/js/visuals/Renderer.js:121-136` — `destroy()` and `akvj/src/js/visuals/effects/EffectsPipeline.js`

## Problem
`Renderer.destroy()` nulls the `EffectsPipeline` reference but doesn't call a `destroy()` method (because none exists). Inconsistent with `Compositor`, `LayerManager`, `MaskManager` which all have `destroy()`.

## Fix
1. Add a `destroy()` method to `EffectsPipeline` that nulls the scratch buffer and effect context
2. Call `this.#effectsPipeline?.destroy()` in `Renderer.destroy()` before nulling

## Key Files
- `akvj/src/js/visuals/effects/EffectsPipeline.js`
- `akvj/src/js/visuals/Renderer.js`

## Dependencies
- None (discovered during Task 37a)
