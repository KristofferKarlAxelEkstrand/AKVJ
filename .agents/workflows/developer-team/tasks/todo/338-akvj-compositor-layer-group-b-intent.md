---
status: backlog
assignee: none
priority: high
---

# Task 338: AKVJ Compositor Layer Group B rendering intent (PARKED)

## Source

- Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 3
- Epic `.agents/workflows/developer-team/epics/drafts/akvj-visuals-quality.md`

## Parked (2026-07-20)

Human answered the plan question with a **channel-stack redesign**, not a crisp option 1 (A-only) vs 2 (A-then-B). Draft epic: `epics/drafts/simplify-midi-channel-stack.md` — **separate** from this task; do not implement remap here.

**Do not implement** compositor changes until human explicitly locks current no-mask A/B behaviour (new clarifying question in `mail/out/`).

## Description

`akvj/src/js/visuals/Compositor.js:182-188` draws only Layer Group A when no mask is loaded, even if Layer Group B is also active.

Once human locks option 1 or 2 for *today’s* compositor (independent of channel remap): document + test + implement that rule only.

## Verification

- Human has locked option 1 or 2 in `mail/out/` for current compositor
- New test in `akvj/test/Compositor.test.js` covers the no-mask / both-groups-active case
- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
