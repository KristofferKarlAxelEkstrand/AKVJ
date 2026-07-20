---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# Task 393: ClipTiming free-mode naming honesty (ms-first)

## Source

Nitpicker `[NIT]-clipTiming-free-mode-ms-honesty-2026-07-20.md`

## Description

Docs/rename only — free mode already prefers `frameDurationsMs`.

- [ ] `akvj/src/js/visuals/ClipTiming.js` Free-mode header bullet: ms-first, else FPS
- [ ] `#initFrameRates` → `#initFrameTiming` (+ call site)
- [ ] `#naturalDuration` → `#naturalDurationMs`; local `targetDuration` → `targetDurationMs`

## Verification

- `npm run lint -w akvj` / `npm run test -w akvj` pass
