---
status: backlog
assignee: none
priority: medium
---

# Task 328: QA reviewer project review lane check

Run a QA audit on the current repo and report findings.

## Scope

- Pending review queue (`slack/qa-reviewer/`)
- Recent completed work in `tasks/working-on/` and `tasks/done/` that has not been QA'd
- Cross-cutting integration risks (akvj ↔ mainframe boundary, custom elements, MIDI path)

## Checks

1. Complete any pending `[TASK]-review-*.md` items first.
2. Spot-check the last 5–10 completed tasks in `tasks/done/` for verification gaps.
3. Run `npm run lint && npm run test && npm run build` at root if not already covered by current reviews.
4. Identify flaky or skipped tests, missing coverage, or unverified environment-specific behavior.

## Output

Write a `[REPORT]-328-qa-reviewer-project-review.md` to `slack/team-lead/` summarizing audit findings and any follow-up tasks needed.
