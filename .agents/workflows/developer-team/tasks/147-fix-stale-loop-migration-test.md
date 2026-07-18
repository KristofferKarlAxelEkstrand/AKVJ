---
status: backlog
assignee: none
priority: low
---

# Task 147: Fix Stale "Migrates Loop Boolean to Playback" Test

## Source
Discovered by Team Lead while verifying QA's note on Task 140's report and confirmed again
independently by Task 136's report ("1 pre-existing failure ... from Task 119's non-mutation
change, not introduced by this task"). Nobody has been assigned to actually fix it yet — it's
been silently failing since Task 119 was approved.

## Problem
`mainframe/test/validate-extended.test.js:208-235` — `'migrates loop boolean to playback'`
asserts the **old** mutating behavior:
```js
expect(result.valid[0].meta.playback).toBe('loop');
expect(result.valid[0].meta.loop).toBeUndefined();
```
Task 119b (`tasks/done/119-clip-format-core.md`) deliberately removed this mutation —
validation now only **warns** about deprecated `loop` without rewriting `meta`
(`mainframe/scripts/clips/lib/validate/meta.js` — `console.warn(...)`, no `meta.playback =`
/`delete meta.loop` anymore). Confirmed by running `npm run test -w mainframe -- validate-extended`
directly: exactly this one test fails today, with `meta.playback` coming back `undefined`
(never set) instead of `'loop'`, and `meta.loop` still present (not deleted) — i.e. the actual
current behavior is correct per Task 119b's design, only the test is stale.

Task 119's own report claimed a replacement test ("accepts legacy loop boolean without
mutating meta") was added, but no such test currently exists in the file — only the old
stale one remains. Whatever happened, the net result today is one broken test with no
coverage of the actual (correct) non-mutating behavior.

## Fix
Update (don't just delete) the test to assert the current, correct contract:
- `meta.loop` is preserved as-authored (not deleted).
- `meta.playback` is **not** auto-set from `loop` (stays whatever it was, likely `undefined`
  if not separately specified).
- A deprecation warning is logged (if that's asserted elsewhere/worth asserting here).
- Validation still passes with 0 errors for a clip using legacy `loop` (the field is
  deprecated-but-accepted, not an error).

## Files
- `mainframe/test/validate-extended.test.js:208-235`
- Reference (no changes expected): `mainframe/scripts/clips/lib/validate/meta.js`
