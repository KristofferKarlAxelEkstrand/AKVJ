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

# 518 — Bump CI to Node 22

From: human decision on `mail/out/question-jsdom-v30-ci-node-bump.md` (blocks task 514).

`.github/workflows/ci.yml:20` pins `node-version: '20'`. Node 20 is past EOL (April 2026), the
devcontainer already runs Node 22, and `engines` in all three `package.json` files already say
`>=20` with no upper bound — no other changes needed.

## Fix

Bump `.github/workflows/ci.yml:20` `node-version` to `'22'`. Update `AGENTS.md`'s "Node version"
note (Container-Specific Configuration section) to match if it still says CI uses Node 20.

## Verify

Push/PR and confirm the GitHub Actions run goes green on Node 22 (lint, test, build).

Scope: **utility-developer**.

Once this lands and CI is green, re-dispatch task 514 (jsdom v30 bump) — it was parked
specifically waiting on this.
