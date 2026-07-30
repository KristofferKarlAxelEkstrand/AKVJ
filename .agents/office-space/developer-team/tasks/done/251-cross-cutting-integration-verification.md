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

# Task 251: Cross-cutting integration verification

## Description
Manual verification of the complete feature after tasks 248, 249, and 250 are complete.

## Verification Steps

### Drag-and-drop mapping
- Drag a clip from the new Mapping-page list onto a key on `#mapping-piano-roll`
- Confirm `mappingadd` fires and the mapping table updates
- Verify the clip appears in the correct velocity region

### Double-click removal
- Double-click an existing velocity region
- Confirm it's removed and remaining regions on that key redistribute
- Verify the mapping table updates correctly

### Filter state independence
- Confirm the new list's filter state doesn't leak into/from the Library tab
- Test search, sort, and role-filter on both instances independently

### Layout verification
- Confirm layout doesn't break the sticky dock
- Verify the list scrolls while the dock stays pinned
- Check that the layout works at different viewport sizes

### Action buttons
- Verify Map button is hidden on Mapping-page list
- Verify Map button remains visible on Library tab
- Confirm Edit/Delete buttons work on both instances

## Dependencies
Depends on tasks 248, 249, and 250

## Success criteria
- All verification steps pass
- Feature works as specified in the epic
- No regressions in existing functionality
