---
status: backlog
assignee: none
priority: high
---

# 407 — check-references flags generated/gitignored paths as dangling

From `[BUG]-check-references-flags-generated-paths.md` (overseer).

`.agents/workflows/scripts/check-references.js` reports a dangling reference for any doc that cites
a path under generated output (e.g. `akvj/src/public/projects/**`). Those files legitimately do not
exist until `npm run clips` runs, so the whole workflow gate goes red for correct prose.

This is not hypothetical: it turned `check-workflow.js` red today, which in turn made
`machine-review.js` reject task 400 — work that was entirely sound. A gate that fails for reasons
unrelated to the change under review trains the team to ignore it.

## Fix

Skip reference **targets** that are generated output. Prefer `git check-ignore -q <path>` — treat a
hit as "valid by policy, not checked" — over a hardcoded prefix list, so the rule tracks
`.gitignore` instead of drifting from it. Fall back gracefully when git is unavailable.

Leave the existing scan-root exclusions alone; this is the target side only.

## Second case, same root

A task that describes a move also cites its *destination*, which does not exist until the task
lands. Task 410 tripped this within minutes of being filed (two paths under `mainframe/shared/`).
Both cases are "a doc correctly names a path that is not on disk right now", and both turn the gate
red for prose that is doing its job.

Decide and implement one coherent rule covering both. Options worth weighing: only flag dangling
references in `spec/` and `epics/` (where rot actually matters) and not in `tasks/`; or downgrade a
dangling reference to a warning that does not fail the gate. Say which you picked and why in your
report — this is a judgement call about what the gate is *for*, so argue it rather than just coding
the first option.

## Verify

- Add a test: a doc citing a gitignored path produces no dangling reference.
- Add a test: a doc citing a genuinely missing, non-ignored path still reports dangling.
- `node .agents/workflows/scripts/check-workflow.js developer-team` passes.
- `npm run lint && npm run test`
