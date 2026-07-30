---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: low
created: 2026-07-30
owned_paths:
  - mainframe/test/slugify.test.js
verification_tier: focused
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 520 — test coverage: slugify special-case letter folding

From: `[TEST]-mainframe-slugify-special-chars.md` (test-marshal).

`slugifyPathSegment` (`mainframe/shared/slugify.js:13`) has three dedicated regex replacements for
letters NFD normalization doesn't decompose into base+combining-mark pairs — none are covered by
`mainframe/test/slugify.test.js`, which only exercises the generic NFD-diacritic path.

## Checklist

- [ ] `mainframe/test/slugify.test.js`: add a case for `ø`/`Ø` → `o` (e.g. `'Blåøre'` → `'blaore'`)
- [ ] add a case for `æ`/`Æ` → `ae` (e.g. `'Æther'` → `'aether'`)
- [ ] add a case for `ß` → `ss` (e.g. `'straße'` → `'strasse'`)
- [ ] optionally combine into one case mirroring the existing diacritic-folding test, e.g.
  `'København Æblegrød straße'` → `'kobenhavn-aeblegrod-strasse'`

Test-only addition, no product source touched.

## Verify

`npm run test -w mainframe`.

Scope: **mainframe-developer**.
