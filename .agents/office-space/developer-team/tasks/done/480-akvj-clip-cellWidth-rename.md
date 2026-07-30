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

# 480 — Clip `#frameWidth`/`#frameHeight` → `#cellWidth`/`#cellHeight`

From: `mail/in/read/[NIT]-clip-cellWidth-vs-frameWidth-2026-07-29.md` (nitpicker). Naming / comment only — no draw maths change.

## Do

1. `akvj/src/js/visuals/Clip.js` — `#frameWidth` / `#frameHeight` → `#cellWidth` / `#cellHeight` (fields, `#initDimensions`, draw sites). Values are derived from sheet÷grid (`image.width / framesPerRow`), matching `frameLoad.js` wording — not meta authoring fields.
2. Optional: `clipMetadata.js` `normalizeClipMetadata` — keep emitting `frameWidth`/`frameHeight` if useful, but JSDoc that they are authoring-only / Clip ignores and derives cell from sheet. Prefer JSDoc over dropping if tests/mainframe expect the shape.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**. Do not cite draft specs as binding.
