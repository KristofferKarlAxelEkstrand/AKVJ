---
status: done
assignee: none
priority: medium
---

# Task 192: Test Coverage for Per-Image Scale/Placement Compositing (ClipFrame.js, StagingPreview.js)

## Source
`.agents/workflows/developer-team/inbox/read/[TEST]-clipframe-stagingpreview-composition-coverage.md` (Test Marshal)

Feature landed from `inbox/read/request-per-image-scale-and-placement.md` and `inbox/read/request-set-scale-for-all.md`.

## Problem
Two files gained substantial new compositing logic with no meaningful test coverage:

### 1. `mainframe/src/js/ClipFrame.js` — zero coverage of new composition controls
No `ClipFrame.test.js` exists. New surface, never exercised by any test:
- `#scaleSelect`, `#customWidthInput`, `#customHeightInput`, `#placementXInput`, `#placementYInput` — five new form controls wired to `#emitCompositionChange()`.
- `#syncCompositionControls()` — pushes `#composition` state into the DOM controls (called from `connectedCallback` and after re-render).
- `#readCompositionFromDom()` — parses controls back into a composition object.
- `#emitCompositionChange()` — dispatches `compositionchange` with `{ detail: { frameIndex, composition } }`.

**Add** `ClipFrame.test.js` (or extend `ClipFrames.test.js` if per-frame instances are easier to reach through the parent) covering: initial render reflects a given composition via `#syncCompositionControls`; changing each of the five controls fires `compositionchange` with correct `frameIndex`/`composition` fields; switching scale mode away from `custom` hides/ignores the custom width/height inputs (verify intended behavior against source first); round-trip (`#readCompositionFromDom` after `#syncCompositionControls`) doesn't lose data.

### 2. `mainframe/src/js/StagingPreview.js` — bake/placement/tiling draw path only dimension-tested
Gained `#drawBakedCell`, `#drawPatternFromCell`, `#ensureTileCanvas`, `#previewBufferSize`, and new `placement`/`bakeConfigs` params on `loadFrames(...)`. The only new test (`mainframe/test/StagingPreview.test.js`, `'pattern mode previews on the 240×135 output canvas'`) calls `loadFrames([], 16, 16, 12, 'loop', 'pattern')` with no `placement`/`bakeConfigs` and only asserts canvas width/height — never asserts drawn pixel content, so it can't catch a broken tile offset, an ignored bake config, or a silent no-op draw.

Same "dimension/no-throw masquerading as coverage" pattern previously resolved in the glitch-scratch-buffer and transform-copy vacuous-test tickets (both fixed by asserting actual pixel data).

**Add** tests that call `loadFrames(...)` with non-trivial `placement: {x, y}` and non-default `bakeConfigs`, then read back pixel data (`getImageData` on the preview canvas) to confirm: placement offsets actually shift the drawn frame; per-frame bake configs are honored (not just the first/global one); `#ensureTileCanvas` sizes correctly for tile dimensions both smaller and larger than the output canvas.

## Sequencing
Prefer landing **Task 193** (composition → bakeConfig rename) first. If 193 is already done when
you pick this up, write tests against `bakeConfig` / `bakeconfigchange` / `getBakeConfigs()` etc.
If you must start before 193, use whatever public names exist in source at the time — do not invent
aliases.

## Priority
Medium — new feature code, not yet shipped to users, but landing without tests for exactly the compositing math and pixel placement most prone to off-by-one and silent-no-op bugs.
