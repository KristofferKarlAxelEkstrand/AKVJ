---
status: done
assignee: mainframe-developer
priority: medium
epic: mapping
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 248: Mount `<akvj-clip-list>` on the Mapping panel

## Description
Add `<akvj-clip-list id="mapping-clip-list">` (+ its own search/sort/role-filter controls) to `index.html` inside `#panel-mapping`, above `.piano-roll-dock`. Wire `mainframeState.clips` the same way `renderLibrary()` does today.

## Implementation Details

### Layout
Position the new clip list between the mapping table and the sticky piano roll dock:
```
#panel-mapping
├─ panel-head (Reload / Save / Run pipeline — unchanged)
├─ hint: active project + DAW channel numbering note
├─ <akvj-mapping-table>            existing mappings, remove buttons
├─ <akvj-clip-list id="mapping-clip-list">   NEW — draggable source
├─ manual add form (Channel/Note/Velocity/Clip select + Add/update)  kept as fallback
├─ mapping-status
└─ .piano-roll-dock (sticky bottom)
   ├─ #mapping-piano-roll (edit)
   └─ #play-piano-roll (play/test)
```

### Data wiring
Mirror what `renderLibrary()` already does for `#clip-list`:
```js
mappingClipListElement.clips = mainframeState.clips;
```

### Filter/search scope
Reuse the existing search/sort/role-filter UI pattern from the Library panel's `panel-actions` above the new list. Use independent filter state - do not share `mainframeState.searchQuery` between the two lists.

### Files to modify
- `mainframe/src/index.html` - Add the clip list element and filter controls to `#panel-mapping`
- `mainframe/src/js/AkvjMainframe.js` - Wire up the new clip list instance with `mainframeState.clips`

### Expected changes
- No changes to `PianoKey.js` / `PianoRoll.js` expected - this is page composition only
- The drag-and-drop mechanism should work with zero changes since `ClipInstance` → `PianoKey` wiring is generic

## Dependencies
None - this is the first task in the epic

## Success criteria
- `<akvj-clip-list>` renders on the Mapping panel
- List displays clips from `mainframeState.clips`
- Search/sort/role-filter controls work independently from Library tab
- Layout doesn't break the sticky dock (list scrolls, dock stays pinned)
