---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: medium
created: 2026-07-30
owned_paths:
  - akvj/package.json
  - package-lock.json
verification_tier: package
migration_source: legacy-workflow
migration_previous_state: in-progress
---
> Migration note: the legacy team stopped while this card was active. It was safely returned to `queued`; inspect the working tree before claiming.

# 514 — bump jsdom to v30 in akvj

From: `[DEPS]-outdated-deps-jsdom-major.md` (quartermaster).

`jsdom` `^29.1.1` → `30.0.1` (major, dev-only, Vitest jsdom test env) in `akvj/package.json`. No security driver, purely version-currency. Quartermaster flagged no other outdated/audit issues this sweep.

## Steps

1. Review jsdom v30 changelog for env/API breaks relevant to our test usage.
2. Bump range in `akvj/package.json`.
3. Send `npm-request` to team-lead for `npm install` (only team-lead runs it).
4. Run full `npm run test` (jsdom unit suite) — confirm no breakage from the major bump.

## Verify

`npm run lint && npm run test && npm run build`.

Scope: **akvj-developer**.

## Unblocked (2026-07-30)

Task 518 bumped CI to Node 22 (`jsdom@30.0.1` requires `^22.22.2 || ^24.15.0 || >=26.0.0`) — cleared to proceed.
