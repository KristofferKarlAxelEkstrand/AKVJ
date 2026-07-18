# Team Update: Clip size, pattern fill, placement, whole pixels

## Summary
We need to **update the specs** (and then implement) so clips are not locked to the AKVJ window size. Non-default frame sizes should become a real live capability, not only an editor/spritesheet detail. Also add a new clip mode **`pattern`** that tiles to fill the screen, plus optional **placement**, with a hard rule: **no sub-pixel rendering** — always whole pixels so output stays crisp.

## Impact
- Specs: especially `clip-upload-edit-feature.md` (today notes non-default sizes still scale to 240×135 at play time), `feature-edit-clip.md`, clip metadata / role docs, and any rendering / compositor notes.
- Runtime: `akvj` draw path (`Clip.js`, compositor/renderer) currently stretches every cell to canvas size.
- Meta / mapping: likely new fields for role/mode, placement, and how pattern vs placed clips behave.

## Action Needed

### 1. Spec updates (do this first)
Document and explore what we can support when clip frame size ≠ window (240×135):

- Clips **can be other sizes** than the output window.
- Capture open questions / exact behavior as we learn it, but **update the specs now** so they no longer imply “always scale to canvas.”

### 2. New clip mode: `pattern`
- A clip can be **`pattern`**: it **fills the screen** by tiling (repeat) rather than stretching one cell to the full canvas.
- This is a **new, needed** capability — add it into specs (meta role/mode, editor, playback behavior) and plan implementation from there.

### 3. Placement
- Support setting **where** a clip lands on the canvas (placement).
- **Origin convention:** `0×0` is the **center of the screen** (not top-left).
- Units: decide **pixels** and/or **percent** in the spec; either way, **floor** resolved coordinates so the clip always paints on whole-pixel boundaries.
- Goal: pristine placement, no blurry/sub-pixel edges.

### 4. Whole-pixel rendering (AKVJ-wide rule)
- Avoid **sub-pixel rendering** in `akvj`.
- All draw positions/sizes should resolve to **integer pixels** (floor / snap as specified).
- Keep pixelated, crisp compositing consistent with `imageSmoothingEnabled: false`.

## Notes
- Editor already allows custom `frameWidth` / `frameHeight` and `scaleMode`; live engine still draws into full canvas (`Clip.js` → `drawImage` … `0, 0, canvasWidth, canvasHeight`).
- Default canvas remains 240×135; other clip sizes and pattern/placement build on top of that output size.
- Prefer updating specs + open questions before locking every placement detail — but **`pattern` fill** and **whole-pixel rule** are firm requirements from this message.
