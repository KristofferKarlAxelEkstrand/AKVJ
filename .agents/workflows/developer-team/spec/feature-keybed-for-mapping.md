# Feature: Keybed for Mapping

## Summary

Evolve the piano roll from a click-to-assign surface into a visual velocity mapping editor where clips are shown as rectangular regions inside each key and breakpoints between them are draggable. The piano roll should always be sticky-positioned so it stays visible while scrolling clip lists or mapping tables.

---

## Current State

The piano roll (`<piano-roll>`) already exists with three modes — `edit`, `category`, `play` — and renders 128 `<piano-key>` children. In edit mode, velocity bands are rendered as `<button>` elements positioned by `bottom` and `height` percentages inside the key. Clicking an empty key assigns the currently selected clip; clicking a band selects that mapping into the form fields. The bands are display-only — there are no draggable handles and no drag-and-drop from the clip library.

This feature builds on that foundation. The mode system, channel selector, event dispatch, and multi-instance architecture all stay. What changes is how mappings are visualized and edited within each key.

---

## Modes

### Select Mode (renamed from `category`)

Click a note → the note number is dispatched. That's it. No clip list, no dimming, no read-only view below the roll. The roll acts as a pure note selector — the consumer decides what to do with the selected note. This is what the Library tab uses: click a key, the clip list filters to whatever is mapped to that note.

Rename `category` → `select` throughout (`PianoRoll.js`, `PianoKey.js`, `index.html`, `main.js`, tests). The mode name `select` is clearer about what happens: you select a note.

### Edit Mode

The primary mapping workflow. Two interactions:

1. **Drag-and-drop a clip onto a key** — This is the main way to add a mapping. Drag a clip from the clip list (or anywhere clips are rendered as draggable elements) and drop it onto a piano key. The drop assigns that clip to the key at the current channel and auto-sets a velocity breakpoint.

2. **Drag velocity breakpoints** — When a key has multiple clips mapped, each clip occupies a rectangular region inside the key (bottom = velocity 0, top = velocity 127). Between adjacent regions there is a draggable handle. Drag the handle up or down to change the velocity threshold where one clip hands off to the next.

### Play Mode

Unchanged from current behavior. Sticky-toggle keys dispatch `noteon`/`noteoff` for testing mappings.

---

## Velocity Regions Inside Keys

### Visual Model

Each key is a vertical rectangle. Velocity 0 is at the bottom, velocity 127 is at the top. When a clip is mapped to a key, it occupies a rectangular sub-region of the key face spanning its velocity range. If two clips are mapped, the key shows two stacked rectangles. If three clips, three rectangles. And so on.

The region is filled with a visual indicator of the clip. Start with a color swatch derived from clip identity (plus clip ID text where the region is tall enough to hold it); layer in a thumbnail of the clip's first sprite frame as the region background in a later pass. The spatial mapping (bottom = low velocity, top = high velocity) must be immediately legible regardless of which preview style is active.

No artificial cap on clips per key — up to 128 (one per velocity value) is allowed. Regions can get down to 1 velocity unit tall at that extreme; the breakpoint handle's hit target (6–8px, see below) will necessarily overlap neighboring regions when they're that thin. That's an accepted tradeoff, not a bug — don't add logic to refuse a drop for being "too many clips."

### Breakpoint Handles

Between two adjacent velocity regions there is a horizontal handle — a thin draggable bar spanning the width of the key. Dragging it up or down changes the velocity value where the boundary sits. This directly edits the velocity field of the mapping entry that starts at that boundary.

- The handle should have a visible grab area (not just a 1px line — give it a hit target of at least 6–8px).
- While dragging, show a live velocity readout (e.g., a small tooltip or label near the handle showing the current velocity value).
- Constrain dragging so a handle cannot cross past an adjacent handle (minimum gap between breakpoints, e.g., 1 velocity unit).
- On release, dispatch a `mappingchange` event with the updated velocity for the affected mapping entry.

### Removing a Mapping

Right-click a region to remove it (for now — hover-× or drag-out are deferred, not ruled out). Right-click dispatches a `mappingremove` event with `{ channel, note, clipId, velocity }` for the affected entry; remaining regions redistribute evenly across the freed velocity range the same way a drop does.

### Auto-Breakpoint on Drop

When a clip is dragged onto a key that already has mappings, the new clip is inserted and breakpoints are redistributed evenly. Examples:

- **1 clip** → occupies the full key (velocity 0–127).
- **2 clips** → split 50/50 (breakpoint at velocity 64).
- **3 clips** → split into thirds (breakpoints at 42 and 85).
- **N clips** → evenly distributed: breakpoint *i* at `round(128 * i / N)`.

The Y position of the drop is the hint for both the clip's velocity **and** its insertion index in the stack: find where the drop Y falls among the existing regions, insert the new clip at that position in the ordered list, then redistribute breakpoints evenly across all N clips (including the new one). Dropping near the top of the key inserts near the high-velocity end; dropping between two existing regions inserts between those two clips in the stack. After the auto-distribution, the user can fine-tune by dragging handles.

