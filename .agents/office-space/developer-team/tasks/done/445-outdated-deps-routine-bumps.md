---
status: done
assignee: utility-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 445 — Outdated dependencies (routine bumps)

From: `[DEPS]-outdated-deps.md` (quartermaster).

Coordinate with task **444** — prefer one `[LOCK]` / Team Lead `npm-request` pass. Skip any item already at wanted version after 444's lockfile refresh. Do **not** run `npm install` yourself. `concurrently` is owned by **444** — do not double-bump.

## Checklist

- [x] `@playwright/test` `1.61.1` → `1.62.0` (root `^1.61.1`) — re-run e2e/smoke if feasible in-container.
- [x] `eslint` `10.7.0` → `10.8.0` (root `^10.7.0`) — may also clear `brace-expansion` advisory.
- [x] `globals` `17.7.0` → `17.8.0` (root `^17.7.0`).
- [x] `knip` `6.27.0` → `6.29.0` (root `^6.27.0`) — check `npm run knip` output shape.
- [x] `sass` `1.101.0` → `1.102.0` (mainframe `^1.101.0`).
- [x] `prettier` `3.9.5` → `3.9.6` — **exact pin** in root `package.json`; needs manifest edit + `[LOCK]`; run `npm run format:check`.

## Sequencing

1. Claim `[LOCK]` in `slack/general/` before root/`mainframe` manifest edits.
2. Apply pin/range edits that need a manifest change (`prettier`; others should resolve under existing carets via install).
3. Send `[NPM-REQUEST]` for Team Lead `npm install` (and `npm audit fix` if 444 is not done yet).
4. Verify: `npm run lint && npm run test && npm run build`; `npm outdated` for touched packages; `npm run format:check` if prettier bumped.
5. Delete `[LOCK]` when done.

Deferred (not this task): sharp WASM extraneous / unmet optional deps.

Scope: root + mainframe manifests / lockfile — **utility-developer**.
