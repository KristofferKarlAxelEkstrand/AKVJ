---
type: deps
from: quartermaster
created: 2026-07-20T09:31:01+00:00
---

# config/scripts/engines health sweep

## Resolved since last config sweep

- Phantom Husky / `lint-staged` references removed from `AGENTS.md` and `CONTRIBUTING.md`.
- `vitest` now declared in root `package.json` `devDependencies`.
- `knip.json` top-level `entry: ["e2e/**/*.spec.js"]` matches existing `e2e/akvj.spec.js` and `e2e/mainframe.spec.js`.

## Checklist — current → proposed

- [ ] `eslint.config.js` ignores `clips/**` and `.temp-repos/**` — remove both. Risk: low; neither directory exists at repo root, so these ignores are dead config. (`.cache/**` is still valid and should stay.)

## Cross-checks

- `npm audit`: 0 vulnerabilities.
- `npm outdated`: empty.
- `engines` aligned: root `>=20`, `.github/workflows/ci.yml` `20`, `.devcontainer/devcontainer.json` Node 22.
- Root `package.json` scripts resolve: `test:smoke` → `mainframe/test/smoke/startup.smoke.js`; workflow/bash scripts referenced by CI exist.
- `knip` still reports 6 unused files and 36 unused exports (including `akvj/test/smoke/akvj-startup.smoke.js`); these are dead-code/coverage items, not config health — defer to Test Marshal.

Next: outdated dependencies.
