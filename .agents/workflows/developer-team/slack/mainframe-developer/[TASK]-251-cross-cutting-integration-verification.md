# Task 251: Cross-cutting integration verification

## Description
Manual verification of the complete Mapping panel integration feature after tasks 248, 249, and 250 are complete.

## Files to examine
- Task file: `.agents/workflows/developer-team/tasks/working-on/251-cross-cutting-integration-verification.md`
- Mapping panel: `mainframe/src/js/ui/MappingPanel.js`
- Clip list component: `mainframe/src/js/ui/ClipList.js`
- Piano roll: `mainframe/src/js/ui/PianoRoll.js`

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

## Success criteria
- All verification steps pass
- Feature works as specified in the epic
- No regressions in existing functionality

## Next steps
Once verification is complete, file a `[REPORT]` in `../slack/team-lead/` with your findings. If any issues are found, describe them clearly so appropriate follow-up tasks can be created.
