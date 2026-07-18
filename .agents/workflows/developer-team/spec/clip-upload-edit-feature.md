# Feature: Clip Upload / Clip Editor

## Goal

One shared **clip editor** experience for **creating** a new clip and **editing** an existing one. Users can add/replace/reorder/remove frames (PNG, JPG, GIF), set frame size / scale / timing / metadata, preview on a checkered transparency backdrop, and save — whether they arrived via `/clip/new` or “Edit” on a library clip.

Today create (Upload tab) and edit (`<akvj-clip-editor>` metadata form) are separate; this feature unifies them.

This document is the **full product spec**. Delivery should be **broken into smaller tasks later** (Team Lead / tasking) — do not treat it as one monolithic PR.

## Suggested task slices (break up later)

Suggested order when splitting work (adjust as needed):

1. Unique id generation + stop deriving id from name; hand-edit before first save
2. Accept PNG/JPG/GIF stills; unsupported-file status; drop-zone/`accept` copy
3. Alpha-preserving decode/fit into spritesheet; relax same-size gate; Fit/center
4. Lone animated GIF expand + delay→timing; expand-before-preview
5. Checkered transparency backdrop (staging + thumbnails) + 2× pixelated staging preview
6. Unify create/edit UI (shared editor; add/remove/reorder frames on edit)
7. Persist scale mode; wire frame durations on create/save; edit load from raw/sprite

## Requirements

### 0. Unified create & edit

- **Same UI** for new clip and edit clip: drop zone, frame list (`<clip-frames>`), staging preview, frame size / scale mode, playback, timing, role, name / unique id.
- **New clip:** empty editor → add images → save creates clip + spritesheet + meta.
- **Edit clip:** load existing frames (from raw assets and/or sprite cells) + meta into that same editor → user can **add**, **remove**, **clear all**, reorder frames, change durations, change size/scale, edit meta → save updates the clip (recompile spritesheet + meta as needed). Meta-only save is OK when frames are unchanged **and** at least one frame remains.
- **Reject save with no assets:** create and edit must both refuse to save when there are **zero frames** (after clear-all or never adding images). Show a clear status error; do not write an empty clip or strip the last frame on disk.
- Shared rules below apply in both modes.

### 1. Unique clip id

- Every clip has a **unique id** (the folder name / mapping key — today’s `clipId`).
- **Auto-generate** on create (e.g. `crypto.randomUUID()` or any simple unique string). Humans should not have to invent one.
- **Editable by hand before first save only.** After the clip exists, id is **read-only** in v1 (rename/folder + key-map updates = later work).
- **Keep the format simple:** no fancy scheme. A plain unique string safe for paths (letters, numbers, hyphen, underscore; a normal UUID with hyphens is fine). Reject empties and duplicates.
- **Name** stays the human-readable label and must **not** overwrite the id. Stop auto-deriving id from name.
- Existing human-readable `clipId`s remain valid; **no migration** — only new clips get generated ids.

### 2. Multi-image upload (stills)

- The user can select **multiple** image files in one go (file picker and drag-and-drop), including when editing an existing clip (append by default; clear/replace is an explicit action).
- Supported still formats for v1:
  - **PNG** (`.png`, `image/png`)
  - **JPG / JPEG** (`.jpg` / `.jpeg`, `image/jpeg`)
  - **GIF** when not expanded as animation (see §3) — first frame only
- Each still becomes one frame of the clip (order preserved from selection / drop).
- Update drop-zone copy and `accept` beyond PNG-only.
- Keep acceptance checks centralized (MIME + extension) so new types are easy to add later.

### 3. Animated GIF import

- Detect animation with `sharp` metadata: `pages > 1` → animated; else static.
- **Expand animation only** when, after filtering, the accepted set is **exactly one GIF** and that GIF is animated. Prefer: expand if the drop/selection batch is a lone animated GIF; if the clip already has frames, append the expanded frames at the end.
- When expanded: extract every frame; map GIF frame delays into clip timing. **Units:** GIF `delay` and `<clip-frames>` duration inputs are **milliseconds**; `frameRatesForFrames` is **FPS**. Convert with the **shared ms↔FPS helper** in §9 (`fps ≈ 1000 / delayMs`, fallback when delay is missing or 0).
- If a GIF is uploaded with any other accepted image (including other GIFs): treat **each GIF as a still** — first frame only (`page: 0`).
- A lone static GIF is one still frame.

### 4. Acceptance decision table

Decide behavior from the **accepted file list after filtering** for that add/drop batch (ignored files do not count).

