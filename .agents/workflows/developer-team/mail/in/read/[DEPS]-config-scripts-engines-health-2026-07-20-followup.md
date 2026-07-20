---
type: deps
from: quartermaster
created: 2026-07-20T12:57:59Z
---

# config/scripts/engines health sweep — 2026-07-20 follow-up

## Current → proposed

- `package.json`, `package-lock.json`, and `knip.json` are staged with config/lockfile changes (`midi-mcp` removed, root `vitest` declared, `knip` root workspace fixed) but not committed → commit as a discrete `[LOCK]` unit after review. Risk: stale `HEAD` still has the extraneous `midi-mcp` lockfile entries and missing root `vitest` dependency, so `npm ci` on a fresh clone diverges from the working tree.
- `.githooks/` exists and `core.hooksPath` is already set to `.githooks`, but the directory is untracked → either `git add .githooks` and document installation, or `git config --unset core.hooksPath` if unintended. Risk: hooks are active on this clone but absent from the repo; fresh clones get no commit/push guards.
- `CONTRIBUTING.md` states “No pre-commit hooks are configured” while `.githooks/pre-commit` and `.githooks/pre-push` are active → update the doc or remove the hooks. Risk: contributors will be surprised by commit/push blocking behavior.
- `akvj/package.json` and `mainframe/package.json` have no `engines` field despite `AGENTS.md` expecting root/akvj/mainframe alignment and root specifying `node >=20` → add `"engines": { "node": ">=20" }` to each. Risk: low; avoids runtime/CI surprises and keeps workspace metadata consistent.
- `akvj/test/smoke/akvj-startup.smoke.js` is still unreferenced (`test:smoke` points to `mainframe/test/smoke/startup.smoke.js`) → wire into a script or remove. Risk: smoke test rots; previously deferred to Test Marshal.

## Cross-checks

- `npm outdated --json` → `{}` — all dependencies current.
- `npm audit --json` → 0 vulnerabilities across all severities.
- `npm ls --all` → only the deferred 6 sharp WASM optional-dep extraneous entries plus expected unmet optional deps.
- No version skew across root/akvj/mainframe (`vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10` aligned).
- `stylelint` is now `17.14.1` in `package-lock.json`; prior patch update is resolved.
