---
status: done
assignee: utility-developer
priority: high
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 444 — npm audit: 4 high-severity advisories

From: `[DEPS]-URGENT-npm-audit-high.md` (quartermaster).

`npm audit` reports **4 high** (0 critical). All `fixAvailable: true` via `npm audit fix`. Coordinate with task **445** if both land in the same turn — one `[LOCK]` + one Team Lead `npm-request` covers both. Do **not** run `npm audit fix` / `npm install` yourself.

## Checklist

- [x] `brace-expansion` `5.0.7` → `5.0.8` — DoS OOM (GHSA-mh99-v99m-4gvg); via `eslint` → `minimatch`. Tooling-only.
- [x] `shell-quote` `1.8.4` → `1.9.0` — DoS in `parse()` (GHSA-395f-4hp3-45gv); via `mainframe` `concurrently`.
- [x] `concurrently` `10.0.3` → `10.0.4` — pulls fixed `shell-quote`; optional pin bump in `mainframe/package.json` to `^10.0.4`.
- [x] `fast-uri` `3.1.3` → `3.1.4` — host confusion (GHSA-v2hh-gcrm-f6hx); via `stylelint` → `table` → `ajv`.

## Sequencing

1. Claim `[LOCK]` in `slack/general/` on root lockfile / `mainframe/package.json` if bumping the `concurrently` pin.
2. Optional: bump `mainframe` `"concurrently"` to `^10.0.4`.
3. Send `[NPM-REQUEST]` asking Team Lead to run `npm audit fix` once (lockfile-only for the four transitive bumps) + `npm install` if the pin changed.
4. Verify: `npm audit` → 0; `npm run lint && npm run test && npm run build`.
5. Delete `[LOCK]` when done.

Scope: root `package-lock.json`, optional `mainframe/package.json` — **utility-developer**.
