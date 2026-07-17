# [ARCHITECTURE] ClipList search does not search clip name

## Location
`mainframe/src/js/ClipList.js:109-121`

## Description
The `#filterClips` method searches by `clipId` and `role` but does not search by clip `name`. Since the UI displays `meta.name` as the primary title, users naturally expect search to match clip names. A clip named "Explosion" with clipId "c1-n5-v0" will not match a search for "explosion".

## Impact
Users cannot find clips by their display name, only by their internal clipId or role. This is a UX inconsistency between what's displayed and what's searchable.

## Suggested Fix
Add `clip.meta.name` to the search filter:
```javascript
const nameMatch = (clip.meta.name || '').toLowerCase().includes(this.#searchQuery);
return clipIdMatch || roleMatch || nameMatch;
```
