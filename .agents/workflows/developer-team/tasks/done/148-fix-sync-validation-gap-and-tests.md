---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 148: Fix Sync Validation Gap (Missing `syncLength` Silently Ignored) + Missing Test Coverage

## Source
Overseer bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-sync-beat-missing-synclength-silently-ignored.md`
Both problems independently verified by Team Lead before filing this task.

## Urgency (resolved — no conflict with Task 137)
Team Lead checked Task 137's report and its new `mainframe/src/js/syncTiming.js` mirror
before assigning this: it gracefully returns `null` when `syncLength` is missing (same
intentional engine-side fallback as akvj's original, correct for a live preview), and the
editor's own `<select>` always has a default preset value so the gap doesn't manifest through
normal UI use — it's purely a hand-authored-`meta.json`-bypasses-the-editor gap. No double-fix
needed; proceed with the pipeline validation fix below as originally scoped.

## Problem 1: `sync: "beat"` With No `syncLength` Passes Validation, Silently Ignored at Runtime
`mainframe/scripts/clips/lib/validate/meta.js` `validateSyncFields()` (~line 138-162):
validates `sync`/`syncLength`/`syncBeats`/`beatsPerBar` independently and requires `syncBeats`
when `syncLength === 'custom'`, but never checks that `syncLength` is present at all when
`sync === 'beat'`. Confirmed: `{ "sync": "beat" }` alone passes `npm run clips` cleanly.
At runtime, `akvj/src/js/visuals/clipMetadata.js` `resolveTotalBeats()` falls through every
branch and returns `null` → `frameDurationBeats` stays `null` → the clip silently plays at
default free/FPS timing, completely ignoring the author's `sync: "beat"` intent, with no
error or warning anywhere. The engine-side silent-null fallback itself is correct and
intentional (confirmed via `akvj/test/clipMetadata.test.js` — never crash the render loop over
bad metadata) — the gap is specifically that mainframe's validation layer doesn't catch this
authoring mistake before it ships, contradicting the task's own stated division of labor
("mainframe only validates shape so hand-authors get clear errors").

**Fix**: in `validateSyncFields()`, add: if `meta.sync === 'beat'` and
`meta.syncLength === undefined`, push an error (e.g.
`` `syncLength is required when sync is "beat"` ``).

## Problem 2: Zero Test Coverage for `validateSyncFields()`
Task 136's own "Suggested Tests" asked for mainframe test coverage of the new field
validation. Confirmed via `grep -rn "validateSyncFields\|syncLength\|SYNC_MODES"
mainframe/test/` — zero hits. The only sync-related tests that exist are engine-side
(`akvj/test/clipMetadata.test.js`), which are thorough and unaffected by this task. Writing
the mainframe validation suite would very likely have caught Problem 1 directly.

**Fix**: add a test suite for `validateSyncFields()` (in `validate-extended.test.js` or a new
file) covering: valid `sync`/`syncLength`/`syncBeats`/`beatsPerBar` combos, each invalid-enum
case, `syncLength: 'custom'` missing `syncBeats`, and the new Problem 1 case
(`sync: 'beat'` missing `syncLength`).

## Files
- `mainframe/scripts/clips/lib/validate/meta.js`
- `mainframe/test/validate-extended.test.js` (or new dedicated test file)
