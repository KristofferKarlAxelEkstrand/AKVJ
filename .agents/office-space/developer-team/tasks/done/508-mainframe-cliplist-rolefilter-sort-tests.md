---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 508 — ClipList roleFilter / sortMode unit tests (+ dual-path parity)

From: `[TEST]-mainframe-cliplist-rolefilter-sort-parity.md` (test-marshal).

## Depends

Implement or pair with **504** (unify omitted `meta.role` default on library chip vs piano-roll bag). Tests assume **parity** unless 504 documents intentional asymmetry.

## Checklist

1. `roleFilter = 'clip'` — omitted/empty role + `role: 'clip'` stay; bitmask drops.
2. `roleFilter = 'bitmask'` — only bitmasks.
3. `pianorollFilters = { role: 'clip' }` — same membership as (1) after 504.
4. `sortMode`: `name` / `clipId` / `role` / `frames` (missing name → clipId; missing frames → 0).
5. Optional: compose roleFilter + pianorollFilters + searchQuery.

## Files

- `mainframe/test/ClipList.test.js`
- Prefer tests-only; product fix lives in **504**.

## Verify

`npm run test -w mainframe -- test/ClipList.test.js`.

Scope: **mainframe-developer**.
