---
status: backlog
assignee: none
priority: low
---

# Task 153: Delete Dead `mainframeState.category` / `EVENT_CATEGORY_CHANGED`

## Source
Consolidated from mainframe refactor audit (Task 151):
`.agents/workflows/developer-team/inbox/read/team-update-mainframe-refactor-audit.md`
(priority #2).

## Finding
`mainframeState.category` + `EVENT_CATEGORY_CHANGED` are never set in production — `main.js`
never assigns them. `ClipList.category` is only exercised in tests. The piano roll's
"category" mode actually filters via `searchQuery`, not this event/state. This is confirmed
dead code per the audit.

## Requirement
Delete `category` / `EVENT_CATEGORY_CHANGED` from `mainframeState.js` and any references
(including the test-only `ClipList.category` usage, if it has no other purpose). Verify no
other consumer exists before deleting (re-check the audit's claim against current state — grep
for `EVENT_CATEGORY_CHANGED`/`\.category\b` across `mainframe/src/`).

If it turns out something *does* still want category filtering wired end-to-end (piano →
state → list), that's a product decision, not a refactor — flag it back rather than wiring it
speculatively. Default assumption per the audit: delete.

## Files
- `mainframe/src/js/mainframeState.js`
- `mainframe/src/js/ClipList.js` (if `.category` becomes fully unused after deletion)
- Any test files exercising the deleted state/event