| Accepted input (batch) | Behavior |
| ---------------------- | -------- |
| N× PNG/JPG | N stills (append or stage) |
| 1× animated GIF alone | Expand all frames (+ delays when available) |
| 1× static GIF alone | 1 still |
| GIF(s) + any other accepted image | Each GIF = first frame only; stills as usual |
| 2+ GIFs, no stills | Each GIF = first frame only |

### 5. Alpha / transparency

- **Preserve alpha** end-to-end: decode → fit/center → spritesheet → stored `sprite.png`.
- Output remains PNG with an alpha channel. Transparent (or semi-transparent) pixels from sources must not be flattened onto an opaque background.
- PNG: full alpha preserved. GIF: preserve transparency (GIF is typically binary/index transparency). JPG: no alpha — treat as fully opaque.
- Spritesheet canvas stays transparent where no coverage (existing `channels: 4` + `alpha: 0` create path). Ensure resize/decode uses alpha-capable PNG output (e.g. `ensureAlpha()` where needed) so GIF/PNG transparency survives.

### 6. Preview background & display size

- Use a single **Photoshop-style light grey / white checkerboard** behind previews so transparency is obvious (works for near-black and near-white clips).
- **No backdrop chooser** — checker only; keep the UI simple.
- Apply the **same checkered backdrop** to:
  - the main staging preview canvas
  - frame thumbnails in `<clip-frames>`
- Preview-only chrome; must **not** bake into the saved spritesheet.
- **Display the staging preview at 2×** the clip frame size (e.g. default 240×135 → shown at 480×270) with `image-rendering: pixelated`. Internal canvas buffer stays at the true frame size; only on-screen CSS scale is doubled.
- Cap displayed width at **960px** (scale down further if `2 × frameWidth` would exceed that) so large custom frame sizes do not blow the layout. Frame thumbnails can stay smaller.

### 7. Clip frame size & centering

- Each clip has a **frame size** (width × height): size of every cell in the spritesheet / animation.
- **Default** is the AKVJ canvas: **240×135** (`akvj` `settings.canvas`). Other sizes are allowed as editor settings.
- **Live engine behavior (updated):** the VJ engine draws each clip cell at its native `frameWidth` × `frameHeight`, positioned and scaled according to the clip's `scaleMode` and `placement` fields (see §10 and §11 below). Non-default frame sizes are a **real runtime capability** — `scaleMode` defaults to `fit` (unchanged), so a clip with a non-canvas frame size fits/letterboxes by default instead of stretching. Authors who want the old always-stretch-to-canvas look can set `scaleMode: "stretch"` explicitly. A UI hint should say: "Frame size = clip cell size. Use `stretch` to fill the canvas, `pattern` to tile, or `fit`/`cover`/`none` with placement for positioned clips."
- All images in the clip are composited into that shared frame size before the spritesheet is built.
- If a source is **not** the frame size, place it **centered**:
  - Smaller → transparent padding
  - Larger + **None** → **centered crop** (explicit)
  - Larger + scale mode → scale then center as below
- Scale modes (**Fit** is the default for this feature):
  - **Fit** (default) — scale uniformly to fit inside; center; transparent letterbox
  - **Cover** — scale uniformly to cover; center crop
  - **Stretch** — scale to exact frame size (may change aspect)
  - **None** — no scale; center with pad and/or centered crop
  - **Pattern** — tile/repeat the cell to fill the canvas (see §10)
- Changing frame size or scale mode updates the live staging preview.
- Frame size + scale mode are create/recompile config. **Persist scale mode** (meta or alongside raw assets) so edit/recompile can reproduce the same fit.

### 8. Unsupported files

- Show a clear **status message** listing skipped files / types (do not fail silently).
- Valid accepted files still stage; only hard-fail if nothing usable remains for save.

### 9. Implementation notes

- **Unify UI:** one editor surface used by `/clip/new` and library edit; retire the split between Upload-only staging and metadata-only `<akvj-clip-editor>` (fold meta fields into the shared editor).
- **Unique id:** generate on create; validate uniqueness against existing `clips/`; do not derive from name; hand-edit before first save only.
- **Mixed source dimensions:** stop rejecting mismatched source sizes; fit each source into the clip frame (centered per §7).
- **Frame timing:** Authoring is **ms-first**. `<clip-frames>` duration inputs and the “Set all” ms control write per-frame milliseconds. An **FPS preset** (6/12/15/24/25/30) is only a convenience that applies `ms = 1000/fps` to every frame via the same Set-all path — not a standing clip property. GIF `delay` is also ms. On disk, `frameRatesForFrames` remains **FPS** for now (ms-on-disk is a future migration). Convert with the **shared ms↔FPS helper** on save/load — do not duplicate conversion logic. Staging preview honors per-frame ms (Task 130).
- **Expand before preview:** GIF expansion early enough that preview and `<clip-frames>` match what will be saved.
- **Edit load path:** load prior raw frames when present; otherwise extract cells from `sprite.png` using meta `frames` / `framesPerRow`. When loading existing FPS meta into the UI, convert **FPS → ms** with the inverse of that same helper so the editor stays in ms.
- Feasible with existing `sharp` prebuilt binaries (unlike HEIC).

