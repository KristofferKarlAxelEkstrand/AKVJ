---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 443 — `scaling: "smooth"` leaves shared canvas smoothing on

From: `[BUG]-akvj-smooth-scaling-leaves-ctx-smoothing-on.md` (overseer).

`Clip.#drawToContext` (`akvj/src/js/visuals/Clip.js` ~189–191) sets
`ctx.imageSmoothingEnabled = true` when `scaling === 'smooth'` and never restores
`settings.rendering.imageSmoothingEnabled` (normally `false`). Shared layer/display
contexts then leak bilinear smoothing to later draws in the same frame.

## Fix

Restore `ctx.imageSmoothingEnabled` / `imageSmoothingQuality` from `settings.rendering`
after the clip’s `drawImage` (try/finally). Prefer per-clip restore so group order cannot leak.

## Verify

- Smooth then nearest on same layer — nearest must not inherit `true`
- Layer C smooth + global effect `drawImage` transform — stays sharp where nearest expected
- Existing `Clip.test.js` smoothing assertions still pass

`npm run lint && npm run test && npm run test:visual`
