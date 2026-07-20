---
type: feature
from: human
created: 2026-07-20T17:49:30.815Z
---

# Team Update: Piano Roll Modes — implementation status

The piano-roll-modes epic (`epics/todo/piano-roll-modes.md`) is **largely implemented**. Phases 1–3 are complete and Phase 4 (Play mode) is partially done — click-to-trigger note on/off works. A spec already exists at `spec/mapping.md` covering the shipped behaviour.

**Remaining work from the epic:**
- Play mode: velocity slider/click intensity, animation preview canvas, playback indicator (pulse/progress bar)
- Phase 5 polish: keyboard shortcuts, persistent filter state (localStorage), undo/redo, batch cell selection, drag-and-drop reorder across notes, BPM sync indicator, lazy rendering for large grids

Action: Pick up the remaining Play mode and Phase 5 items as prioritised tasks. The spec (`mapping.md`) already documents what's shipped — update its "Not built yet" section as items land.
