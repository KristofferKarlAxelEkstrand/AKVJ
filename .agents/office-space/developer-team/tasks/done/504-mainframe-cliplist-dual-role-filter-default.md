---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 504 — ClipList dual role filters disagree on missing meta.role

From: `[BUG]-cliplist-dual-role-filter-default-asymmetry.md` (nitpicker).

## Bug

`mainframe/src/js/ClipList.js` `#filterClips` (~161–172):

- Library chip (`this.#roleFilter`): `clip.meta.role || 'clip'`
- Piano-roll bag (`filters.role`): raw `clip.meta.role` — **no** `'clip'` default

A clip with omitted `role` matches library “Clip” but may not match piano-roll role filter “clip”.

## Fix

Unify both paths on the same default (`'clip'` / shared constant if **505** lands first). Add/adjust a unit test covering omitted `meta.role` under both filter surfaces.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**. Related naming: **505**.
