---
status: done
assignee: qa-reviewer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 338: Compositor no-mask A then B (option 2)

## Source

- Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 3
- Human lock 2026-07-20: option **2** (A then B source-over) via Overseer

## Description

`akvj/src/js/visuals/Compositor.js` `#drawUnmaskedLayerGroups`: when no mask and both A and B have content, draw A then B (source-over). Document + test.

Channel-stack epic (`epics/drafts/simplify-midi-channel-stack.md`) stays **out of scope**.

## Verification

- Comment/docs match option 2
- `akvj/test/Compositor.test.js` covers no-mask + both groups active (B drawn over A)
- `npm run lint -w akvj` / `npm run test -w akvj` pass
