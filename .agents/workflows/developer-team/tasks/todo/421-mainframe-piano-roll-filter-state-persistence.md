---
status: backlog
assignee: none
priority: medium
---

# 421 — Piano roll Filter mode: persistent filter state via localStorage

Epic: `.agents/workflows/developer-team/epics/todo/piano-roll-modes.md` (Phase 5).

Filter mode currently keeps its state in memory only. Persist active filters (clipId, layer group,
trigger type, role, "populated only" toggle) to `localStorage` so they survive page reloads within
a session. Namespace the key per pianoroll instance/context so two pianorolls on one page do not
clobber each other.

Scope: `mainframe/` piano-roll custom element only.

When done, update the "Not built yet" section of `spec/mapping.md` (currently `draft`) for this
item.

Verify: `npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
