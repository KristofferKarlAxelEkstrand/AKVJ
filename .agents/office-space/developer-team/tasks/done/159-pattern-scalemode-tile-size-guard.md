---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 159: `scaleMode: "pattern"` Has No Minimum Tile-Size Guard (60fps Risk)

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-pattern-scalemode-no-minimum-tile-size-guard.md`
(read the original for full detail — condensed below).

## Related
Distinct from Task 157 (validator currently *rejects* `scaleMode: "pattern"` outright, which
today accidentally makes this path unreachable). This ticket is the gap that's exposed the
moment 157 ships and pattern clips can actually go live. Not blocking on 157, but land in the
same wave if possible.

## Problem
`akvj/src/js/visuals/Clip.js:257-267` (`#drawPattern()`) tiles the current frame across the
240×135 canvas with a nested loop bounded only by `canvasWidth`/`canvasHeight` ÷
`tileWidth`/`tileHeight` — no cap on iteration count. A small authored tile (an 8×8 or 4×4
texture, which is pattern mode's actual intended use case, not just a malformed-metadata edge
case) already produces 500–2,000+ `drawImage()` calls per frame, per clip, every render tick.
AKVJ can have multiple pattern clips active across Layer Groups A/B/C simultaneously. No
existing test (`akvj/test/Clip.test.js`'s pattern-mode tests use large 60×45 tiles) covers the
small-tile/high-draw-count case.

## Fix (this task's scope: the render-loop guard, akvj-side)
Defensively cap iteration count in `#drawPattern()` itself — e.g. skip/clamp if
`tileWidth`/`tileHeight` would produce more than some sane number of tiles per frame. This
matches the existing "never crash/stall the render loop over bad metadata" precedent already
established for `clipMetadata.js`'s sync-timing fallbacks. Pick a defensible cap and name it as
a constant (e.g. `MAX_PATTERN_TILES_PER_FRAME`) rather than a bare magic number.

**Optional, separate scope — do not block this task on it:** a companion minimum-tile-size
validation in `mainframe/scripts/clips/lib/validate/image.js` (reject derived
`frameWidth`/`frameHeight` below a floor, e.g. 4px) would give authors a clear `npm run clips`
error instead of relying on the runtime clamp alone. If this feels natural to add in the same
pass, fine — otherwise leave it as a future mainframe-side ticket; the render-loop cap alone
is sufficient to close the immediate 60fps risk.

## Suggested Tests
- `akvj/test/Clip.test.js`: a pattern-mode clip with a very small tile (e.g. 4×4 or 8×8 on the
  240×135 canvas) does not exceed the chosen draw-call cap, and still renders something
  reasonable (doesn't silently blank the canvas).
- Existing large-tile pattern tests continue to pass unchanged (no behavior change for the
  common case).

## Files
- `akvj/src/js/visuals/Clip.js` (`#drawPattern()`, ~lines 257-267)
- `akvj/test/Clip.test.js`
