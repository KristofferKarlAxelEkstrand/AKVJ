# [DEPS] Stylelint patch update + lockfile refresh

**Quartermaster sweep focus:** version-skew / lockfile hygiene
**Date:** 2026-07-20

## Findings

`npm outdated --json` reports one stale root dependency:

- `stylelint` `17.14.0` → `17.14.1` (patch, latest)

`package.json` root declares `stylelint: "^17.14.0"`. `package-lock.json` currently pins `stylelint@17.14.0`. The lockfile is therefore one patch behind the allowed range.

`npm audit --json` returns 0 vulnerabilities.

`npm ls --all` shows only the deferred sharp WASM extraneous entries (`@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and expected unmet optional dependencies (`fsevents`, `bufferutil`, `utf-8-validate`, `msw`, `canvas`, etc.). No new `extraneous` or phantom workspace entries.

## Version-skew check

Shared dependencies across workspaces are aligned:

- `vite` `^8.1.5` in `akvj` and `mainframe`
- `vitest` `^4.1.10` in `akvj`, `mainframe`, and root
- `@vitest/browser-playwright` `^4.1.10` in `akvj` and `mainframe`

No cross-workspace version skew detected.

## Compatibility

`stylelint-config-recommended@18.0.0` and `stylelint-order@8.1.1` both declare `peerDependencies.stylelint: "^17.0.0"`, so `17.14.1` is within range. This is a low-risk patch update.

## Action requested

1. `[NPM-REQUEST]` Run `npm update stylelint` (or `npm install`) to bump the lockfile to `stylelint@17.14.1`.
2. Re-run `npm run lint:css` to confirm no CSS lint regressions from the patch.

## Tickets referenced

- None (new finding).
