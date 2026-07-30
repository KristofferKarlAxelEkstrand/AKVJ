---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 185: Phase 2 — Velocity Regions with Draggable Breakpoint Handles

## Epic
`.agents/workflows/developer-team/epics/keybed-for-mapping.md`
Spec: `.agents/workflows/developer-team/spec/feature-keybed-for-mapping.md`

## Depends On
Task 184 (Phase 1 — rename `category` → `select`)

## Scope

Replace current velocity band `<button>` elements with region divs that have draggable breakpoint handles between them.

### Velocity Regions
- Each key shows stacked rectangular regions (bottom = velocity 0, top = velocity 127)
- Region filled with color swatch derived from clip identity + clip ID text where space allows
- No artificial cap on clips per key (up to 128)

### Breakpoint Handles
- Thin draggable bar between adjacent regions, spanning key width
- Hit target of at least 6–8px
- Live velocity readout (tooltip/label) while dragging
- Constrain dragging so handle cannot cross past adjacent handle (min gap = 1 velocity unit)
- On release, dispatch `mappingchange` event with `{ channel, note, oldVelocity, newVelocity, clipId }`

### Right-Click Removal
- Right-click a region to remove it
- Dispatch `mappingremove` event with `{ channel, note, clipId, velocity, mappings }`
- Remaining regions redistribute evenly across freed velocity range

### Keep Existing Logic
- Keep `buildVelocityBands` logic as base, add handle rendering, drag interaction, and removal on top

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/src/js/PianoKey.js`
- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/scss/` (styling for regions + handles)
- Tests
