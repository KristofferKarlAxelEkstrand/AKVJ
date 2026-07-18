# Feature: Edit Clip (deep-linkable clip editor)

## Goal

Make **editing an existing clip** a first-class path through the same Mainframe clip editor used for create.

A user should be able to open a library clip (or paste a URL), see its **frames** and **settings** already loaded, change anything they could change on create, and **save over** that clip — spritesheet + `meta.json` updated in place. No separate metadata-only form; one editor, two entry modes.

This builds on [clip-upload-edit-feature.md](../spec/clip-upload-edit-feature.md). That doc covers the shared editor product. **This draft scopes the edit entry path, routing, load/hydrate, and overwrite save.**

Break delivery into small tasks later — do not treat this as one monolithic PR.

---

## Problem today

- Create and edit already share most of the upload UI, but edit is reached by navigating to `/clip/new` after a library click.
- That URL does not reflect “editing clip X”, is not bookmarkable, and breaks on refresh (edit state is in-memory only).
- Older clips may have only `sprite.png` + `meta.json` (no `.raw-assets/`). Edit must still open by **splitting the spritesheet into frames**.
- Not every persisted meta field is hydrated into the shared editor chrome (create-focused fields only). Round-trip should be complete for the fields the editor owns.

---

## Product shape

### One editor surface

| Mode | Meaning |
| ---- | ------- |
| **New** | Empty editor, auto-generated clip id (full slug of the name, or short random if unnamed; editable until first save), create on submit |
| **Edit** | Hydrated from disk, clip id **read-only**, save **overwrites** that clip |

Same controls in both modes: drop zone, frame list (`<clip-frames>`), staging preview, frame size / scale mode, playback, timing, role, name, clip id.

### URL scheme (recommended)

Collapse create + edit under **`/clip/edit`** so the route matches the product (“Clip editor”), not an old “upload” tab:

| URL | Mode |
| --- | ---- |
| `http://localhost:9999/clip/edit` | New clip |
| `http://localhost:9999/clip/edit/{clipId}` | Edit existing clip |

Examples:

- New: `http://localhost:9999/clip/edit`
- Edit: `http://localhost:9999/clip/edit/id678jkdj`

**Compatibility:** keep `/clip/new` as a redirect/replace to `/clip/edit` so existing bookmarks and tab links do not break.

**Library “Edit”:** navigate to `/clip/edit/{clipId}` (not `/clip/new`). After a successful **create**, replace the URL with `/clip/edit/{clipId}` so a refresh stays in edit mode on the new clip.

**Invalid / missing id:** if `{clipId}` is malformed or the clip does not exist, show a clear status error and fall back to new-clip chrome (or stay on the edit URL with an empty/error state — pick one and document it in the task). Do not silently create a different clip.

---

## Requirements

### 1. Deep-linkable routing

- Extend the client router to support a **dynamic** segment: `/clip/edit/:clipId`.
- Register `/clip/edit` (exact) for new mode.
- On route match with `clipId`, run the same load path as library Edit.
- On route match without `clipId`, reset to new-clip state.
- Browser back/forward and hard refresh must restore the correct mode from the URL.

### 2. Load path — frames first

When opening an existing clip, the editor must populate the frame list and staging preview before the user edits.

**Preferred source order** (already the right model server-side):

1. **Raw assets** — `clips/.raw-assets/{clipId}/` original stills, when present.
2. **Spritesheet cells** — if no raw assets, load `meta.png` (default `sprite.png`) and **extract each cell** using `frames`, `framesPerRow`, and cell size from meta (`frameWidth` / `frameHeight` when set; otherwise derive from sheet dimensions).

Each extracted cell becomes one editable frame (PNG with alpha preserved). Timing for the UI stays in **milliseconds**; convert from `frameRatesForFrames` (FPS) with the shared ms↔FPS helper.

Expose load source in status when useful (`Loaded N frames from sprite` / `from raw`) so authors know whether they are re-editing originals or baked cells.

### 3. Hydrate all editor-owned settings

On load, the form must reflect what is on disk — not defaults that silently diverge from the clip.

**Minimum round-trip fields for v1 (shared editor):**

| Field | Source | Notes |
| ----- | ------ | ----- |
| Clip id | path / folder name | Read-only in edit mode |
| `name` | meta | |
| `role` | meta | e.g. bitmask |
| `playback` | meta | |
| Frame size | `frameWidth` / `frameHeight` | Default 240×135 if absent (legacy clips). UI hint: "Frame size = clip cell size. Use stretch to fill canvas, pattern to tile, or fit/cover/none with placement for positioned clips." |
| `scaleMode` | meta | Default `fit` if absent. Now includes `pattern` (tile to fill). |
| `placement` | meta | Default `{ x: 0, y: 0 }` (centered) if absent. Pixel offsets from center of screen. |
| Per-frame durations | `frameRatesForFrames` | FPS → ms for `<clip-frames>` (authoring is **ms-first**) |
| All-frames duration (ms) | UI only → writes every per-frame ms | Uniform apply via “Set all”; greys out (blank) when frames differ; re-apply Set all to restore uniform |
| FPS preset | UI only → `fpsToMs(fps)` then same as Set all | Convenience setter (6/12/15/24/25/30), not a standing clip property; same mixed-state as Set all. On-disk stays `frameRatesForFrames` (ms-on-disk is a future migration, not in scope). |

