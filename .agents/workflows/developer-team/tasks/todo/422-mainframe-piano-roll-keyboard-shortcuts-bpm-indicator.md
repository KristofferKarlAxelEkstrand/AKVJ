---
status: backlog
assignee: none
priority: low
---

# 422 — Piano roll Play mode: keyboard shortcuts + BPM sync indicator

Epic: `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md` (Phase 5).

Phase 5 polish for Play mode:

- **Keyboard shortcuts** — map a QWERTY row (or similar) to note rows so the pianoroll is playable
  from the keyboard. Decide the layout in the task body; keep it discoverable (tooltip or help
  affordance).
- **BPM sync indicator** — when a triggered clip is beat-synced, show a tempo/beat indicator in
  Play view tied to the current BPM source.

Scope: `mainframe/` piano-roll custom element and SCSS only.

When done, update the "Not built yet" section of `spec/mapping.md` (currently `draft`) for these
items.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
