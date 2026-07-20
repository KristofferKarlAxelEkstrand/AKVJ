---
id: mapping
title: MIDI Mapping & Piano Roll
status: draft
owner: human
maintainer: overseer
approved:
verified: 2026-07-20
supersedes: [feature-keybed-for-mapping]
---

# MIDI Mapping & Piano Roll

`<piano-roll>` is how a set gets mapped: a channel selector, four modes, and a `<key-bed>` of 128
`<piano-key>` children. It is the visual face of `key-map.json` — the file format itself is in
[clip-format.md](clip-format.md).

Implementation: `mainframe/src/js/PianoRoll.js`, `KeyBed.js`, `PianoKey.js`,
`mainframe/src/scss/PianoRoll.scss`, `KeyBed.scss`. DOM tree:
`<piano-roll>` → toolbar / views + `<key-bed>` → 128 × `<piano-key>`.

## Modes

| Mode | Behaviour |
| --- | --- |
| `edit` | The mapping workflow: drop clips onto keys, drag velocity breakpoints, right-click or double-click a region to remove |
| `select` | Legacy API alias for `filter` — same filter view and controls; kept for consumers that set `mode="select"` |
| `filter` | Click a key to select its note; filter controls (clip id / trigger / role / layer / populated) dim non-matching regions |
| `play` | Sticky-toggle keys dispatch `pianoroll:note-on` / `pianoroll:note-off` for testing mappings |

`edit`, `filter`, and `play` have mode buttons in the UI; `select` is still accepted as an attribute
value and lights the Filter button, but it is not a separate bare note picker.

The roll is `position: sticky` to the **bottom** of the viewport, so it stays under the cursor as
a drop target while the clip list scrolls above it. CSS only — no scroll listeners.

## Velocity regions

Each key is a vertical strip: velocity 0 at the bottom, 127 at the top. Every clip mapped to that
key occupies a rectangular region spanning its velocity range, filled with a colour swatch derived
from clip identity plus the clip id where the region is tall enough to show it.

Between adjacent regions sits a draggable handle with a grab target several pixels tall. Dragging
it moves the velocity boundary between the two clips and shows a live velocity readout; on release
the roll dispatches `pianoroll:mapping-changed`.

**Regions have a minimum size.** `MIN_REGION_VELOCITY` is 2 velocity units (`PianoKey.js:8`), and
a drop that would push any region below it is rejected. This is the practical cap on clips per
key — roughly 64, not the theoretical 128.

## Editing gestures

**Drop a clip on a key.** Clip list entries are `draggable` and carry the clip id in
`dataTransfer`. The drop's Y position decides both the new clip's velocity and its insertion index
among existing regions; breakpoints are then redistributed evenly across all N clips
(`round(128 × i / N)`). The form-based add/update controls remain for precise manual entry.

**Right-click or double-click a region** to remove that mapping. The remaining regions redistribute
evenly across the freed range, the same way a drop does.

## Events

All public events are namespaced `pianoroll:*` and bubble from `PianoKey` through `KeyBed` to
`PianoRoll` (then to the consumer). `KeyBed` does not re-dispatch — it is the DOM parent that
owns the keys. Constants live on `PianoRoll.js` (`EVENT_PIANOROLL_*`).

| Event | Mode | Detail |
| --- | --- | --- |
| `pianoroll:key-click` | all | `{ note, clipId, velocity, isActive, mode, action, mappings }` |
| `pianoroll:note-on` / `pianoroll:note-off` | play | `{ note, clipId, velocity, mappings }` |
| `pianoroll:mapping-added` | edit | `{ clipId, note, channel, velocity, mappings }` |
| `pianoroll:mapping-changed` | edit | `{ channel, note, oldVelocity, newVelocity, clipId }` |
| `pianoroll:mapping-removed` | edit | `{ channel, note, clipId, velocity, mappings }` |
| `pianoroll:channel-changed` | all | `{ channel }` |
| `pianoroll:mode-changed` | all | `{ mode }` |
| `pianoroll:filter-changed` | filter | `{ filters }` |

`mappings` carries the **full recomputed** list of `{ clipId, velocity }` for that note and
channel, because adding or removing a clip shifts every other breakpoint on the key.
`pianoroll:mapping-changed` stays single-entry — dragging a handle moves exactly one boundary.

Keys dispatch namespaced request events upward (`pianoroll:key-click-request`,
`pianoroll:mapping-add-request`, `pianoroll:mapping-change-request`,
`pianoroll:mapping-remove-request` — `EVENT_PIANOROLL_*_REQUEST` on `PianoKey.js`);
`PianoRoll` validates and re-dispatches them as the public `pianoroll:*` events above.

## Saving

Edits stay in memory until Save. The Mapping page (`AkvjMainframe`) persists via
`PUT /api/projects/{projectId}/key-map`, which validates every entry against that project's
pipeline-ready clips before writing `projects/{projectId}/key-map.json`. An entry pointing at a
clip that is missing or incomplete is rejected — the whole save fails, not just that row.

Legacy `GET`/`PUT /api/mapping` still exists and operates on the **active** project; the UI does
not use it for save/load anymore.

## Not built yet

- **Clip thumbnails** inside velocity regions (colour swatch + id today).
- **Batch selection** across cells, and undo/redo — see `epics/todo/piano-roll-modes.md`.
- **Hover-× or drag-out removal** — right-click and double-click are the removal gestures today.

## Changelog

- 2026-07-20 — Task **389**: request events → `pianoroll:*-request` (`EVENT_PIANOROLL_*_REQUEST`
  on `PianoKey.js`); footnote updated.
- 2026-07-20 — Narrative leftovers: play-mode `noteon`/`noteoff` and drag `mappingchange` →
  `pianoroll:*` names (QA bug follow-up to task 364).
- 2026-07-20 — Public events renamed to `pianoroll:*` after task 364 (`EVENT_PIANOROLL_*` in
  `PianoRoll.js`).
- 2026-07-20 — Task **367** landed: KeyBed treats `select` like `filter`/`edit` for velocity
  bands (`setMappedKeys` / `applyChannelMappings`). Changelog no longer claims the omit.
- 2026-07-20 — Fact-fix after KeyBed landed: documented `KeyBed.js` / `KeyBed.scss` and
  `<key-bed>` in the DOM tree; event path is PianoKey → KeyBed → PianoRoll (KeyBed does not
  re-dispatch). `select`≡`filter` alias stands.
- 2026-07-20 — Re-verified against `PianoRoll.js` / `PianoKey.js` / `AkvjMainframe.js` / projects
  key-map handlers: `select` is a filter alias (not a bare picker); removal is right-click **or**
  double-click; save path is `PUT /api/projects/{id}/key-map` (legacy `/api/mapping` still on
  server for active project).
- 2026-07-20 — Written as current truth from `feature-keybed-for-mapping.md`. Records the shipped
  four-mode set (the proposal had three), the `MIN_REGION_VELOCITY` drop rejection (the proposal
  said never refuse a drop), and the request/public event split.
