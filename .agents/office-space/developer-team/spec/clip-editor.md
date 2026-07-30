---
id: clip-editor
title: Clip Editor
status: draft
owner: human
maintainer: team-lead
approved:
verified: 2026-07-29
supersedes: [clip-upload-edit-feature, feature-edit-clip]
---

# Clip Editor

One editor surface creates a new clip and edits an existing one. Same drop zone, same frame list,
same staging preview, same settings — the only difference is whether it opened empty or hydrated
from a clip on disk.

Implementation: `mainframe/src/js/ClipEditorController.js`, `mainframe/src/js/ClipFrames.js`,
`mainframe/src/js/StagingPreview.js`; server side `mainframe/server/spritesheet.js` and
`mainframe/server/handlers/clips.js`.

## Routes

| Route | Behaviour |
| --- | --- |
| `/clip/edit` | Empty editor — creating a new clip |
| `/clip/edit/:clipId` | Loads that clip's frames and metadata |
| `/clip/new` | Redirects to `/clip/edit` |
| `/clip/new/:clipId` | Legacy entry, resolves to the same editor |

Edit URLs are deep-linkable and survive a refresh, because the clip id is in the path rather than
in memory.

## Clip identity

A clip's id is its folder name and its `key-map.json` key. New clips get a generated unique id;
it is hand-editable before the first save and read-only afterwards. The `name` field is the
human-readable label and never rewrites the id.

Existing human-readable ids stay valid. Renaming a clip after creation is not supported (see
*Not built yet*).

## Importing frames

Accepted formats: **PNG, JPG, GIF** (`mainframe/src/js/acceptedImageFiles.js` is the one place
that decides). Multiple files can be selected or dropped at once; order is preserved; adding to a
clip that already has frames appends.

GIF handling depends on the accepted batch:

| Batch (after filtering) | Result |
| --- | --- |
| N × PNG/JPG | N frames |
| exactly 1 animated GIF | expanded — every page becomes a frame, GIF delays become frame durations |
| exactly 1 static GIF | 1 frame |
| GIF alongside any other image | each GIF contributes its first page only |

`sharp` metadata decides animation: `pages > 1` (`mainframe/server/gifExpand.js`). Expansion runs
before preview, so what is staged is what gets saved.

Files that are not accepted produce a status message naming them. Valid files in the same batch
still stage; only a batch with nothing usable fails.

## Frame composition

Every frame is composited into the clip's frame size (default 240×135) with alpha preserved end
to end — decode, fit, spritesheet, stored `sprite.png`. JPG has no alpha and is treated as opaque.
Upload / first-bake resize uses sharp kernel `lanczos3` (`INGEST_RESIZE_KERNEL` in
`mainframe/shared/spritesheetCore.js`) — soft resampling, not nearest. That is separate from preview and from
akvj `scaling` metadata.

Each staged image can carry its own **bake** settings — scale (`fit`/`cover`/`stretch`/`none`/
custom), custom pixel size, and offset within the cell. These are import-session state: they are
burned into the spritesheet pixels on save and are **not** written to `meta.json`. Re-opening a
clip starts from the already-composited frames with a default `fit` bake; earlier bake choices are
not recoverable.

This is distinct from the clip-level `scaleMode` and `placement` in `meta.json`, which the engine
applies at draw time — see [clip-format.md](clip-format.md).

## Preview

The staging preview and the frame thumbnails sit on a Photoshop-style grey/white checkerboard
(`src/scss/_transparencyChecker.scss`) so transparency is visible against both dark and light
clips. There is no backdrop chooser, and the checker never bakes into the saved sheet.

The staging canvas buffer stays at the true frame size; only its CSS size is doubled, with
`image-rendering: pixelated`. Canvas drawing forces `imageSmoothingEnabled = false` (hard nearest)
regardless of clip `scaling` metadata — see [aesthetics.md](aesthetics.md).

Beat-mode clips still preview on the staged free-timing durations (default 1000 ms per frame).
The preview does **not** simulate MIDI clock or a fixed BPM; live beat lock is akvj-only.

## Timing

Authoring is millisecond-first: per-frame duration inputs and "set all" write milliseconds. FPS
presets are a convenience that applies `1000 / fps` to every frame. Loading an existing clip
prefers `meta.frameDurationsMs` when present (`mainframe/server/frameLoad.js`); otherwise it
converts `frameRatesForFrames` (FPS) to milliseconds. There is no per-frame beat-duration field —
beat lock is clip-level `sync` / `syncLength` / `syncBeats` (see [clip-timing-sync.md](clip-timing-sync.md)).

## Saving

Save writes the spritesheet and `meta.json` together. A metadata-only save is allowed when frames
are unchanged and at least one frame remains.

**Zero frames never saves.** Both create and edit refuse with `Cannot save with zero frames`
(`ClipEditorController.js:347`) rather than writing an empty clip or silently keeping the last
frame on disk.

## Not built yet

- **Clip id rename** after create — needs a folder move plus a `key-map.json` rewrite.
- **HEIC/HEIF import** — needs a custom libvips/libheif build; export to JPG instead.
- **Animated WebP and video import.**
- **Recovering per-image bake settings** on re-open.

## Changelog

- 2026-07-29 — Re-verified: routes, zero-frame refuse (`ClipEditorController.js:347`), nearest
  staging preview, PNG/JPG/GIF import still match. Timing load fact corrected: prefer
  `frameDurationsMs`, else FPS→ms (not FPS-only). Noted no per-frame beat-duration field. Filed
  dead UI (`frame-duration-beats`, orphan `preview-clip`) separately as a bug ticket.
- 2026-07-29 — Re-verified against ClipEditorController / StagingPreview / routes / acceptedImageFiles.
  Routes, zero-frame refuse, nearest preview, PNG/JPG/GIF import still match. Corrected ingest kernel path
  to `mainframe/shared/spritesheetCore.js` (was `spritesheet-core.js`).
- 2026-07-20 — Re-verified: removed false “preview at 120 BPM” (preview uses staged ms; beat
  mode does not retimed preview); documented preview nearest lock and ingest `lanczos3` kernel.
- 2026-07-20 — Written as current truth, merging `clip-upload-edit-feature.md` and
  `feature-edit-clip.md`. Route corrected to `/clip/edit` (the proposals said `/clip/new`).
