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

# Task 294: Scaling Algorithm Choice — Nearest Neighbor vs Smooth

## Description

Add a scaling algorithm toggle for clip rendering, allowing users to choose between nearest-neighbor (crisp pixels) and smooth (bilinear) interpolation. Start with per-clip configuration in `meta.json` defaulting to `"nearest"` for backward compatibility.

## Details

**Nearest neighbor (pixelated):**
- Sharp pixel edges, no blurring.
- Great for pixel art, low-res sprites, retro aesthetic.
- Current default (canvas `imageSmoothingEnabled = false`).

**Smooth (bilinear/bicubic):**
- Anti-aliased, blended pixels.
- Better for photographic content, gradients, organic shapes.
- Canvas `imageSmoothingEnabled = true` + `imageSmoothingQuality = 'high'`.

## Implementation

- Add a `scaling` field to clip `meta.json` schema with values `"nearest" | "smooth"`, defaulting to `"nearest"`.
- Renderer checks `clip.scaling` (or clip metadata) before drawing each frame and sets `imageSmoothingEnabled` accordingly.
- Update `mainframe/src/js/editorMeta.js` and validation/schema to recognize `scaling`.
- Optional UI: add a dropdown in the clip editor to set `scaling`.

## Affected files

- `akvj/src/js/visuals/Clip.js` or renderer where frames are drawn.
- `akvj/src/js/visuals/clipDrawRect.js` or drawing utilities.
- `mainframe/src/js/editorMeta.js` (schema default).
- `mainframe/scripts/clips/lib/validate/meta.js` (schema validation).
- `mainframe/src/index.html` (clip editor UI if adding a control).
- Tests for both scaling modes.

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. `npm run build` passes.
4. Clips with `scaling: "nearest"` render with crisp pixels.
5. Clips with `scaling: "smooth"` render with smooth interpolation.
6. Missing `scaling` defaults to `"nearest"` (no visual change to existing clips).

## Notes

- Implementation option 2 from the feature request (per-clip meta field) is the suggested approach.
- Ensure the hot path does not allocate per frame and stays within 60fps budget.
