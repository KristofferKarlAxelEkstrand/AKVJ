---
status: done
assignee: akvj-developer
priority: medium
---

# Task 122: Merge `ClipLoader.js` Setup Paths

## Severity: Refactor

## Summary
Collapse the two nearly identical clip-setup paths in `akvj/src/js/visuals/ClipLoader.js` and move project resolution out of the loader.

## Acceptance Criteria
- Merge `setupClips()` and `setupClipsFromProject()` into a single `#loadClipsFromKeyMap(url)` helper.
- Extract a small `ProjectCatalog` helper for `fetchActiveProjectId`, `fetchProjectsIndex`, and `buildProjectKeyMapUrl` so `ClipLoader` focuses on loading, not project resolution.
- Reuse the shared `normalizeClipMetadata` from Task 119 once it lands.
- Verify `npm run lint`, `npm run test -w akvj`, and `npm run build -w akvj` pass.

## Notes
- Aligns with the Projects direction in `spec/goal.md`.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §A2.
