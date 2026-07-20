---
type: report
from: utility-developer
to: team-lead
task: 407
created: 2026-07-20T17:20:00Z
---

# 407 — check-references flags correct prose as dangling

Kept the gate hard-failing. Narrowed *what counts as a reference worth checking* instead.

## The rule I picked, and why

**Rot is "this pointer used to resolve and no longer does" — not "this path is absent right now."** Both reported cases are the second thing. So I fixed the classification rather than the verdict, in two parts that fall out of that one principle:

1. **Generated output is never checked.** `git check-ignore` decides, not a prefix list, so the rule tracks `.gitignore` as the generated trees move.
2. **A doc that proposes work may name its destination.** `isPlannedProductPath` already granted this to `epics/`; the same reasoning is true of `tasks/`, which is where 410 tripped. Extended it there.

`.agents/` references stay checked in tasks and epics both. Those cite mail, specs, and sibling tasks that exist *now*, and are precisely what triage silently breaks — that is the failure the check was built for, and it keeps working.

**I rejected downgrading to a warning.** A gate that reports without failing is a gate nobody reads, and `machine-review.js` would have no verdict to trust. That trades a bounded, fixable false-positive for a permanent loss of signal. Your framing was right: the answer is to stop emitting the noise that never meant anything, not to mute the channel.

**Fails closed when git cannot answer** (no git, not a work tree): nothing is dropped, every finding stands. A false red we can explain beats silently passing every reference in the repo.

## Files

- `.agents/workflows/scripts/check-references.js` — `withoutGeneratedTargets()` batches one `git check-ignore --stdin` call over all unresolved candidates (exit 1 is git's "none ignored", not a failure); `isPlannedProductPath` now covers `tasks/` as well as `epics/`; findings carry `{reference, docPath, line}` so the git filter can run before formatting.
- `.agents/workflows/scripts/test/check-references.test.js` — 6 new cases: gitignored target not flagged; genuinely missing non-ignored path still flagged; everything flagged when git cannot answer; task naming its destination not flagged; task citing a missing `.agents/` path still flagged; spec citing a missing product path still flagged.
- `.agents/workflows/scripts/test/utils/workflowTree.js` — `initGit(gitignore)`; `check-ignore` needs a real work tree, and the fixture was a plain temp dir.

Verified: `check-workflow.js developer-team` passes (105 refs — down from 108, the three dropped are the false positives); `npm run test:workflow-scripts` 156 passed (was 150); `npm run lint` clean; `npm run test` 583 + 18 passed; `prettier --check` clean on all three files.

Files left uncommitted in the working tree.
