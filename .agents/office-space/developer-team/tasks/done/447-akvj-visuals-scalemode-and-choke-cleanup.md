---
status: done
assignee: akvj-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 447 — akvj visuals: scaleMode visual gap + unit holes

**Ready to resume:** **450** installed Playwright Chromium deps (2026-07-29). Run `test:visual:update` for scaleMode refs; unit work already in tree.

From: `[TEST]-akvj-visuals-scalemode-and-choke-cleanup.md` (test-marshal).

## Visual — scaleMode / scaling screenshots

`canvas.test.js` has no Chromium shots for `scaleMode` or `scaling`. Extend visual tests; prefer real `drawWithScaleMode` / `Clip.renderToContext` on a non-square asymmetric cell (mock `drawFn` bypasses scaleMode).

- [ ] `cover`, `fit`, `stretch`, `none`, `pattern` screenshots
- [ ] Optional: smooth-then-nearest on shared ctx (guards 443); skip if pixelmatch too flaky

## Unit — Clip `#drawToContext` finally on throw

- [ ] `Clip.test.js` — `scaling: 'smooth'`, `drawImage` throws; assert smoothing restored after throw

## Unit — finished one-shot + triggerGroup cleanup

- [ ] `LayerGroup.test.js` — finished one-shot leaves choke map; next same-group `noteOn` must not `stop` the ghost

## Verify

`npm run test -w akvj`, `npm run test:visual` (+ `:update` for new refs), `npm run lint`.

Scope: `akvj/test/` (+ helpers) — **akvj-developer**.