**Also hydrate when the shared editor gains controls for them** (may be a follow-up slice if not already in the create form): `retrigger`, `triggerType`, `triggerGroup`, `bitDepth` (bitmask), `frameDurationBeats`. Do not invent values on save that the user never saw.

Do **not** require authors to hand-edit `frames` / `framesPerRow` in the UI — those stay derived from the staged frame list on save.

### 4. Save overwrites the same clip

- Edit save targets the **same** `clipId` (folder). Never create a second folder from an edit session.
- If frames, frame size, or scale mode changed: recompile spritesheet + rewrite raw assets + update meta (existing PUT frames / update path).
- If only meta/timing changed and frames are unchanged: meta-only update is OK, as long as ≥1 frame remains on disk.
- Reject save with **zero frames** (same rule as create).
- Clip id remains immutable after first create (rename is out of scope).

### 5. Meta / file format (only what edit needs)

Keep the format human-first ([clip-schema.md](../spec/clip-schema.md)). Prefer **documenting and consistently writing** fields the editor already needs over inventing a parallel format.

**Already part of the create/edit story (persist on write; read on edit):**

```json
{
  "scaleMode": "fit",
  "frameWidth": 240,
  "frameHeight": 135,
  "placement": { "x": 0, "y": 0 }
}
```

These are required for faithful re-open: cell size for sprite split, and scale mode for recompile after size changes.

**Legacy clips** without those fields remain valid:

- Cell size derived from sheet ÷ `framesPerRow` / rows.
- `scaleMode` defaults to `fit` in the editor.
- No mandatory migration of old folders; optional “save once” can stamp the new fields.

Do **not** store UI-only chrome in meta. Do **not** replace `frameRatesForFrames` with a parallel ms map on disk — keep FPS on disk, ms in the UI.

---

## User flows

### A. Edit from library

1. Library → Edit on a clip.
2. App navigates to `/clip/edit/{clipId}`.
3. Status: loading → frames + settings appear.
4. User adds / removes / reorders frames, tweaks timing or meta.
5. Save → overwrite → library refresh; URL stays on `/clip/edit/{clipId}`.

### B. Open by URL

1. User opens `http://localhost:9999/clip/edit/many-frames`.
2. Same hydrate as (A). Refresh keeps them on that clip.

### C. New clip (same surface)

1. Tab “Clip editor” or `/clip/edit` → empty editor + generated id.
2. First save creates the clip; URL becomes `/clip/edit/{clipId}`.

### D. Sprite-only clip (no raw assets)

1. Open an older clip that only has `sprite.png` + `meta.json`.
2. Server extracts cells; editor stages them as frames.
3. Further edits can add stills / GIF expand / reorder; save writes new sprite (+ raw assets for future edits).

---

## Implementation notes (for tasking)

- **Router:** `SimpleRouter` is static-path only today — add parameterized matching for `/clip/edit/:clipId` (or a small dedicated matcher). Keep History API push/replace behavior.
- **API:** reuse `GET /api/clips/:clipId/frames` (raw-or-sprite load), `PUT .../frames` (full recompile), `PUT /api/clips/:clipId` (meta-only). Avoid a second load protocol.
- **Alpha:** sprite extract and save must preserve transparency (same rules as upload spec §5).
- **Tab chrome:** label stays “Clip editor”; heading is hidden for a new clip and shows “Edit clip: {id}” when editing.
- **Tests:** route → hydrate; sprite-only load; raw-preferred load; save overwrite; zero-frame reject; refresh with id in URL.

## Suggested task slices

1. Dynamic routes: `/clip/edit` + `/clip/edit/:clipId`; redirect `/clip/new` → `/clip/edit`
2. Wire library Edit + post-create navigate to `/clip/edit/:clipId`; URL-driven hydrate/reset
3. Harden sprite cell extraction + duration hydrate; status shows `raw` vs `sprite`
4. Complete editor field round-trip for fields already on the create form; stamp `frameWidth` / `frameHeight` / `scaleMode` on save
5. (Follow-up) Expose remaining meta fields in shared editor if still missing from create UI

## Out of scope

- Clip id rename / folder + key-map rewrite after create
- Parallel editor UIs (do not revive metadata-only edit as the primary path)
- Changing live AKVJ canvas resolution (output stays 240×135; clips can be other sizes and positioned/tiled within it)
- HEIC / video import (see upload spec)

## Success criteria

- Opening `/clip/edit/{clipId}` shows that clip’s frames and settings without an extra click.
- Sprite-only clips open correctly (sheet split into frames).
- Save updates the same clip on disk; library reflects the change.
- Create and edit remain one UI; URLs make the mode obvious and survive refresh.
