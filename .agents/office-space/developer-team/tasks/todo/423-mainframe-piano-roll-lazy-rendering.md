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
# 423 — Piano roll: lazy rendering for large grids

Epic: `.agents/office-space/developer-team/epics/todo/piano-roll-modes.md` (Phase 5).

The pianoroll currently renders the full grid up front. For mappings with 100+ placements (or when
the grid is scrolled/zoomed), render only the visible viewport and recycle off-screen cells. Keep
the existing DOM-grid approach; only switch to canvas if DOM recycling proves insufficient and the
human agrees.

Scope: `mainframe/` piano-roll custom element only.

When done, update the "Not built yet" section of `spec/mapping.md` (currently `draft`) for this
item.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`. Add a perf
regression guard if one does not exist (e.g. a test that renders a large mapping and asserts the
visible-cell count).
