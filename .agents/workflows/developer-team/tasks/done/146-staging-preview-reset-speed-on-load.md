---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 146: Staging Preview Doesn't Reset Playback Speed on New `loadFrames()`

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-preview-default-1x.md`
Follow-up to: `.agents/workflows/developer-team/inbox/read/question-editor-playback-speed-default.md`
(Team Lead's earlier confirmation)

## Reconciling the Earlier "Already Correct" Answer
Team Lead's earlier check was accurate but incomplete: `#playbackSpeed = 1` is the correct
**initial** field default, and the `1×` `<option>` is correctly marked `selected` on first
`#render()` (`StagingPreview.js:174-187`) — so the **very first** preview a user ever sees
does open at 1x. The gap: **`loadFrames()` never resets speed on subsequent loads.**

`loadFrames()` (`StagingPreview.js:58-70`) explicitly resets `#currentFrame`, `#shuffleState`,
`#pingpongState`, `#playbackMode`, `#scaleMode`, `#frameRate`, and `#frameDurationsMs` for
every new set of staged frames — but does **not** reset `#playbackSpeed` or the `#speedSelect`
DOM value. So once a user picks e.g. 2× for one clip, every clip/reset they load afterward in
the same editor session keeps playing at 2× — this is what's actually being observed live,
not a first-paint issue. Confirmed by grep: `#playbackSpeed` is never touched anywhere in
`loadFrames()` or its reset block.

## Fix
In `loadFrames()`, alongside the existing resets, also reset `#playbackSpeed = 1` and set
`#speedSelect.value = '1'` (guarding for the case `#speedSelect` isn't rendered yet, same
pattern already used for `#frameLabel`/`#scrubSlider` null checks in the method).

## Suggested Tests
- `StagingPreview` test: set speed to 2× via the select, call `loadFrames()` again with a new
  set of frames, assert speed reads back to 1× (both the internal playback rate and the
  select's DOM value).
