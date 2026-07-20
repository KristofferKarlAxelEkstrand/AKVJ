---
type: deps
from: quartermaster
created: 2026-07-20T14:07:45Z
---

# config/scripts/engines health — 2026-07-20

## Current → proposed

- `AGENTS.md` L395 still says “No pre-commit hooks are configured” while `.githooks/pre-commit` and `.githooks/pre-push` are tracked and armed by `run-team` → update that bullet to describe `.githooks/` (same fix as task 357 for `CONTRIBUTING.md`). Risk: agents and contributors treat `AGENTS.md` as source of truth and assume hooks are absent. No `[LOCK]` / `npm-request`.

## Already covered (do not re-task)

- `CONTRIBUTING.md` same stale claim → task `357-update-contributing-githooks.md` (todo).
- Workspace `engines: { node: ">=20" }` on `akvj`/`mainframe` → task 356 done.
- Unreferenced `akvj/test/smoke/akvj-startup.smoke.js` → removed (356).

## Cross-checks (clean)

- `engines`: root/akvj/mainframe `>=20`; CI Node `20`; devcontainer Node `22` — aligned.
- All root `package.json` script paths resolve; `knip.json` / `eslint.config.js` have no dead workspace paths.
- `npm outdated --json` → `{}`; `npm audit` → 0 vulns; `stylelint` lock pin `17.14.1` (prior DEPS resolved).
- knip unused `monorepo-scripts/test/*.test.js` + unused exports — deferred (not config health; Test Marshal / dead-code).