If the key already has mappings and the user drops a new clip, redistribute all breakpoints evenly (don't just append at velocity 127) — even distribution is the starting point, insertion order from drop Y decides where the new clip lands in that distribution.

---

## Drag-and-Drop from Clip List

The clip list (`<akvj-clip-list>`) should make each clip entry draggable. The `dataTransfer` payload carries the `clipId`. The piano key accepts the drop and creates a mapping entry at the auto-distributed velocity.

Implementation notes:

- Clip list entries set `draggable="true"` and dispatch `dragstart` with `clipId` in `dataTransfer`.
- Piano keys accept `dragover` (prevent default to allow drop) and `drop` events.
- On drop, the key dispatches a `mappingadd` event (bubbles up through `PianoRoll`) with `{ clipId, note, channel, velocity }` where `velocity` is the auto-distributed value.
- The existing form-based "Add / update" button stays as a fallback for precise manual entry, but drag-and-drop is the primary interaction.

---

## Sticky Positioning

The piano roll sticks to the **bottom** of the viewport (`position: sticky; bottom: <offset>;`), not the top. This applies to all instances of `<piano-roll>` regardless of mode.

Rationale: in Edit mode the keybed is a drop *target* for drag-and-drop from the clip list (Phase 3). Anchoring it at the bottom keeps it under the cursor's natural resting point while the clip list or mapping table scrolls above it, so the user never has to drag a clip off the top of the viewport to reach it. It also trades the old nav-bar-offset problem for a (usually simpler) bottom-toolbar-offset one — see below.

The sticky behavior stays CSS-only (`position: sticky; bottom: <offset>;`) — no JavaScript scroll listeners. If the page has a bottom toolbar/footer, the offset should account for its height so the roll sticks above it, not under it; otherwise `bottom: 0`.

---

## Events

| Event | Mode | Detail | Purpose |
|---|---|---|---|
| `keyclick` | all | `{ note, mode, action, mappings }` | Existing. General key click. |
| `noteon` | play | `{ note, clipId, velocity, mappings }` | Existing. Sticky key activated. |
| `noteoff` | play | `{ note, clipId, velocity, mappings }` | Existing. Sticky key released. |
| `mappingadd` | edit | `{ clipId, note, channel, velocity, mappings }` | New. Clip dropped onto a key. |
| `mappingchange` | edit | `{ channel, note, oldVelocity, newVelocity, clipId }` | New. Breakpoint handle dragged. |
| `mappingremove` | edit | `{ channel, note, clipId, velocity, mappings }` | New. Region right-clicked to remove. |
| `channelchange` | all | `{ channel }` | Existing. Channel selector changed. |

`mappings` on `mappingadd`/`mappingremove` is the full, already-redistributed list of `{ clipId, velocity }` entries for that note+channel — same precedent as `keyclick`/`noteon`/`noteoff` carrying `mappings` today. Dropping or removing a clip shifts every other clip's breakpoint on that key (see "Auto-Breakpoint on Drop" and "Removing a Mapping"), so the consumer needs the whole recomputed set, not just the one entry that triggered the event. `mappingchange` stays single-entry since dragging a handle only ever moves the one boundary between two adjacent regions.

---

## What Stays the Same

- **`<piano-roll>` custom element** — same tag, same multi-instance pattern, same `mode`/`channel`/`channel-select` attributes.
- **`<piano-key>` custom element** — same 128-key rendering, same black/white key styling, same note labels on C keys.
- **Channel selector** — per-instance `<select>` with DAW channel labels, unchanged.
- **Play mode** — sticky multi-select with `noteon`/`noteoff` dispatch, unchanged.
- **Event bubbling** — all events bubble up from `PianoKey` through `PianoRoll` to the consumer, same as today.
- **Vanilla JS / custom elements** — no frameworks, no libraries, light DOM, same architecture rules.

---

## Implementation Phases

### Phase 1: Rename `category` → `select`

Rename the mode across all files. Simplify select mode to just dispatch the note on click — remove the clip view, dimming, and `is-compact` class. Update tests.

### Phase 2: Velocity regions with draggable handles

Replace the current velocity band `<button>` elements with region divs that have draggable breakpoint handles between them. Wire `mappingchange` events and right-click-to-remove (`mappingremove`, with redistribution). Keep the existing `buildVelocityBands` logic but add handle rendering, drag interaction, and removal.

### Phase 3: Drag-and-drop from clip list

Make clip list entries draggable. Add `dragover`/`drop` handling on piano keys. Implement auto-breakpoint distribution. Wire `mappingadd` events.

### Phase 4: Sticky positioning

Add `position: sticky` CSS to `.piano-roll` with appropriate `bottom` offset. Verify it works across all tabs (Library, Mapping) and doesn't overlap any bottom toolbar/footer.

---

## Decisions

- **Maximum clips per key**: No cap — up to 128 (one per velocity value). Regions may get visually cramped at the extreme; that's accepted, not a reason to block a drop. See "Velocity Regions Inside Keys" above.
- **Clip preview in region**: Start with a color swatch (+ clip ID text where space allows). Thumbnail-of-first-frame as a background is a later iteration, not required for the initial build.
- **Drop position → velocity**: Y position is a hint for both velocity *and* insertion index among existing clips in the stack — not just an append-at-end. See "Auto-Breakpoint on Drop" above.
- **Removing mappings**: Right-click a region to remove it, dispatching `mappingremove`. Hover-× and drag-out are deferred, not ruled out for later.
