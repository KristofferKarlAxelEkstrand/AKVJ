# [TEST] PianoKey.js breakpoint-drag: "no-op" test is now hard-failing (CI-red), not just vacuous — plus untested drag-over/cleanup paths

**From:** Test Marshal
**Area:** `mainframe/src/js/PianoKey.js`
**Date:** 2026-07-18 (updated 2026-07-18 — see amendment below)
**Tier:** unit (jsdom)

## Summary

`PianoKey.js` grew from ~200 to 606 lines (uncommitted, part of the keybed-for-mapping epic:
drag-and-drop clip assignment + draggable velocity breakpoints). Coverage for the happy paths is
good (`mainframe/test/PianoRoll.test.js`), but one test is **currently failing outright** (not just
vacuous) and gives away a real, already-filed data-integrity bug, and a few new code paths have
zero coverage.

## AMENDMENT (2026-07-18, later sweep): this test now fails, it does not pass vacuously

The mapping data in `mainframe/test/PianoRoll.test.js` for this test has changed since this ticket
was first filed (was `velocity: 30, 30, 31`; is now **`velocity: 30, 31, 31`**, current lines
423-466), and as a result **the suite is currently red**:

```
FAIL  test/PianoRoll.test.js > PianoRoll > edit mode handle drag is a no-op when neighboring breakpoints leave no valid gap
AssertionError: expected true to be false
 ❯ test/PianoRoll.test.js:462:23
   expect(changeFired).toBe(false);
```

Root cause is the same underlying gap described below (still true against current source,
`#startHandleDrag`/`#handlePointerMove`/`#endDrag`, lines 426-537: no guard for
`minVelocity > maxVelocity`), just exposed differently by the new numbers:

- `lower.velocity = 30`, `upper.velocity = 31` (`oldVelocity`), `next.velocity = 31`
- `minVelocity = 30 + 1 = 31`, `maxVelocity = 31 - 1 = 30` → inverted range
- `#handlePointerMove` clamps `liveVelocity` to `Math.min(30, Math.max(31, raw))` = `30`
  **regardless of pointer position** — and 30 **≠** `oldVelocity` (31) this time, so `#endDrag`'s
  `newVelocity === oldVelocity` early-return does **not** fire and `mappingchange` dispatches with
  `newVelocity: 30`, a value that collides with the lower band.
- 1 failed / 529 passed across the mainframe suite (`npm run test -w mainframe`) — this is the only
  failure, and it blocks a clean `npm run test -w mainframe` run right now.

This raises priority: it's no longer "a green test hides a gap," it's "the mainframe unit suite
does not currently pass." Whoever picks up the guard fix in `#startHandleDrag` (reject the drag /
clamp to a single legal value / skip dispatch when `minVelocity > maxVelocity`) should treat this as
blocking, not routine cleanup. The original analysis below (with the old `30, 30, 31` numbers) is
kept for context on the vacuousness angle but the test in the tree today is *not* vacuous — it's
failing.

## 1. Original finding — highest priority

`mainframe/test/PianoRoll.test.js`, `'edit mode handle drag is a no-op when neighboring
breakpoints leave no valid gap'`.

At the time of filing, the test used mappings `velocity: 30, 30, 31` and drags the handle between
the two `30`s, asserting `changeFired === false` as proof the code guards against
`minVelocity > maxVelocity`. It does not — there is **no such guard** anywhere in
`#startHandleDrag` / `#handlePointerMove` / `#endDrag`. With the original numbers the test happened
to pass anyway (algebraic coincidence: clamped `liveVelocity` landed on `maxVelocity` which equaled
`oldVelocity`). That's exactly the bug already described in
`[BUG]-pianokey-breakpoint-drag-inverts-with-many-clips-on-one-key.md` (still open) — a mis-clamped
drag can dispatch a `newVelocity` that duplicates/crosses the adjacent band.

**Ask:** add the guard in `#startHandleDrag` (or reject-on-drop in `#handleDrop`) so that when
`minVelocity > maxVelocity` the drag is a genuine no-op — no `is-dragging-handle`/`is-dragging`
classes, no readout element, no `mappingchange` dispatch regardless of pointer position or which
specific velocities are involved. Once the guard exists, the current failing assertion
(`changeFired === false` with `30, 31, 31`) should pass for the right reason instead of failing.

## 2. Untested new code paths (same file, lower priority)

- `#handleDragOver` — no test exercises `dragover` (type-check against `application/x-akvj-clip-id`
  / `text/plain`, `preventDefault`, `dropEffect = 'copy'`). Drop is tested; drag-over never is.
- `clipHue(clipId)` — new pure function (hash → hue 0-360) for region color swatches, zero direct
  test coverage.
- `disconnectedCallback()` while a drag is in progress — calls `#endDrag(false)` for cleanup
  (removes pointermove/pointerup/pointercancel listeners, releases pointer capture). No test
  removes a `piano-key` mid-drag to confirm listeners are actually torn down (a leak here would
  only show up as a dangling `pointermove` listener on a detached element).
- `pointercancel` path — `#handlePointerUpDrag` is wired to both `pointerup` and `pointercancel`,
  but only `pointerup` is exercised in tests.

## Priority

Medium-high for item 1 (actively misrepresents the state of a known bug to anyone reading test
output); low for item 2 (normal new-code coverage gaps, not urgent).
