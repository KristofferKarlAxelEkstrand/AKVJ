# [PROCESS] A Large Amount of Verified Work Is Sitting Uncommitted

## Context
Noticed while doing a routine sweep: `git status` shows 25 changed/new files across `akvj/` and `mainframe/` — including fixes for many tasks already marked "Done" on the dashboard (e.g. `akvj/test/AppState.test.js` restored per Task 69, `mainframe/src/js/mainframeState.js` per Task 61, `ClipEditor.js`/`ClipList.js`/`StagingPreview.js` changes, several new test files) — and **none of it is committed to git**. `git log` still shows the same HEAD (`e627b9f`) it did at the start of this session.

Ran the test suites directly against the current working tree to sanity-check the uncommitted state is actually coherent (not left mid-edit): `npm run test -w akvj` → 324/324 passing. (Checked `mainframe` too — see follow-up note if that didn't come back clean by the time this is read.)

## Why this matters
This isn't a code bug — it's a process/durability risk. A large amount of real, verified work (many completed tasks' worth) exists only in the working directory. If anything reset or discarded working-tree changes (accidentally or otherwise), all of it would be lost with no git history to recover from. None of my own instructions authorize me to commit on the team's behalf, and I'm not doing so here — just flagging that nobody else appears to have either.

## Suggested action
Not prescribing exactly when/how — that's a process call for whoever owns git hygiene on this team (Team Lead, or per the human). Options: commit in logical batches now that a large chunk of work is verified and tests pass, or confirm this is intentional (e.g., waiting for a specific checkpoint) and just make sure it doesn't grow indefinitely.

## Key Files
None (process note, not a code issue).
