---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 189: Fix Velocity-Breakpoint Drag Inversion with Many Clips on One Key

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-pianokey-breakpoint-drag-inverts-with-many-clips-on-one-key.md`

## Epic
`.agents/workflows/developer-team/epics/keybed-for-mapping.md` (follow-on hardening for Phases 2/3 — Tasks 185/186)

## Where
- `mainframe/src/js/PianoKey.js` — `redistributeVelocities()` (lines 73-82), `#startHandleDrag()` (415-461, esp. 425-426), `#handlePointerMove()` (466-490), `#handleDrop()` (285-320).

## Problem
`redistributeVelocities()` spreads N clips evenly across 0-127 via `Math.round(128 * index / count)`
with no cap on `count`, and `#handleDrop()` never rejects a drop for having too many existing clips
on the key. Once a key has enough mapped clips that two adjacent bands round to velocities less than
`2 * MIN_VELOCITY_GAP` (`MIN_VELOCITY_GAP = 1`) apart — starts happening around ~65 clips on one key —
`#startHandleDrag()`'s clamp bounds invert:

```js
const minVelocity = lower.velocity + MIN_VELOCITY_GAP;
const maxVelocity = next ? next.velocity - MIN_VELOCITY_GAP : VELOCITY_RANGE - 1;
```

If `next.velocity - lower.velocity < 2`, then `minVelocity > maxVelocity`. In `#handlePointerMove()`,
`Math.min(maxVelocity, Math.max(minVelocity, rawVelocity))` always collapses to `maxVelocity`, which
is `< lower.velocity + 1`. Committing that drag dispatches a `mappingchangerequest` with a
`newVelocity` that duplicates (or crosses) the adjacent band's velocity — an ambiguous mapping nothing
downstream validates (`mappingLeaf.js`, `mappingService`, the akvj runtime's velocity-band lookup).

## Suggested Fix
Either (or both, per the feature's own draft spec):
1. In `#handleDrop()`, refuse the drop (or clamp/reject) once the key's existing clip count would push
   the evenly-redistributed gap below some minimum (e.g. `128 / (count+1) < MIN_REGION_VELOCITY`).
2. In `#startHandleDrag()`, guard against `minVelocity > maxVelocity` — either disable dragging that
   handle entirely when the gap is already at the minimum, or clamp both bounds to a single valid
   value instead of producing an inverted range.

## Priority
Low-medium — very unlikely in normal use (needs dozens of clips mapped to one note/channel), but it's
a real data-integrity bug with no safety net anywhere downstream.

## Additional context (Test Marshal, 2026-07-18)
`.agents/workflows/developer-team/inbox/read/[TEST]-pianokey-vacuous-noop-test-and-gaps.md` — the
existing test `mainframe/test/PianoRoll.test.js:423-466` ("edit mode handle drag is a no-op when
neighboring breakpoints leave no valid gap") is **vacuous**. It uses mappings `30, 30, 31` and only
passes because `maxVelocity` happens to algebraically equal `oldVelocity` for that specific data, not
because any guard exists — it currently reads as if this bug were already handled, and it is not.

As part of this fix: rewrite that test with mapping data where `oldVelocity !== maxVelocity` under the
same inverted-range condition (e.g. three-way tie `velocity: 30, 30, 30`, dragging handle index 1 —
`minVelocity=31`, `maxVelocity=29`, `oldVelocity=30`) so it actually exercises the inversion path and
fails without your fix / passes with it. Don't leave the old vacuous assertion in place.
