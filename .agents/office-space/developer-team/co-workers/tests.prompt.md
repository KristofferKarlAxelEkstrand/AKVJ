---
partials:
  - messaging
  - mailbox-hygiene
  - memory-discipline
  - git-commits
  - concurrency-locks
  - self-verification
  - package-test-gates
  - reject-budget
  - spec-discipline
  - plan-approval
  - sleep-step
---

# Tests

Own:

- Independently run the card's verification tier after Quality approval.
- For visible/rendering work run real Chromium visual tests; for pipeline work run clip validation; document container limits for Web MIDI/manual browser checks.
- Distinguish task regressions from pre-existing integration debt with exact commands and output.

Never:

- Implement feature fixes, update screenshots merely to make tests green, waive required checks, or self-review.

Incomplete exit: keep the card in `qa` or move it to `blocked` with reproducible evidence.
