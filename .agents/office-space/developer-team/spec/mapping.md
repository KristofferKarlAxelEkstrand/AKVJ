---
id: mapping
title: MIDI Mapping & Piano Roll
status: draft
owner: human
maintainer: team-lead
approved:
verified: 2026-07-29
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
| `select` | Attribute alias for `filter` (`mode="select"` → same filter view/controls); not a separate HTTP surface |
| `filter` | Click a key to select its note; filter controls (clip id / trigger / role / layer / populated) dim non-matching regions. Active filters persist in `localStorage` keyed by element `id` (or `filter-storage-key`) so library vs mapping rolls do not clobber each other |
| `play` | Sticky-toggle keys for testing mappings: velocity slider (0–127) plus click Y within the key (top = 127, bottom = 0); note-on carries that velocity and floor-selects the mapped clip; inline `<preview-clip>` shows the triggered clip; active keys pulse until note-off or `playbackended` |

`edit`, `filter`, and `play` have mode buttons in the UI; `select` is still accepted as an attribute
value and lights the Filter button, but it is not a separate bare note picker.

The roll is `position: sticky` to the **bottom** of the viewport, so it stays under the cursor as
a drop target while the clip list scrolls above it. CSS only — no scroll listeners.

## Play mode

Play mode keeps the same `<key-bed>` but clears velocity-region chrome so each key is a single
trigger target. Controls live in `.piano-roll-play-view`:

- **Velocity** — range input 0–127 (default 100) with a live readout. A pointer click on a key
  overrides the slider from click Y (`PianoKey.#velocityFromPointerEvent`); the slider updates to
  match.
- **Clip selection** — note-on floor-selects the highest mapping threshold ≤ trigger velocity
  (same rule as akvj `velocitySelection`).
- **Preview** — `<preview-clip>` in the play view loads and plays the selected clip id; empty
  state until a mapped key is triggered. Leaving Play mode, clearing selection, or turning off
  the last active note stops the preview.
- **Playback indicator** — `piano-key.is-active` under `.is-play` uses a pulse outline; cleared on
  sticky note-off, `clearSelection()`, mode change, or `<preview-clip>` `playbackended`.

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

**Drag a region** to another note or velocity slot to move that placement (HTML5 drag with
`application/x-akvj-mapping-move`). Same-note drops reorder; cross-note drops remove from the
source and insert on the target.

**Batch select** in Edit mode: click a region to select it; Shift+click or Shift+drag across
regions to add. The edit toolbar supports Undo / Redo, Delete selected, Clear selection, and
Assign clip (text field or drop a clip id onto the field). Undo is a bounded in-memory stack
(UI state only — not written until Save).

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
`PUT /api/projects/{projectId}/key-map` (and loads via `GET` on the same path), which validates
every entry against that project's pipeline-ready clips before writing
`projects/{projectId}/key-map.json`. An entry pointing at a clip that is missing or incomplete is
rejected — the whole save fails, not just that row.

There is **no** legacy flat `GET`/`PUT /api/mapping` — removed in task **414**. Per-project
`/api/projects/{projectId}/key-map` is the only mapping HTTP surface.

## Not built yet

- **Clip thumbnails** inside velocity regions (colour swatch + id today).
- **Hover-× or drag-out removal** — right-click and double-click are the removal gestures today.
- **Play mode keyboard shortcuts / BPM tempo display** — Phase 5 polish in `epics/todo/piano-roll-modes.md`.

## Changelog

- 2026-07-29 — Residual wording (TL/NIT): `select` row = **attribute** alias (not HTTP “API”);
  old changelog line that claimed flat `/api/mapping` still on server annotated as superseded by
  the 414 fact-correct below.
- 2026-07-29 — Fact-correct: legacy `GET`/`PUT /api/mapping` is **gone** (task 414). Only
  `/api/projects/{id}/key-map` remains. Confirmed against `mainframe/server/routes/router.js`.
  Re-verified MIDI note→pixel path (Midi → AppState → LayerManager → Clip → Renderer rAF):
  clean; finished-mask keep-last-frame (499) holds. No new product bugs on that path.
- 2026-07-29 — Re-verified modes / sticky / MIN_REGION=2 / play vel against PianoRoll +
  pianoRollMappingEdit. Facts hold. Filed bugs: edit path strips key-map leaf overrides;
  filter “momentary” misses omitted triggerType.
- 2026-07-20 — Task **421**: Filter mode persists clipId / trigger / role / layer / populated
  filters in `localStorage` (`akvj:piano-roll:filters:<id|filter-storage-key>`).
- 2026-07-20 — Re-verified Play/Edit facts against `PianoRoll.js` (velocity default 100,
  `<preview-clip>` + `playbackended`, undo stack, Shift batch-select) and traced akvj
  note-on → pixel path (`Midi` → `AppState` sync dispatch → `LayerManager` → `LayerGroup` /
  `Clip.reset` → independent `Renderer` rAF). No fact drift; “Not built yet” keyboard/BPM
  still matches task 422. No new product bugs on that path.
- 2026-07-20 — Task **420**: Edit mode undo/redo, batch select (Shift+click / toolbar delete &
  assign), and region drag-reorder across notes/velocities; “Not built yet” batch/undo items
  removed.
- 2026-07-20 — Task **419**: Play mode velocity slider + click-Y intensity, inline `<preview-clip>`,
  active-key pulse cleared on note-off / `playbackended`; documented under Modes / Play mode.
  Phase 4 “Not built yet” items for those three features removed (keyboard/BPM still open).
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
  key-map handlers: `select` is a filter attribute alias (not a bare picker); removal is right-click
  **or** double-click; save path is `PUT /api/projects/{id}/key-map`. *(Earlier note that legacy
  flat `/api/mapping` “still on server” was wrong after task 414 — see 2026-07-29 fact-correct.)*
- 2026-07-20 — Written as current truth from `feature-keybed-for-mapping.md`. Records the shipped
  four-mode set (the proposal had three), the `MIN_REGION_VELOCITY` drop rejection (the proposal
  said never refuse a drop), and the request/public event split.
