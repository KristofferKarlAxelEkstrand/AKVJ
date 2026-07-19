# Feature: Clip Library Panel on the Mapping Page

## Status: In Progress (opened 2026-07-19)

## Tasks (dependency order)

| Task | Owner | Status | Description |
| --- | --- | --- | --- |
| 248 | none (backlog) | backlog | Mount `<akvj-clip-list>` on the Mapping panel |
| 249 | none (backlog) | backlog | Trim redundant action buttons (depends on 248) |
| 250 | none (backlog) | backlog | Double-click a velocity region to remove it (independent) |
| 251 | none (backlog) | backlog | Cross-cutting integration verification (depends on 248, 249, 250) |

## Open Questions — Resolved (Team Lead, 2026-07-19)
1. **Action buttons**: hide Map (redundant with drag-and-drop), keep Edit/Delete visible
   on the Mapping-page list. See task 249.
2. **Channel-kind filtering**: out of scope — the new list starts unfiltered, same as the
   Library list. File as a follow-up if requested later. See task 248.
3. **Independent filter state**: confirmed yes, per the epic's own leaning — no shared
   `mainframeState.searchQuery`/sort/role-filter between the Library list and the new
   Mapping-page list. See task 248.

## Summary

Add a draggable clip library list to the Mapping page (`#panel-mapping`), next to the mapping table, so a user can drag a clip straight from the library onto a key on the sticky bottom keybed. The drag-and-drop mapping mechanism itself — multi-clip velocity regions, draggable breakpoint handles, auto-redistribution, no-overlap guarantee, sticky-bottom keybed — already exists and ships today. What's missing is a *clip list to drag from* on this specific page.

---

## Current State

The keybed-for-mapping epic (`.agents/workflows/developer-team/epics/keybed-for-mapping.md`, spec at `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`) shipped and was QA-approved 2026-07-18. It already delivers everything requested for the keybed itself:

- **Sticky bottom keybed** — `<piano-roll>` (and the `.piano-roll-dock` wrapper around the edit+play pair on this page) uses `position: sticky; bottom: 0`, confirmed in `mainframe/src/scss/PianoRoll.scss:1-10, 67-79`. Already present on the Mapping tab (`mainframe/src/index.html:227-234`).
- **Per-roll channel selector** — `channel-select` attribute renders a `<select>` of all 16 DAW channels with layer-group labels (`PianoRoll.js:60,215-243`). Already on `#mapping-piano-roll` (`index.html:228`).
- **Drag a clip onto a key to map it** — `ClipInstance` sets `draggable="true"` and puts `clipId` in `dataTransfer` on `dragstart` (`ClipInstance.js:94-107`). `PianoKey` accepts `dragover`/`drop` and dispatches `mappingaddrequest` → `PianoRoll` forwards as `mappingadd` in edit mode only (`PianoKey.js:286-334`, `PianoRoll.js:359-377`).
- **Velocity-drag, like breakpoint handles already do** — dragging the handle between two regions live-updates the boundary velocity and dispatches `mappingchange` on release (`PianoKey.js:126, 467-542`).
- **Many clips on one key, never overlapping** — clips on a key are stored as contiguous velocity *bands* that partition 0–127 (`buildVelocityBands`, `PianoKey.js:49-65`). Dropping a new clip inserts it at the Y-position-implied index and evenly redistributes all breakpoints (`redistributeVelocities`, `PianoKey.js:67-79`); a drop is rejected outright if it would create a region smaller than `MIN_REGION_VELOCITY` (`PianoKey.js:319-322`). Overlap is structurally impossible — regions are a partition, not independent ranges.

**The gap:** none of that is reachable from the Mapping page today, because the Mapping page has no clip list. The only clip list in the whole app (`<akvj-clip-list id="clip-list">`) is mounted on the **Library** panel (`index.html:31`), which is a different, hidden `<section>` while Mapping is active (`AkvjMainframe.js` tab switching hides/shows one `.panel` at a time). The Mapping panel (`index.html:205-235`) only has:
- `<akvj-mapping-table>` — a table of *existing* mappings (channel/note/velocity/clipId rows with remove buttons), not a browsable library (`MappingTable.js:1-20`).
- A manual add form: Channel/Note/Velocity number inputs + a `<select id="map-clip-id">` clip-ID dropdown + "Add / update" button.
- The `#mapping-piano-roll` (edit) and `#play-piano-roll` (play/test) rolls.

Today's only bridge between the two tabs is the Library clip's "Map" button, which calls `mapClipFromLibrary()` — it switches to the Mapping tab and pre-selects the clip in the manual `<select>`, but still requires typing channel/note/velocity by hand (`AkvjMainframe.js:110-112, 175-181`). There is no drag source on the Mapping tab itself, so the drop target (`#mapping-piano-roll`, mode="edit") is currently unreachable via drag-and-drop in practice.

---

## Proposed Change

Mount a second `<akvj-clip-list>` instance inside `#panel-mapping`, positioned above the sticky `.piano-roll-dock`, so the page reads top-to-bottom as: mapping table → clip library (scrolls) → sticky keybed pinned to the bottom (drop target always in reach).

### Layout

```
#panel-mapping
├─ panel-head (Reload / Save / Run pipeline — unchanged)
├─ hint: active project + DAW channel numbering note
├─ <akvj-mapping-table>            existing mappings, remove buttons
├─ <akvj-clip-list id="mapping-clip-list">   NEW — draggable source
├─ manual add form (Channel/Note/Velocity/Clip select + Add/update)  kept as fallback
├─ mapping-status
└─ .piano-roll-dock (sticky bottom)
   ├─ #mapping-piano-roll (edit)
   └─ #play-piano-roll (play/test)
```

