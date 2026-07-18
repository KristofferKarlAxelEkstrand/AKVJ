# Team Update: Edit Clip feature spec ready

## Summary
A new product spec for **deep-linkable clip editing** is in the repo:

`.agents/workflows/developer-team/spec/feature-edit-clip.md`

It scopes the **edit entry path** on top of the existing shared clip editor ([clip-upload-edit-feature.md](../spec/clip-upload-edit-feature.md)): routing, load/hydrate (raw assets or spritesheet → frames), full settings round-trip, and save-over the same clip.

## Impact
Mainframe clip editor / routing. Create and edit stay one UI; URLs become:

- `/clip/edit` → new clip
- `/clip/edit/{clipId}` → edit that clip
- `/clip/new` → redirect to `/clip/edit`

Library Edit and post-create should land on `/clip/edit/{clipId}` so refresh and bookmarks work. Sprite-only clips must open by splitting `sprite.png` into cells.

## Action Needed
- **Team Lead:** read the spec and break it into small tasks (suggested slices are in the doc). Do not treat it as one monolithic PR.
- **Mainframe developer:** pick up when assigned; reuse existing `GET/PUT .../frames` and meta APIs where possible.

## Notes
- Spec path: `.agents/workflows/developer-team/spec/feature-edit-clip.md`
- Related: `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md`
- Out of scope in this slice: clip id rename, parallel metadata-only editor, HEIC/video
