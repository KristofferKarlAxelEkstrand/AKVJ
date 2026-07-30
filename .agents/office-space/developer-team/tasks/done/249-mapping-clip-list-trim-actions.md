---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 249: Trim Redundant Action Buttons on the Mapping-Page Clip List

## Epic
`.agents/workflows/developer-team/epics/mapping.md` — Phase 2 (depends on task 248 — do
not start until it reports done)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-mapping-epic-ready.md`
(Human feature request, epic ready for breakdown)

## Affected Files
- `mainframe/src/js/ClipInstance.js` (renders Edit / Delete / Map buttons,
  `ClipInstance.js:60-88`)
- `mainframe/src/js/ClipList.js` (passes through to `ClipInstance` children)
- Wherever the new `#mapping-clip-list` from task 248 is instantiated

## Description
`ClipInstance` currently renders Edit / Delete / Map buttons on every clip row. On the
Mapping-page copy (task 248), some of these are now redundant or out of scope.

**Resolved (Team Lead, per the epic's own reasoning — Open Question 1)**:
- **Hide the Map button** on the Mapping-page list instance. It's fully redundant now
  that drag-and-drop works directly from the same page — clicking it to jump to a
  `<select>`-based flow makes no sense when you can drag straight onto the keybed.
- **Keep Edit and Delete visible.** Editing/deleting a clip without a tab switch is a
  genuine convenience and removing functionality that already exists is a bigger change
  than this feature asks for. Do not hide them.

Add a flag to `ClipInstance` (e.g. `showMapAction`, defaulting to `true` so the Library
list's existing behavior is unchanged) that the Mapping-page list instance sets to
`false`. Do not add a generic "hide all actions" flag — only the Map button changes
visibility here.

## Discrete Actions
1. Add a `showMapAction` (or equivalently-named) flag/attribute to `ClipInstance`,
   defaulting to preserve current behavior (Map button shown) for the existing Library
   list.
2. Have the Mapping-page `#mapping-clip-list` (task 248) pass/set this flag so its
   `ClipInstance` children hide the Map button while keeping Edit and Delete.
3. Confirm the Library tab's `#clip-list` is completely unaffected (Map button still
   shown there).

## Verification
- Add a test asserting `ClipInstance` hides its Map button when the new flag is set, and
  still shows it by default (Library list behavior unchanged).
- Run `npm run lint && npm run test -w mainframe && npm run build -w mainframe`.

## Related
- Depends on task 248 (the list instance this applies to must exist first).
- Independent of task 250 (double-click to remove) — different files, can run in
  parallel with it.
