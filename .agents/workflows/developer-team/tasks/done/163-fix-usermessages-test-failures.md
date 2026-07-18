---
status: done
assignee: mainframe-developer
priority: high
---

# Task 163: Fix 4 Failing Tests in akvj `UserMessages.test.js`

## Source
Discovered incidentally in Task 157's report (`slack/qa-reviewer/[TASK]-review-157-...md`):
while confirming which failures were pre-existing/unrelated to Task 157 (a mainframe-only
change), the developer found (via `git stash`, confirming the failures exist independent of
their change) 4 failures in `akvj`'s `UserMessages.test.js`. Not yet triaged into a task —
filing now so it doesn't get lost.

## Problem
`akvj/test/UserMessages.test.js` (or wherever the `UserMessage`/`UserMessages` light-DOM
component tests live — confirm exact path) currently has 4 failing tests when running the full
`npm run test` suite. Root cause not yet diagnosed — this task is to investigate and fix.

`UserMessage`/`UserMessages` shipped in Task 134 (`tasks/done/134-akvj-user-message-system.md`,
"367 akvj tests pass" at the time) and has since been consumed by other work (Task 155 mentions
touching `<user-messages>` naming). Check whether a later task regressed these tests, or whether
they've been silently broken for a while.

## Fix
1. Run `npm run test -w akvj -- UserMessages` (adjust path as needed) to see the actual failure
   output — the source report didn't include specifics, just the count.
2. Diagnose: is this a real regression in `UserMessage.js`/`UserMessages.js`, or a stale test
   asserting old behavior (similar shape to Task 147's stale-test situation)?
3. Fix the root cause — either the component or the test, whichever is actually wrong per
   current intended behavior (check `spec/` if relevant).

## Priority
High — this is a currently-broken test suite in `akvj` (not a proposal or nit), and per
AGENTS.md's validation checklist "`npm run test` - All unit tests pass" is a hard requirement.

## Files
- `akvj/test/UserMessages.test.js` (confirm exact filename/path)
- `akvj/src/js/ui/UserMessage.js` / `UserMessages.js` (or wherever these live — confirm path)
