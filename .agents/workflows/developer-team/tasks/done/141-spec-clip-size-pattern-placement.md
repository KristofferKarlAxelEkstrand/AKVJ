---
status: done
assignee: akvj-developer
priority: medium
---

# Task 141: Spec — Non-Default Clip Sizes, Pattern Fill Mode, Placement, Whole-Pixel Rule

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-clip-size-pattern-placement-whole-pixels.md`

## Nature of This Task
**Documentation/design first, per the user's explicit instruction** ("Prefer updating specs
+ open questions before locking every placement detail"). This task is: update the relevant
specs to stop implying clips always stretch to canvas, add the `pattern` mode and placement
concepts, and work out (documenting as open questions where genuinely undecided) how they
fit the existing schema and render path. **No implementation in this task** — that's slices
142 (akvj render path) and 143 (mainframe editor UI), both sequenced after this one and
filed once this lands.

## Firm Requirements (settled by the user — don't re-litigate)
1. **`pattern` is a new, real clip mode**: tiles/repeats a cell to fill the canvas, instead of
   stretching one cell to fill it.
2. **Placement is supported**, with **`0,0` = the center of the screen** (not top-left) as
   the origin convention.
3. **Whole-pixel rendering, no exceptions**: every resolved draw position/size in `akvj` must
   land on an integer pixel boundary (floor/snap) — keeps the pixelated/crisp look consistent
   with `imageSmoothingEnabled: false` (`Compositor.js:112`).
4. Non-default clip frame sizes must become a **real runtime capability**, not just an
   editor/spritesheet detail — see "Current Gap" below.

## Current Gap (why this matters — confirmed by reading the code)
- `akvj/src/js/visuals/Clip.js:158`: `ctx.drawImage(this.#image, ..., 0, 0, this.#canvasWidth,
  this.#canvasHeight)` — **every** clip's cell is stretched to fill the full 240×135 canvas
  regardless of the clip's own `frameWidth`/`frameHeight`. Non-default sizes exist in the
  schema/editor (`frameWidth`/`frameHeight`/`scaleMode` — Task 108, 116) but have zero effect
  at play time; scale mode only matters for the editor/spritesheet-generation path today.
- `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` currently documents
  non-default sizes as scaling back to 240×135 at play time — needs correcting.

## Open Questions to Settle in This Task (document the decision, not just the question)
- **Units for placement**: pixels, percent, or both? Whichever is chosen, resolved
  coordinates must floor to integers before reaching the draw call (requirement #3).
- **Meta/mapping field names**: what goes in `meta.json` (clip default) vs whether placement
  is placement-per-mapping-slot like Task 138's sync override, or clip-only. Check
  `mainframe/shared/clipSchema.js` for the existing constants pattern to extend.
- **Interaction with existing `scaleMode`** (`fit`/`fill`/`stretch`/`none` — check
  `mainframe/src/js/frameFit.js` for current modes): does `pattern` become a new `scaleMode`
  value, or a separate `role`/mode field alongside it? Recommend checking how `role: "bitmask"`
  is modeled (`clipSchema.js`) as a precedent for "special clip behavior via a mode field."
- **Interaction with Layer Groups A/B/C and the mask/mixer system** (`LayerManager.js`,
  `MaskManager.js`, `Compositor.js`) — does a `pattern` clip or placed clip composite the same
  way as today, or does non-full-canvas coverage change how mask blending or layer-group
  compositing behaves? Needs at least one worked-through example in the spec.
- **Whole-pixel snapping scope**: confirm this applies to the *existing* full-canvas draw
  path too (today's `0,0,canvasWidth,canvasHeight` is already whole-pixel by construction —
  the risk is in new placement/scaling math introducing fractional values), not just new code.

## Deliverables
- Updated `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` (correct the
  "always scales to 240×135" claim).
- Updated `.agents/workflows/developer-team/spec/feature-edit-clip.md` and/or
  `clip-schema.md` with the new `pattern` mode, placement fields, and whole-pixel rule as a
  documented engine-wide constraint.
- A clear settled answer (not left open) for each bullet above, written into the spec.
- Recommend slicing for 142 (akvj render path: pattern tiling, placement resolution,
  whole-pixel snap helper) and 143 (mainframe: editor UI for mode/placement fields) — refine
  the stub tasks already filed if the design changes their scope.

## Files
- `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md`
- `.agents/workflows/developer-team/spec/feature-edit-clip.md`
- `.agents/workflows/developer-team/spec/clip-schema.md`
- Reference (read, don't modify yet): `akvj/src/js/visuals/Clip.js`,
  `akvj/src/js/visuals/Compositor.js`, `akvj/src/js/visuals/LayerManager.js`,
  `mainframe/src/js/frameFit.js`, `mainframe/shared/clipSchema.js`
