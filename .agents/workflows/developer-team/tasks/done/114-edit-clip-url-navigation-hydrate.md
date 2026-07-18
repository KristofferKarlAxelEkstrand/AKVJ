---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 114: Edit Clip — Library Edit + URL-Driven Hydrate/Reset

## Severity: Feature

## Summary
Wire the library "Edit" action and the post-create success flow to navigate to `/clip/edit/:clipId`. Make the editor hydrate from the URL clip id on load and reset cleanly for new mode.

## Acceptance Criteria
- Library "Edit" navigates to `/clip/edit/{clipId}` instead of `/clip/new`.
- After a successful create, replace the URL with `/clip/edit/{clipId}` so refresh stays in edit mode.
- On route match with `clipId`, call the existing load path (`GET /api/clips/:clipId/frames`) and populate the editor.
- On route match without `clipId`, clear editor state (empty frames, generated clip id, default settings).
- If `clipId` is malformed or missing, show a clear status error and fall back to new-clip chrome; do not silently create a different clip.
- Add/update tests for navigation, hydrate, and invalid-id fallback.
- Verify with `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe`.

## Notes
- Depends on Task 113 (dynamic routes).
- Reuses `GET /api/clips/:clipId/frames` and existing frame load APIs.
