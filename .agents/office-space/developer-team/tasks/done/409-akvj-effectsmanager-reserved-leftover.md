---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 409 — EffectsManager: dead `reserved` guard removed

Trailing follow-up to archived task 404, from QA's
`[FEEDBACK]-effectsmanager-reserved-leftover.md`. Filed after the fact so the change has a task
file to be reviewed against — the work is already in the tree.

`akvj/src/js/visuals/EffectsManager.js`:

- Removed the dead `if (type === 'reserved') continue;` from the constructor loop.
  `settings.effectRanges` has no `reserved` key, and the eight configured ranges cover 0–127 with
  no gap.
- Rewrote the `#effectTypeByNote` doc comment to describe actual behaviour: the map is built from
  the configured ranges, and a note outside every range yields no effect.

No behaviour change.

## Verify

- `npm run lint && npm run test && npm run test:visual` (developer reports 572+18 and 20+7 green)
- Confirm no other `'reserved'` reference remains in `akvj/src/js/visuals/`.
