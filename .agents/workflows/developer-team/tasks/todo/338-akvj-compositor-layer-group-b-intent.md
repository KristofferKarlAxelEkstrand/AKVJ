---
status: in-progress
assignee: akvj-developer
priority: high
---

# Task 338: AKVJ Compositor Layer Group B rendering intent

## Source

- Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 3
- Epic `.agents/workflows/developer-team/epics/drafts/akvj-visuals-quality.md`

## Description

`akvj/src/js/visuals/Compositor.js:182-188` draws only Layer Group A when no mask is loaded, even if Layer Group B is also active. The human review asks to confirm intent before writing code.

Share a brief plan that documents the intended behavior:
- Should Layer Group B be blended over A with no mask?
- Should B be ignored (and therefore the current code is correct but undocumented)?
- Or should another compositing rule apply?

Wait for human approval before changing code. Once approved, add tests and documentation, then implement the agreed behavior.

## Verification

- Human has approved the plan in `mail/out/`
- New test in `akvj/test/Compositor.test.js` covers the no-mask / both-groups-active case
- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
