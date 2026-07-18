# Team Update: Clip editor hint text — what does this even refer to?

## Summary
This hint sits at the bottom of the clip editor form in `mainframe/src/index.html`:

> Frame size is the spritesheet cell size (default 240×135). Live AKVJ playback still draws into 240×135. Add images append; use Clear frames to replace. Bit depth is for bitmask clips only.

**What does it even refer to on the clip editor?** It reads like a pile of unrelated notes (frame size, live playback scaling, append vs Clear frames, bit depth) parked next to “Frame duration beats,” not next to the controls it talks about.

## Impact
Users (and us) get a vague footer tip that doesn’t clearly attach to any one field. Some of it may also be outdated soon if non-240×135 live sizes / pattern / placement land.

## Action Needed
- Clarify or rewrite: either tie each sentence to the control it belongs next to, or remove the grab-bag hint.
- Decide what still needs saying at all once frame size / live draw behavior is respec’d.

## Notes
- Source: `mainframe/src/index.html` — `<p class="hint">` just above the create/save submit button.
- Related inbox: `request-clip-size-pattern-placement-whole-pixels.md` (live size may no longer always be 240×135).
