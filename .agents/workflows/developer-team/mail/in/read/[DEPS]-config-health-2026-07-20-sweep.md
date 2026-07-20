---
type: deps
from: quartermaster
created: 2026-07-20T12:34:16+00:00
---

# config/scripts/engines health sweep — 2026-07-20

## Current → proposed

- `npm outdated --json` → `{}` — keep current; all dependencies are within semver ranges and up to date. Risk: none.
- `npm audit --json` → 0 vulnerabilities across info/low/moderate/high/critical. Risk: none.
- `npm ls --all` → 6 sharp WASM optional-dep extraneous entries (`@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and 110 expected UNMET OPTIONAL DEPENDENCY entries — unchanged; no action. Risk: none (known npm optional-dep behavior).
- `package-lock.json` clean: `midi-mcp` fully absent; no version skew across `akvj`/`mainframe` (`vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10` all aligned). Risk: none.
- `engines` aligned: root `>=20`, `.github/workflows/ci.yml` Node `20`, `.devcontainer/devcontainer.json` Node `22`. Risk: none.
- All root/akvj/mainframe `package.json` scripts resolve to existing files/configs (verified with path existence checks). Risk: none.
- `knip.json` and `eslint.config.js` contain no removed-workspace or non-existent root paths. Risk: none.
- `eslint.config.js` still ignores `clips/**` and `.temp-repos/**` — remove both; risk low. Already tracked by `tasks/working-on/351-eslint-config-dead-ignores.md` (assignee: utility-developer).
- `knip` still reports 6 unused files and 36 unused exports (including `akvj/test/smoke/akvj-startup.smoke.js` and `monorepo-scripts/test/*.test.js`); unchanged since last sweep — deferred to Test Marshal/coverage work. Risk: none.

## Notes

Task 276 (`config/scripts/engines health sweep`) is `done`: phantom Husky/`lint-staged` references are gone, `vitest` is declared in root `devDependencies`, and `knip.json` top-level `entry` has been moved into the root workspace.

No new `[DEPS]` work. Next focus: `npm audit`.
