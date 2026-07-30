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

# Task 250: Double-Click a Velocity Region to Remove It (`PianoKey.js`)

## Epic
`.agents/workflows/developer-team/epics/mapping.md` — Phase 3 (independent — can ship
before, in parallel with, or after tasks 248/249)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-mapping-epic-ready.md`
(Human feature request, epic ready for breakdown)

## Affected Files
- `mainframe/src/js/PianoKey.js` (`#renderRegions()` at `PianoKey.js:384-402`,
  `#removeRegion()` at `PianoKey.js:582`, right-click removal at
  `PianoKey.js:260-268`)

## Description
Today the only way to remove a clip from a key is right-click on its region
(`contextmenu` → `#handleContextMenu` → `#removeRegion`). Add **double-click** on a
region as a second, additive gesture that does the same thing — right-click stays
unchanged, this is purely an additional discoverability path (some trackpads make
right-click/context-menu awkward).

- Register a `dblclick` listener on each region element next to the existing
  `pointerup`/removal wiring in `#renderRegions()`.
- On `dblclick`, call the same `#removeRegion(region)` helper the context-menu path
  already uses — same redistribution-on-removal behavior, same `mappingremoverequest` →
  `mappingremove` event, **no new event type**.
- Call `event.stopPropagation()` on the region's `dblclick` handler so it doesn't bubble
  into the key's own click handling.
- Scope: this is a `PianoKey.js`-only change. It applies everywhere regions render in
  edit mode — not specific to the new Mapping-page clip list from tasks 248/249. No
  changes needed to `PianoRoll.js` or the event contract; `mappingremove`'s detail shape
  is unchanged.

## Discrete Actions
1. Add a `dblclick` listener per region in `#renderRegions()`.
2. Wire it to the existing `#removeRegion(region)` helper (same path as right-click).
3. `event.stopPropagation()` in the handler.
4. Confirm right-click removal still works unchanged (additive, not a replacement).

## Verification
- Add a test dispatching `dblclick` on a rendered region and asserting `#removeRegion`
  fires, remaining regions redistribute, and `mappingremove` dispatches with the same
  detail shape as the existing right-click test.
- Confirm existing right-click removal tests still pass unmodified.
- Run `npm run lint && npm run test -w mainframe && npm run build -w mainframe`.

## Related
- Independent of tasks 248/249 — different file, no shared code path.
- Covered by task 251's final cross-cutting verification once all three land.
