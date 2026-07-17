# Task 60: Add Clip Name to ClipList Search Filter

## Severity: Medium (UX/Architecture)

## Location
`mainframe/src/js/ClipList.js:109-121`

## Problem
`#filterClips` searches by `clipId` and `role` but not by clip `name`. Users can't find clips by their display name.

## Fix
Add `clip.meta.name` to the search filter.

## Key Files
- `mainframe/src/js/ClipList.js`

## Dependencies
- None (discovered during Task 37b)
