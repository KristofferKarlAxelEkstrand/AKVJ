---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: medium
created: 2026-07-30
owned_paths:
  - mainframe/src/js/PianoRoll.js
  - mainframe/src/scss/PianoRoll.scss
  - mainframe/test/PianoRoll.test.js
verification_tier: integration
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 422 — Piano roll Play mode: keyboard shortcuts + BPM sync indicator

Epic: `.agents/office-space/developer-team/epics/todo/piano-roll-modes.md` (Phase 5).

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
