---
status: done
assignee: akvj-developer
priority: medium
epic: mapping
---

# Task 250: Double-click a velocity region to remove it

## Description
Add **double-click** on a velocity region as a second, additive gesture to remove a clip from a key. This is not a replacement for right-click context menu - both gestures should work.

## Implementation Details

### Current state
Today the only way to remove a clip from a key is right-click on its region (`contextmenu` → `#handleContextMenu` → `#removeRegion`, `PianoKey.js:260-268, 582-`).

### Solution approach
Register a `dblclick` listener on each region element next to the existing `pointerup`/removal wiring in `#renderRegions()` (`PianoKey.js:384-402`).

On `dblclick`:
- Call the same `#removeRegion(region)` helper the context-menu path already uses (`PianoKey.js:582`)
- Same redistribution-on-removal behavior
- Same `mappingremoverequest` → `mappingremove` event
- No new event type needed
- Use `event.stopPropagation()` on the region's `dblclick` so it doesn't bubble into the key's own click handling

### Scope
This is a `PianoKey.js` change, so it applies everywhere regions render in edit mode — not specific to the new Mapping-page clip list. No changes needed to `PianoRoll.js` or the event contract.

### Files to modify
- `akvj/src/js/visuals/PianoKey.js` - Add `dblclick` listener in `#renderRegions()`

## Dependencies
None - this is independent of tasks 248 and 249

## Success criteria
- Double-clicking a velocity region removes it
- Remaining regions on that key redistribute correctly
- Right-click context menu removal still works
- Double-click doesn't bubble into key's click handling
