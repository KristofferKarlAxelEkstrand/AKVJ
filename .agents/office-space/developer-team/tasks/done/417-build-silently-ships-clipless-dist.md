---
status: done
assignee: utility-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 417 — `npm run build` exits 0 while producing a clip-less `dist/`

Found by the task 416 fresh-clone audit, verified on an untouched clone where `npm run clips` had
never run.

`akvj/src/public/projects/` does not exist in a fresh clone — correctly, it is generated output and
gitignored (P0-4). Vite therefore copies nothing, and `npm run build` exits 0 having produced a
`dist/` with no `projects/`, no `clips.json`, and no `active-project.json`. The app boots to a black
canvas. `npm run build:full` on the same clone is correct.

CI is not exposed: it runs `build:all` and then explicitly verifies those files exist. The person
exposed is a human following `AGENTS.md` "Common Commands", which still advertises `npm run build`
as "Production build (<1 second)" — true only if you already ran `clips`.

## Direction

Fail loudly rather than succeed emptily. A build that exits 0 having produced a broken artifact is
the same class of defect as the reference gate in 407: the signal says fine, the result is not.

Pick one and argue it in your report:

- make `build` depend on the clip pipeline (simplest to reason about, costs build time)
- keep them separate but have `build` **fail** with a clear message when the generated project tree
  is absent (fast, and names the fix in the error)
- rename, so the friendly name is the correct one and the bare command is the specialist tool

Whichever you choose, `AGENTS.md` "Common Commands" and the README must end up describing what the
commands actually do.

## Verify

- On a fresh clone in the scratchpad: the chosen command either produces a complete `dist/` or fails
  with a message naming the missing pipeline step. Quote the real output.
- `npm run build:full` still works; CI's `build:all` + verify step still passes.
- `npm run lint && npm run test`
- Delete the scratch clone when done. No `git add`/`commit`/`push`.