## Out of scope (for now)

- **HEIC / HEIF** — needs custom libvips/libheif; users can export JPG on-device.
- Animated WebP and video import.
- Changing AKVJ live canvas resolution (output stays 240×135; clips can be other sizes and positioned/tiled within it).
- Fancy id schemes (namespaces, checksums, etc.) — plain unique string is enough.
- Clip id rename after create (folder + key-map rewrite).

### 10. Pattern fill mode

- **`pattern`** is a new `scaleMode` value: instead of stretching one cell to fill the canvas, the cell is **tiled (repeated)** to fill the entire 240×135 output.
- Tiling starts from `0,0` (top-left of the canvas) and repeats in both X and Y. Placement offset (§11) shifts the tile grid origin.
- The cell is drawn at its native `frameWidth` × `frameHeight` — no scaling applied per tile. If the cell is larger than the canvas, it is clipped (same as `none` mode for overflow).
- Transparency in the cell is preserved per-tile; transparent areas show whatever is underneath in the layer group compositing pipeline.
- **Meta field:** `"scaleMode": "pattern"` in `meta.json`.
- **Editor UI:** add "Pattern" to the scale mode dropdown. Preview should show the tiling effect (repeat the staging cell across the preview area).
- **Compositing:** pattern clips composite the same way as other clips within their layer group — the only difference is the draw call tiles instead of stretches. Mask blending and layer-group compositing are unchanged because the clip still draws onto its layer-group offscreen canvas (which is 240×135); the tiling fills that canvas.

### 11. Placement & whole-pixel rule

#### Placement

- **Placement** specifies where the clip cell lands on the 240×135 output canvas.
- **Origin convention:** `0,0` = **center of the screen** (not top-left). Positive X moves right, positive Y moves down.
- **Units:** **pixels** (integers). Percent is not supported in v1 — keeps the schema simple and avoids fractional resolution. The canvas is small (240×135) so pixel precision is natural.
- **Meta field:** `"placement": { "x": 0, "y": 0 }` in `meta.json`. Omitting placement defaults to `{ x: 0, y: 0 }` (centered).
- **Resolution:** the engine converts center-origin to top-left-origin: `drawX = floor((canvasWidth - frameWidth) / 2 + placement.x)`, `drawY = floor((canvasHeight - frameHeight) / 2 + placement.y)`. The `floor()` ensures whole-pixel snapping.
- **Interaction with scaleMode:**
  - `fit` / `cover` / `none`: placement offsets the scaled/centered result.
  - `stretch`: placement is ignored (clip fills the entire canvas; stretching to 240×135 means there's nowhere to place it).
  - `pattern`: placement shifts the tile grid origin.
- **Per-mapping override:** placement is a **clip-level default** in `meta.json` only. Per-mapping-slot placement override is a future feature (same pattern as Task 138's sync override) — not in scope for v1.

#### Whole-pixel rendering (engine-wide rule)

- **All draw positions and sizes in `akvj` must resolve to integer pixels.** This applies to:
  - Clip cell draw position (`drawX`, `drawY`) after placement resolution.
  - Clip cell draw size (`dWidth`, `dHeight`) after scaling — `floor()` the result.
  - Pattern tile offsets.
  - Any future transform or effect that produces draw coordinates.
- **Existing path:** today's `drawImage(image, ..., 0, 0, canvasWidth, canvasHeight)` is already whole-pixel by construction (0, 0, 240, 135 are all integers). The risk is only in new placement/scaling math introducing fractional values — the `floor()` rule prevents that.
- This is consistent with `imageSmoothingEnabled: false` (`Compositor.js:112`) — sub-pixel positions would cause blurry edges even with smoothing disabled, because the browser would anti-alias the edge pixels.
- **Implementation:** a shared `snapToPixel(value)` helper (or inline `Math.floor()`) at every draw-call boundary in `Clip.js`. Do not scatter `Math.floor()` calls ad-hoc — centralize the snapping logic.
