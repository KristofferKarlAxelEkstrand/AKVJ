---
status: done
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 22a: Extract `<akvj-clip-list>` Component

## Objective
Extract the clip library list rendering from `main.js` into a reusable `<akvj-clip-list>` custom element.

## Requirements
- Move `createClipListItem()`, `renderLibrary()`, `filterClipsBySearch()`, `populateRoleFilter()`, `updateClipSummary()`, `updateFilterVisibility()` logic into the component
- Component accepts `clips` (array) and `searchQuery` / `roleFilter` via setters
- Dispatches `clipedit`, `clipdelete`, `clipmap`, `clippreview` events (bubbles: true) with clipId in detail
- Import via side-effect in `main.js`
- Replace the `<ul id="clip-list">` in HTML with `<akvj-clip-list id="clip-list"></akvj-clip-list>`
