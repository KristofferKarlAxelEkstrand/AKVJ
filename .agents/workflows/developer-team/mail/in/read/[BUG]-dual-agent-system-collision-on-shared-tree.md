# [BUG] Two independent agent systems are editing the same working tree concurrently, bypassing QA and already shipping a real bug

From: QA Reviewer
Severity: High — process/infrastructure, affects trust in all test signal right now

## What's happening
While reviewing tasks 241/242 today, I found corroborating evidence for
`slack/team-lead/[BLOCKED]-concurrent-akvj-developer-write-collision.md` (filed by
akvj-developer): there are **two separate multi-agent teams** operating on this same repo
and working tree without coordination.

1. **This team** — the `slack/`-folder-based system (Team Lead, akvj-developer,
   mainframe-developer, QA Reviewer, Nitpicker, etc.) described in
   `spec/collaboration-protocol.md`.
2. **A second, independent system** — a `.agents/queues/`-based "Devin Team Controller"
   (added in commit `0863a7c feat: add standalone Devin Team Controller server and related
   services`), with its own Team Lead/QA Reviewer personas, its own task numbering, and its
   own commits (`2adac91 fix(akvj): comprehensive hardening...`, `20cb712 chore: complete
   tasks 224 and 227...`). Its QA output is sitting in
   `inbox/read/qa-audit-report-2026-07-19.md`, entirely outside this team's mailbox/review
   flow.

## Concrete evidence
- **Test flakiness reproduced independently**: running `npm run test -w akvj` (or a scoped
  subset) back-to-back with zero edits of my own between runs produced different results
  each time — 18-20 failures, then 0 failures on the same files, then a full 468/468 clean
  run. `git status` showed staged/unstaged state shifting between checks. This matches the
  "files changed under me" symptom akvj-developer already reported.
- **A real bug already landed via the other system's pipeline**: the Nitpicker's
  `inbox/[NIT]-appstate-comment-cull-2026-07-19.md` independently flagged that
  `AppState.js`'s new rate-limiting code (`#checkClockRateLimit` + `#processClockPulse`,
  from the Devin-side Task 227 "security hardening") double-increments
  `#clockPulseCount` per pulse — two separate methods maintain the same window/counter
  fields with drifting reset conditions, roughly halving the real effective rate limit.
  This code was never reviewed through this team's QA mailbox (no `[TASK]-review-227-*`
  ever arrived here).
- Task 227's diff also silently dropped `projectDefaults`/`mergeProjectSettings` from
  `settings.js` (unrelated to its stated security scope; currently unused elsewhere so not
  a live break, but undocumented scope creep from an unreviewed pipeline).

## Why this matters
Both systems are writing to the *same uncommitted working tree* with no lock, no shared
mailbox, and no shared QA gate. This risks silent data loss (task 241's own file was
transiently reset to HEAD mid-edit per akvj-developer's report) and means any test/lint/
build result captured "in the moment" may not reflect a stable state a moment later —
undermining every verdict this QA role issues until resolved.

## Ask
A human decision is needed on which system is authoritative, or how to reconcile them
(e.g., pause the Devin Team Controller until its in-flight work is merged/reviewed through
one pipeline). Not something Team Lead or QA can resolve by editing files — flagging per
"serious issue outside task scope" guidance rather than chasing it further myself.

## Related
- `slack/team-lead/[BLOCKED]-concurrent-akvj-developer-write-collision.md` (akvj-developer's original report)
- `inbox/[NIT]-appstate-comment-cull-2026-07-19.md` (the Nitpicker's double-increment finding)
- `inbox/read/qa-audit-report-2026-07-19.md` (the other system's own QA output)
