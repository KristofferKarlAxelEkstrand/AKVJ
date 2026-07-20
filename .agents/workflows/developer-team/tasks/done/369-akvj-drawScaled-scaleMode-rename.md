---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# Task 369: Rename `drawScaled` to avoid `scaling` collision

## Source

Nitpicker `[NIT]-visuals-drawScaled-scaleMode-collision-2026-07-20.md`

## Description

`scaleMode` = fit/cover/stretch/none/pattern. `scaling` = nearest/smooth interpolation. Export `drawScaled` takes `scaleMode` and never touches `scaling` — rename so it does not read as meta `scaling`.

Rename-only / JSDoc — no behaviour change.

## Checklist

- [ ] `akvj/src/js/visuals/clipDrawRect.js` — rename export `drawScaled` → `drawWithScaleMode` (or `drawByScaleMode`); fix JSDoc (~L87) “fit/cover/none **scaling**” → “fit/cover/none **scaleMode**”
- [ ] `akvj/src/js/visuals/Clip.js` — update import + call site
- [ ] `akvj/test/clipDrawRect.test.js` — update import + `describe`

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
