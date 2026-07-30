---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 142: akvj Render Path — Pattern Tiling, Placement, Whole-Pixel Snapping

## Depends On
Task 141 (spec) — **done**. Settled design below is final; spec docs already updated in
`clip-upload-edit-feature.md` §7/§10/§11, `clip-schema.md` §3, `feature-edit-clip.md`.

## Settled Design (from Task 141's report — implement exactly this, don't re-litigate)
1. **Placement units**: pixels (integers), no percent. `meta.json` field: `"placement": {
   "x": 0, "y": 0 }`, default `{ x: 0, y: 0 }` (centered) when absent.
2. **`pattern` is a new `scaleMode` value** (not a separate field) — joins
   `fit`/`cover`/`stretch`/`none` in the existing enum (`mainframe/shared/frameFit.js` +
   `mainframe/shared/clipSchema.js` + `akvj/src/js/visuals/clipMetadata.js`). Default
   `scaleMode` stays `'fit'` (unchanged) — non-canvas frame sizes fit/letterbox by default,
   not stretch; `stretch` is available for authors who want the old always-fill look.
3. **Resolution formula** (center-origin → top-left, whole-pixel):
   `drawX = floor((canvasWidth - frameWidth) / 2 + placement.x)`,
   `drawY = floor((canvasHeight - frameHeight) / 2 + placement.y)`.
4. **`scaleMode` × placement interactions**:
   - `fit` / `cover` / `none`: placement offsets the scaled/centered result.
   - `stretch`: placement ignored (clip fills the whole canvas — nowhere to place it).
   - `pattern`: placement shifts the tile grid origin.
5. **Compositing**: pattern/placed clips composite exactly like today — they draw onto their
   layer-group's 240×135 offscreen canvas; tiling just fills that canvas differently. Mask
   blending and layer-group compositing (`Compositor.js`, `LayerManager.js`) are unchanged.
6. **Whole-pixel rule is engine-wide**: centralize via a `snapToPixel(value)` helper (or
   equivalent), not scattered `Math.floor()` calls. Today's `0,0,240,135` full-canvas path is
   already whole-pixel by construction — the risk is only in new placement/scaling math.
7. **Legacy clips** (no `frameWidth`/`frameHeight`/`scaleMode`/`placement`) stay valid —
   `normalizeClipMetadata` applies the same defaults as always. No migration.

## Required Changes
- `akvj/src/js/visuals/Clip.js#drawToContext()` (currently `Clip.js:158` —
  `drawImage(..., 0, 0, this.#canvasWidth, this.#canvasHeight)`, always stretching): use
  `frameWidth`/`frameHeight` for draw size instead, resolve placement per the formula above,
  and implement `pattern` tiling (`createPattern()` or a manual repeat loop).
- `akvj/src/js/visuals/clipMetadata.js`: add `placement` (default `{x:0,y:0}`) and `pattern`
  (as a `scaleMode` value) to `normalizeClipMetadata`.
- Add `snapToPixel()` (or equivalent) as the single whole-pixel-snap chokepoint.

## Suggested Tests
- Pattern tiling fills canvas correctly for a sub-canvas frame size.
- Placement offsets resolve correctly for each `scaleMode` (including `stretch` ignoring it).
- Whole-pixel snapping: fractional placement/scale inputs never produce non-integer draw
  coordinates.
- Legacy clip (no new fields) renders identically to before (backward compat).

## Files
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/clipMetadata.js`
- `akvj/src/js/visuals/Compositor.js` (verify no change needed — should be a no-op check)
- `mainframe/shared/frameFit.js` / `mainframe/shared/clipSchema.js` (add `pattern` to
  `SCALE_MODES`/equivalent enum — coordinate naming with whatever Task 143 also touches)
