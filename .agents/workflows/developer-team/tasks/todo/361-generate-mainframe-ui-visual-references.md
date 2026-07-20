---
status: backlog
assignee: none
priority: medium
review: machine
---

# Task 361: Generate missing visual reference screenshots for Mainframe UI

## Source
- `mail/in/[TEST]-mainframe-ui-missing-visual-references.md`

## Description
The `mainframe` workspace visual tests fail because there are no existing reference screenshots.
Run `npm run test:visual` to generate the reference screenshots and ensure the visual tests pass.

## Verification
- `npm run test:visual` passes.
