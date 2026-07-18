---
status: done
assignee: mainframe-developer
priority: high
---

# Task 186: Phase 3 — Drag-and-Drop from Clip List + Auto-Breakpoint Distribution

## Epic
`.agents/workflows/developer-team/epics/keybed-for-mapping.md`
Spec: `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`

## Depends On
Task 185 (Phase 2 — velocity regions with handles)

## Scope

### Clip List Draggable Entries
- `<akvj-clip-list>` entries set `draggable="true"`
- `dragstart` dispatches with `clipId` in `dataTransfer`

### Piano Key Drop Handling
- Piano keys accept `dragover` (prevent default to allow drop) and `drop` events
- On drop, dispatch `mappingadd` event with `{ clipId, note, channel, velocity, mappings }`
- `mappings` is the full redistributed list of `{ clipId, velocity }` entries for that note+channel

### Auto-Breakpoint Distribution
- 1 clip → full key (velocity 0–127)
- 2 clips → split 50/50 (breakpoint at 64)
- 3 clips → thirds (breakpoints at 42 and 85)
- N clips → `round(128 * i / N)`
- Drop Y position determines insertion index in the stack (not just append)
- After insertion, redistribute all breakpoints evenly

### Keep Existing Form
- The form-based "Add / update" button stays as a fallback for precise manual entry

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/src/js/PianoKey.js`
- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/js/ClipList.js` (or equivalent clip list component)
- Tests
