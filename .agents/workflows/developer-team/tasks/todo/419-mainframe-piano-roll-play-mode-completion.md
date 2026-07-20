---
status: backlog
assignee: none
priority: high
---

# 419 — Piano roll Play mode: velocity control, animation preview, playback indicator

Epic: `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md` (Phase 4 remainder).

Phase 4 Play mode is partially done — click-to-trigger note on/off works. Finish the remaining
Phase 4 items:

- **Velocity control** — map velocity to a slider (0–127) and/or click intensity (e.g. vertical
  position within the cell). Note-on must carry the chosen velocity.
- **Animation preview canvas** — small inline canvas in Play view showing the triggered clip's
  playback (or a clear link to the main renderer if that proves simpler). Start inline; do not
  over-engineer.
- **Playback indicator** — pulse or progress bar on the currently-playing cell; clear it on
  note-off / clip end.

Scope: `mainframe/` piano-roll custom element and its SCSS. No `akvj/` changes expected — trigger
via the existing MIDI-like interface / AppState events.

When done, update the "Not built yet" section of `spec/mapping.md` (currently `draft`) for these
items — the spec documents shipped behaviour, and the human owns promoting it to `approved`.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
