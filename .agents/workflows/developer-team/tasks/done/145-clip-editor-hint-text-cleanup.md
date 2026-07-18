---
status: done
assignee: mainframe-developer
priority: low
---

# Task 145: Split the Grab-Bag Clip Editor Hint Into Per-Field Hints

## Source
User question: `.agents/workflows/developer-team/inbox/read/question-clip-editor-hint-text.md`

## Current State
`mainframe/src/index.html:137` — a single `<p class="hint">` sitting just above the submit
button, unrelated to any one control:
> "Frame size is the spritesheet cell size (default 240×135). Live AKVJ playback still draws
> into 240×135. Add images append; use Clear frames to replace. Bit depth is for bitmask
> clips only."

Each clause actually belongs near a different control:
1. "Frame size is the spritesheet cell size..." → Width/Height fields (`index.html:71-79`)
2. "Live AKVJ playback still draws into 240×135." → same Width/Height area — **but this claim
   is exactly what Task 141 (spec: pattern/placement/non-default sizes) may change**
3. "Add images append; use Clear frames to replace." → drop-zone / file-list area
   (`index.html:42-46`) and the `#clip-frames-clear` button (`index.html:38`)
4. "Bit depth is for bitmask clips only." → the `#upload-bit-depth-field` label
   (`index.html:123-131`, already conditionally hidden unless `role: bitmask`)

## Requirement
- Split the single grab-bag hint into small hints placed next to the control each clause
  actually describes (clauses 1, 3, 4 above) — remove the combined footer paragraph.
- **Leave clause 2 ("live playback still draws into 240×135") worded as-is for now** — it's
  still accurate today. Don't try to pre-empt Task 141's outcome. Just make sure it's
  physically placed next to Width/Height (with clause 1) so it's at least attached to the
  right control, and leave a short code comment noting it needs revisiting once Task
  141/142 land (they may change what's true here).
- Update `.agents/workflows/developer-team/spec/feature-edit-clip.md` if it documents this
  hint text verbatim.

## Suggested Tests
- If any existing test asserts the old combined hint text, update it to match the new
  per-field hints.

## Files
- `mainframe/src/index.html`
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` (if applicable)
