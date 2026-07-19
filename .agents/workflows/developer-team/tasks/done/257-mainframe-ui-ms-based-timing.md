---
status: done
assignee: qa-reviewer
priority: low
---

# Task 257: Update Mainframe UI for ms-Based Timing

## Epic
`.agents/workflows/developer-team/epics/done/timing-alignment-analysis.md` — Phase 5 (COMPLETED)

## Source
`.agents/workflows/developer-team/inbox/read/team-update-timing-alignment-tasks.md`

## Affected Files
- `mainframe/src/js/` (relevant UI components for clip editing)

## Description
Update mainframe UI to work with ms values natively instead of FPS, ensuring staging preview and all timing-related inputs use the ms-based format.

### Requirements
- Update UI to work with ms values natively
- Ensure staging preview continues to work with ms values
- Update any FPS-based inputs to use ms instead
- Maintain backward compatibility where needed

## Discrete Actions
1. Identify all UI components that use FPS-based timing inputs
2. Update inputs to use ms values
3. Update staging preview to handle ms-based timing
4. Update any display logic to show ms instead of FPS
5. Add tests for UI ms-based timing

## Verification
- `npm run lint && npm run test -w mainframe && npm run build -w mainframe`
- Test UI inputs work with ms values
- Test staging preview with ms-based timing
- Test backward compatibility scenarios

## Related
- Depends on task 256 (ms persistence)
- Lower priority, can be done after core timing work
