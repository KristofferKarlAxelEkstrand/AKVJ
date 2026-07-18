# [TEST] Per-image scale/placement feature landed with two untested compositing surfaces

**From:** Test Marshal
**Area:** `mainframe/src/js/ClipFrame.js`, `mainframe/src/js/StagingPreview.js`
**Date:** 2026-07-18
**Tier:** unit (jsdom)

## Summary

The uncommitted per-image scale/placement work (matches `request-per-image-scale-and-placement.md`
/ `request-set-scale-for-all.md`, now in `inbox/read/`) touched two files with substantial new
compositing logic. Neither has been backed with tests that exercise the new behavior — one has zero
coverage of the new controls, the other has a dimension-only test that doesn't verify the pixels the
new code actually draws.

## 1. `ClipFrame.js` — per-frame composition controls have zero coverage

No `ClipFrame.test.js` exists. The custom element is only imported as a side effect in
`ClipFrames.test.js` and `ClipEditorController.test.js`, and neither of those touches the new
composition UI — grepping both test files for `scale|placement|composition` returns zero hits for
`ClipFrame.js`-specific behavior (`ClipEditorController.test.js`'s hits are all the unrelated
clip-level `#clip-editor-scale-mode` global control, not per-frame).

New/changed surface (per `@fires ClipFrame#compositionchange` doc comment and current source):

- `#scaleSelect`, `#customWidthInput`, `#customHeightInput`, `#placementXInput`, `#placementYInput`
  — five new form controls, each wired to `#emitCompositionChange()` on `change` (and `input` for
  the placement fields).
- `#syncCompositionControls()` — called from `connectedCallback` and again after re-render; pushes
  `#composition` state into the DOM controls. Never exercised.
- `#readCompositionFromDom()` — parses the controls back into a composition object. Never exercised.
- `#emitCompositionChange()` — dispatches `compositionchange` with
  `{ detail: { frameIndex, composition } }`. No test listens for this event or asserts its payload
  shape (scale mode, custom width/height, placement x/y) for any of the five triggering inputs.

**Ask:** add `ClipFrame.test.js` (or extend `ClipFrames.test.js` if per-frame instances are easier
to reach through the parent) covering: initial render reflects a given composition via
`#syncCompositionControls`; changing each of the five controls fires `compositionchange` with the
correct `frameIndex` and updated `composition` fields; switching scale mode away from `custom`
hides/ignores the custom width/height inputs (if that's the intended behavior — verify against
source); round-trip (`#readCompositionFromDom` after `#syncCompositionControls`) doesn't lose data.

## 2. `StagingPreview.js` — bake/placement/tiling draw path only dimension-tested

`StagingPreview.js` gained `#drawBakedCell`, `#drawPatternFromCell`, `#ensureTileCanvas`,
`#previewBufferSize`, and new `placement`/`bakeConfigs` parameters on `loadFrames(...)`. The only
new test (`mainframe/test/StagingPreview.test.js`, `'pattern mode previews on the 240×135 output
canvas'`) calls `loadFrames([], 16, 16, 12, 'loop', 'pattern')` — no `placement` or `bakeConfigs`
args — and asserts only `canvas.width`/`height`/`style.width`/`style.height`. It never asserts on
drawn pixel content, so it can't catch a broken tile offset, a bake config that's ignored, or
`#drawBakedCell`/`#drawPatternFromCell` silently drawing nothing.

This is the same "dimension/no-throw check masquerading as coverage" pattern flagged previously in
`[TEST]-flake-glitch-scratch-buffer-vacuous.md` and `[TEST]-flake-transform-copy-vacuous.md` (both
resolved by asserting actual pixel data) — worth applying the same fix here before it ships.

**Ask:** add tests that call `loadFrames(...)` with non-trivial `placement: {x, y}` and non-default
`bakeConfigs`, then read back pixel data from the rendered canvas (`getImageData` on the preview
canvas, same technique used in the resolved effects.test.js tickets) to confirm: placement offsets
actually shift the drawn frame; per-frame bake configs are honored (not just the first/global one);
`#ensureTileCanvas` sizes correctly for tile dimensions smaller and larger than the output canvas.

## Priority

Medium — new feature code, not yet shipped to users, but landing without tests for exactly the
logic (compositing math, pixel placement) most prone to off-by-one and silent-no-op bugs.
