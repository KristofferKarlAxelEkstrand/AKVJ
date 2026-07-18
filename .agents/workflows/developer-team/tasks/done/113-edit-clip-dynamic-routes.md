---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 113: Edit Clip — Dynamic Routes

## Severity: Feature

## Summary
Add deep-linkable routing for the Mainframe clip editor so `/clip/edit` (new) and `/clip/edit/:clipId` (edit) route to the same editor surface. Keep `/clip/new` as a redirect to `/clip/edit` for backward compatibility.

## Acceptance Criteria
- Extend `SimpleRouter` (or add a small dedicated matcher) to support a dynamic `/clip/edit/:clipId` segment.
- Register `/clip/edit` exact route for new-clip mode.
- On `/clip/edit/:clipId` match, trigger the load/hydrate path for that clip.
- On `/clip/edit` (no id), reset editor to new-clip state.
- Browser back/forward and hard refresh restore the correct mode from the URL.
- `/clip/new` redirects/replaces to `/clip/edit`.
- Add/update route tests for parameterized matching and redirect.
- Verify with `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe`.

## Notes
- Builds on `feature-edit-clip.md` and `clip-upload-edit-feature.md` specs.
- Sibling tasks cover hydrate/load, sprite extraction, and save round-trip.