The manual form stays — it's the precise-entry fallback for keyboard-only or exact-value use, same rationale as the original spec's "Auto-Breakpoint on Drop" section.

### Data wiring

No new component needed — `ClipList` already supports `clips`, `searchQuery`, `roleFilter`, `sortMode` (`ClipList.js:14-19` and setters below). Mirror what `renderLibrary()` already does for `#clip-list`:

```js
mappingClipListElement.clips = mainframeState.clips;
```

`mainframeState.clips` is already the reactive catalog source (`mainframeState.js:40-50`), so the new list updates the same way the Library one does whenever clips are loaded/saved. Reuse it as-is — do not fork a new list component.

### Drag source → drop target, unchanged

Because `ClipInstance` → `PianoKey` drag/drop wiring is generic (keyed off `dataTransfer`, not a specific list instance), simply rendering `<akvj-clip-list>` inside `#panel-mapping` and dragging one of its `ClipInstance` children onto `#mapping-piano-roll` should work with **zero changes** to `PianoKey.js`, `PianoRoll.js`, or `ClipInstance.js`. This is page composition, not new drag-and-drop engineering.

### Filter/search scope

Reuse the existing search/sort/role-filter UI pattern from the Library panel's `panel-actions` (`index.html:20-28`) above the new list, so users can find a clip by name before dragging it — same affordance, second instance, independent filter state (don't share `mainframeState.searchQuery` between the two lists, or filtering one would filter the other).

### Clip action buttons on the Mapping-page copy

`ClipInstance` currently renders Edit / Delete / Map buttons (`ClipInstance.js:60-88`). On the Mapping-page list:
- **Map** button is redundant once drag-and-drop works from the same page — consider hiding it here (open question below).
- **Edit** / **Delete** — keep or hide? Editing/deleting a clip from the Mapping tab is plausible but out of this feature's core ask.

---

## New Interaction: Double-Click to Remove a Clip

Today the only way to remove a clip from a key is right-click on its region (`contextmenu` → `#handleContextMenu` → `#removeRegion`, `PianoKey.js:260-268, 582-`). Add **double-click** on a region as a second, additive gesture that does the same thing — not a replacement. Right-click stays; this is for users who find double-click more discoverable/reachable (e.g. no easy right-click on some trackpads) than a context-menu gesture that also has to have its default browser menu suppressed.

- Register a `dblclick` listener on each region element next to the existing `pointerup`/removal wiring in `#renderRegions()` (`PianoKey.js:384-402`).
- On `dblclick`, call the same `#removeRegion(region)` helper the context-menu path already uses (`PianoKey.js:582`) — same redistribution-on-removal behavior, same `mappingremoverequest` → `mappingremove` event, no new event type needed.
- `event.stopPropagation()` on the region's `dblclick` so it doesn't bubble into the key's own click handling.
- Scope: this is a `PianoKey.js` change, so it applies everywhere regions render in edit mode — not specific to the new Mapping-page clip list. No changes needed to `PianoRoll.js` or the event contract; `mappingremove`'s detail shape is unchanged.

This is the one piece of actual new keybed behavior in this draft — everything else in "Non-Goals" below is unchanged, existing code.

---

## Non-Goals (already solved elsewhere — do not re-implement)

- Velocity region rendering, breakpoint handles, live drag readout — done (Phase 2, task 185).
- Auto-breakpoint redistribution math, drop-Y → insertion index — done (Phase 3, task 186).
- No-overlap guarantee — structural, done.
- Sticky-bottom keybed positioning, including the two-roll overlap fix (`.piano-roll-dock`) — done (Phase 4, task 187 + follow-up).
- Channel selector on the roll — done.
- Removing a mapping via right-click on a region — done. (Double-click as an *additional* removal gesture is new — see "New Interaction" above, not a non-goal.)

This draft is scoped to **page composition** (mount a clip list where the user needs it) plus the one small **new keybed interaction** above (double-click to remove).

---

## Open Questions

1. Hide the Map/Edit/Delete action buttons on the Mapping-page clip list, or keep all three? (Map is redundant with drag-and-drop; Edit/Delete may still be useful without a tab switch.)
2. Should the Mapping-page clip list default to filtering by the currently-selected channel's "kind" (e.g. bitmask clips only visible when channel 5), or stay unfiltered like the Library list?
3. Independent search/sort/role-filter state per list instance, confirm no shared state with the Library tab's list (leaning yes per "Filter/search scope" above — flag if that's wrong).

---

## Implementation Phases

### Phase 1: Mount clip list on Mapping panel
Add `<akvj-clip-list id="mapping-clip-list">` (+ its own search/sort/role-filter controls) to `index.html` inside `#panel-mapping`, above `.piano-roll-dock`. Wire `mainframeState.clips` the same way `renderLibrary()` does today. No changes to `PianoKey.js` / `PianoRoll.js` expected.

### Phase 2: Trim action buttons for this context
Resolve Open Question 1; adjust `ClipInstance` rendering to accept a flag (e.g. `showMapAction`) or otherwise suppress the redundant button on this instance, without affecting the Library tab's list.

### Phase 3: Double-click to remove
Add the `dblclick` listener on velocity regions in `PianoKey.js`, wired to the existing `#removeRegion()` path (see "New Interaction: Double-Click to Remove a Clip" above). Independent of Phases 1–2 — can ship first, in parallel, or last.

### Phase 4: Manual verification
Drag a clip from the new list onto a key on `#mapping-piano-roll`; confirm `mappingadd` fires and the mapping table updates. Double-click an existing region and confirm it's removed and remaining regions on that key redistribute. Confirm the new list's filter state doesn't leak into/from the Library tab. Confirm layout doesn't break the sticky dock (list scrolls, dock stays pinned).
