---
status: done
assignee: mainframe-developer
priority: low-medium
---

# Task 235: Velocity-Breakpoint Drag Constraint Can Invert, Producing Duplicate/Colliding Velocities on One Key

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-pianokey-breakpoint-drag-inverts-with-many-clips-on-one-key.md`

## Affected Files
- `mainframe/src/js/PianoKey.js` — `redistributeVelocities()` (lines 73-82), `#startHandleDrag()` (415-461, esp. 425-426), `#handlePointerMove()` (466-490), `#handleDrop()` (285-320)

## Description
This is the exact risk the feature's own draft spec flagged as an unresolved **Open Question** (`drafts/feature-keybed-for-mapping.md`, since promoted into Tasks 184-188): *"Maximum clips per key: Is there a practical limit?... Consider a minimum region height and refuse drops that would violate it."* The shipped implementation (Task 185/186) doesn't address it.

`redistributeVelocities()` spreads N clips evenly across 0-127 via `Math.round(128 * index / count)` with **no cap on `count`**, and `#handleDrop()` never rejects a drop for having too many existing clips on the key. Once a key has enough mapped clips that two adjacent bands round to velocities less than `2 * MIN_VELOCITY_GAP` (`MIN_VELOCITY_GAP = 1`) apart — starts happening around ~65 clips on one key — `#startHandleDrag()`'s clamp bounds invert:

```js
const minVelocity = lower.velocity + MIN_VELOCITY_GAP;
const maxVelocity = next ? next.velocity - MIN_VELOCITY_GAP : VELOCITY_RANGE - 1;
```

If `next.velocity - lower.velocity < 2`, then `minVelocity > maxVelocity`. In `#handlePointerMove()`:

```js
const liveVelocity = Math.min(this.#dragState.maxVelocity, Math.max(this.#dragState.minVelocity, rawVelocity));
```

`Math.max(minVelocity, raw)` is always `>= minVelocity`, so `Math.min(maxVelocity, that)` always collapses to `maxVelocity` — the handle silently pins at a value that is **less than `lower.velocity + 1`**, i.e. at or below the *lower* band's own velocity. Committing that drag (`#endDrag`) then dispatches `mappingchangerequest` with a `newVelocity` that duplicates (or crosses) the adjacent band's velocity, producing two mapping entries at the same (or inverted) velocity for one note/channel — an ambiguous mapping the rest of the pipeline (`mappingLeaf.js`, `mappingService`, the akvj runtime's velocity-band lookup) has no defined behavior for, since nothing anywhere validates velocity uniqueness per key.

## Discrete Actions
Either (or both, per the draft spec's own suggestion):
1. In `#handleDrop()`, refuse the drop (or clamp/reject) once the key's existing clip count would push the evenly-redistributed gap below some minimum (e.g. `128 / (count+1) < MIN_REGION_VELOCITY`).
2. In `#startHandleDrag()`, guard against `minVelocity > maxVelocity` — either disable dragging that handle entirely when the gap is already at the minimum, or clamp both bounds to a single valid value instead of producing an inverted range.

## Verification
- Add test for edge case with many clips on one key
- Run `npm run lint`, `npm run test -w mainframe`, `npm run build -w mainframe`

## Related
- Very unlikely in normal use (needs dozens of clips mapped to one note/channel), but it's a real data-integrity bug with no safety net anywhere downstream
- Part of keybed epic (Tasks 184-188)
