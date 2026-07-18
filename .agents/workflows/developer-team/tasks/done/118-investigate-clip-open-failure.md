---
status: done
assignee: mainframe-developer
priority: high
---

# Task 118: Investigate Clip Editor Load Failure

## Severity: Bug / Investigation

## Summary
A user reports that opening a clip in the Mainframe clip editor is failing. This may be a real load/edit bug in the edit-clip path, or it may be bad/incomplete data in the specific clip being opened. The investigation must determine root cause before a fix is attempted.

## Acceptance Criteria
- Test opening several known-good clips from the library (with clear `meta.json` + `sprite.png`) and compare against the failing clip.
- If only the reported clip fails: inspect that clip’s `meta.json`, `sprite.png`, and `.raw-assets/` (if any); document what is malformed or missing; do **not** assume root cause.
- If multiple clips fail: treat it as a Mainframe edit-load bug and fix it against the edit-clip load path (`GET /api/clips/:id/frames`, sprite cell split, UI hydrate).
- Preserve all relevant details in the task file or a linked note.
- Add/update tests for the failure path once root cause is known.
- Verify with `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe`.

## Notes
- Related spec: `.agents/workflows/developer-team/spec/feature-edit-clip.md`
- Recent edit-clip slices: Tasks 113–117.
- Original report: `inbox/read/team-update-cant-open-clip.md`
