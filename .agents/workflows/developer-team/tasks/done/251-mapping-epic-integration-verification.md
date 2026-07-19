---
status: done
assignee: qa-reviewer
priority: low
---

# Task 251: Mapping Clip-Library Panel — Cross-Cutting Integration Verification

## Epic
`.agents/workflows/developer-team/epics/mapping.md` — Phase 4 (depends on tasks 248,
249, and 250 all reporting done — this is the closing phase)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-mapping-epic-ready.md`
(Human feature request, epic ready for breakdown)

## Description
The epic's own Phase 4 asks for manual verification: drag a clip from the new list onto
a key, confirm the mapping table updates; double-click a region and confirm removal +
redistribution; confirm the new list's filter state doesn't leak to/from the Library
tab; confirm the sticky dock still works with the taller page.

**Container note**: per this repo's devcontainer limitations, there is no Chromium
available in-container for literal browser-driven drag-and-drop testing — that requires
the host machine (see `AGENTS.md` "Development Container" section). Do the following
instead, in-container:

1. Add/confirm a jsdom integration test that dispatches synthetic `dragstart` (on a
   `ClipInstance` in `#mapping-clip-list`) → `dragover`/`drop` (on a region in
   `#mapping-piano-roll`) and asserts a `mappingadd` event fires with the expected
   detail — exercising the same code path a real drag would, the way existing
   `ClipInstance`/`PianoKey` drag-drop tests already do for the Library list.
2. Confirm the `dblclick`-removal test from task 250 and the independent-filter-state
   test from task 248 both pass as part of the same full mainframe test run (not just in
   isolation) — i.e. run the full suite once all three tasks have landed, not just each
   task's own new tests.
3. Visually inspect (read, don't render) `PianoRoll.scss` / the updated `index.html` to
   confirm no CSS conflicts between the new clip list and `.piano-roll-dock`'s
   `position: sticky` — e.g. no unintended `overflow: hidden` ancestor now wrapping the
   dock.
4. Flag in your report to the Team Lead that a human/host-browser pass is still needed
   to visually confirm the drag interaction and sticky-scroll behavior, same caveat
   already noted for the keybed-for-mapping epic's Phase 4 sticky positioning.

## Discrete Actions
1. Run the full mainframe test suite after tasks 248, 249, and 250 have all landed.
2. Add the synthetic drag-and-drop integration test described above if one doesn't
   already exist.
3. Do the CSS/layout read-through described above.
4. Report status, explicitly noting the host-browser verification gap.

## Verification
`npm run lint && npm run test -w mainframe && npm run build -w mainframe` — full suite,
not scoped to one file.

## Related
- Depends on tasks 248, 249, and 250 — do not start until all three report done.
- Closes out `epics/mapping.md` once done (update the epic's status).
