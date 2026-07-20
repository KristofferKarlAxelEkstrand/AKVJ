---
status: done
assignee: utility-developer
priority: medium
---

# 416 — Fresh-clone durability audit

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` — closes out the
P0 wave by checking its success criterion rather than assuming it.

P0-2 through P0-5 are all in the tree (CI verify paths, `build:full`, gitignore policy, Vite HMR
watch path). P0-1 is a commit only the human can make. Nobody has verified the actual claim: a
fresh clone installs, builds, and generates clip output.

## What to do

Clone this repo to a scratch directory — use the scratchpad, not a path inside the work tree — at
the current `HEAD`, and run the sequence a new contributor would:

1. `npm install`
2. `npm run build`
3. `npm run clips`
4. `npm run test`

Record what actually happens at each step. A clone sees only *committed* content, so anything the
working tree has that the index does not will show up here — that is the point of the exercise.

## Deliverable

A report listing, for each failure: the command, the error, the missing or stale file, and whether
the fix is a code change (file a follow-up) or a commit only the human can make (goes to
`mail/out/`). If it all passes, say so plainly — that is a useful result and the epic can close its
P0 section.

**Do not** run `git add`, `git commit`, or `git push`, and do not modify the clone's parent repo.
Delete the scratch clone when you are done.

## Verify

- The four commands above, run in the clone, with their real output quoted in your report.
