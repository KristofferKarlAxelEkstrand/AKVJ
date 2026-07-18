# [TEST] ClipFrames + ClipEditorController bake-composition wiring untested

**From:** Test Marshal
**Area:** `mainframe/src/js/ClipFrames.js`, `mainframe/src/js/ClipEditorController.js`
**Date:** 2026-07-18
**Tier:** unit (jsdom)
**Related:** Task 192 (`[TEST]-clipframe-stagingpreview-composition-coverage.md`) covers per-frame
`ClipFrame` controls and `StagingPreview` pixel draw. This ticket is the **container + controller**
layer above that — do not close 192 by only fixing this, or vice versa.

## Summary

The per-image bake/scale feature added a full composition API on `ClipFrames` and global
bake-scale sync/apply paths on `ClipEditorController`. Existing tests still only cover the older
duration APIs (and mock away the new composition methods), so a broken `setAllCompositions` /
uniformity check / global “Set scale” button would not fail CI.

Mainframe suite is currently green (`535` passed) — these are missing cases, not a red suite.

## Checklist

### 1. `ClipFrames.js` — composition container API (zero coverage)

`ClipFrames.test.js` thoroughly covers `getDurations` / `setAllDurations` / `areDurationsUniform`
and duration persistence across reorder. The parallel composition surface has **no** tests:

| Method / path | Gap |
| --- | --- |
| `getCompositions()` | Never asserted; returns resolved bake configs with cloned `placement` |
| `setAllCompositions(composition)` | Never called; should resolve via `resolveFrameBakeConfig`, push into every `#frameEntries` entry + every child `clip-frame.setComposition`, and dispatch `compositionchange` with `{ all: true, composition }` |
| `areCompositionsUniform()` | Never called; should use `areFrameBakeConfigsUniform(getCompositions())` |
| Child `compositionchange` relay | `#render` writes `event.detail.composition` into `#frameEntries[i]` — no test edits a child control and checks `getCompositions()` |
| Composition across reorder | Duration has `'duration edits persist across reorder'`; compositions have no equivalent |

**Add** (extend `ClipFrames.test.js`):

- `loadFrames` with per-frame `composition` → `getCompositions()` matches resolved values (scaleMode / width / height / placement).
- `setAllCompositions({ scaleMode: 'cover', placement: { x: 2, y: -1 } })` → every child reflects it, event detail `{ all: true, … }`, `areCompositionsUniform() === true`.
- Edit one child’s scale/placement control → `areCompositionsUniform() === false` and `getCompositions()` shows the divergence.
- After a non-uniform edit, reorder frames → compositions follow the frames (same pattern as the duration reorder test).

### 2. `ClipEditorController.js` — global bake-scale sync/apply (mocked away)

`ClipEditorController.test.js` fixture DOM includes `#clip-frames-global-bake-scale`, custom
width/height, and `#clip-frames-set-all-bake-scale`, but the stubbed `clip-frames` element replaces
the real API:

```js
clipFrames.getCompositions = vi.fn(() => []);
clipFrames.areCompositionsUniform = vi.fn(() => true);
clipFrames.setAllCompositions = vi.fn();
```

No test clicks “Set scale” or asserts enable/disable of the global controls. Untested source:

- `applyGlobalBakeScaleToAllFrames()` — reads global select + custom size, calls
  `setAllCompositions`, refreshes `#stagedBakeConfigs`, marks `#framesDirty`, updates preview.
- `syncGlobalBakeScaleControl()` — empty → controls disabled; uniform → select enabled + values
  mirrored; mixed → select disabled + blanked; `#updateGlobalBakeCustomVisibility` for `custom`.

**Add** (prefer a real `<clip-frames>` in the fixture for these cases, or drive the controller
methods after staging files so mocks aren’t needed):

- Stage ≥2 frames → global bake select enabled; “Set scale” to `cover` →
  `getCompositions()` all `cover`, preview refresh path invoked.
- Make frames non-uniform (via child composition or by stubbing `areCompositionsUniform` false
  only if using a real element is too heavy) → global select disabled and blank; Apply still
  enabled when frames exist.
- `custom` mode shows global custom size fields; non-custom hides them.
- Empty / zero frames → select + apply disabled.

## Priority

Medium — same feature tranche as Task 192. Container/controller bugs would ship broken
“set scale for all” / mixed-state UI even if per-frame `ClipFrame` controls get tests.
