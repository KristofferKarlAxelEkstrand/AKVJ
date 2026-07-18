---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 117: Edit Clip — Expose Remaining Meta Fields in Shared Editor

## Severity: Feature (Follow-up)

## Summary
Expose the remaining clip meta fields in the shared editor once it has controls for them, and ensure they round-trip on edit: `retrigger`, `triggerType`, `triggerGroup`, `bitDepth` (bitmask clips), and `frameDurationBeats`.

## Acceptance Criteria
- Add UI controls to the shared editor for `retrigger`, `triggerType`, `triggerGroup`, `bitDepth`, and `frameDurationBeats` (only if not already present).
- Hydrate these fields from `meta.json` when editing an existing clip.
- Write them back to `meta.json` on save without inventing values the user never saw.
- Do not store UI-only chrome in `meta.json`.
- Add/update tests for remaining field round-trip.
- Verify with `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe`.

## Notes
- Follow-up to Task 116; only start once the core edit path is working.
- `bitDepth` applies only to bitmask clips.
