---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 248: Mount `<akvj-clip-list>` on the Mapping Panel

## Epic
`.agents/workflows/developer-team/epics/mapping.md` — Phase 1

## Source
`.agents/workflows/developer-team/inbox/read/team-update-mapping-epic-ready.md`
(Human feature request, epic ready for breakdown)

## Affected Files
- `mainframe/src/index.html` (`#panel-mapping`)
- `mainframe/src/js/AkvjMainframe.js` (wherever `renderLibrary()` wires `mainframeState.clips`
  into `#clip-list`, for the pattern to mirror)

## Description
The Mapping page has no clip list to drag from — the only `<akvj-clip-list>` instance is
on the Library panel, a separate hidden `<section>` while Mapping is active. Mount a
**second** `<akvj-clip-list>` instance inside `#panel-mapping`, above the sticky
`.piano-roll-dock`, so the page reads top-to-bottom as:

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

No new component is needed — `ClipList` already supports `clips`, `searchQuery`,
`roleFilter`, `sortMode`. Mirror what `renderLibrary()` already does for `#clip-list`:
`mappingClipListElement.clips = mainframeState.clips;`. `mainframeState.clips` is already
the reactive catalog source, so the new list updates the same way the Library one does.
Reuse `ClipList` as-is — do not fork a new component.

Add its own search/sort/role-filter controls above the list, mirroring the Library
panel's `panel-actions` pattern (`index.html:20-28`) — **with independent state**: do
not share `mainframeState.searchQuery` (or sort/role-filter state) between the Library
list and this new Mapping-page list, or filtering one would filter the other.

**Resolved (Team Lead, matching the epic's own default)**: the Mapping-page list starts
**unfiltered by channel** — same as the Library list. Auto-filtering by the
currently-selected channel's "kind" (e.g. bitmask-only when channel 5 is selected) is out
of scope here; file it as a follow-up if the human asks for it later. This keeps the task
scoped to page composition, matching the epic's stated non-goal of not re-implementing
drag-and-drop engineering.

Because `ClipInstance` → `PianoKey` drag/drop wiring is generic (keyed off
`dataTransfer`, not a specific list instance), simply rendering `<akvj-clip-list>` inside
`#panel-mapping` and dragging one of its `ClipInstance` children onto
`#mapping-piano-roll` should work with **zero changes** to `PianoKey.js`, `PianoRoll.js`,
or `ClipInstance.js`.

## Discrete Actions
1. Add `<akvj-clip-list id="mapping-clip-list">` + its own filter/search/sort controls to
   `mainframe/src/index.html` inside `#panel-mapping`, positioned above
   `.piano-roll-dock`.
2. Wire `mainframeState.clips` into the new list the same way `renderLibrary()` does for
   `#clip-list`, with independent local filter/search/sort state (not shared with the
   Library list).
3. Confirm zero changes needed in `PianoKey.js` / `PianoRoll.js` / `ClipInstance.js` for
   basic drag-to-map to work (the drag/drop contract is generic).

## Verification
- Add/extend a mainframe test asserting the new `#mapping-clip-list` element renders,
  receives `mainframeState.clips`, and that its filter state is independent of
  `#clip-list`'s (e.g. setting a search query on one doesn't affect the other).
- Run `npm run lint && npm run test -w mainframe && npm run build -w mainframe`.

## Related
- Blocks task 249 (trim action buttons on this new list instance).
- Independent of task 250 (double-click to remove) — different files, can run in
  parallel.
- Real browser drag-and-drop confirmation is task 251 (manual/integration verification)
  — this task's own verification is component-level only.
