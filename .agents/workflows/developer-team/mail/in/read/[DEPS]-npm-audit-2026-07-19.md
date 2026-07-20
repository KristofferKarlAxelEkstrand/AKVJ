# [DEPS] npm audit / supply sweep

## Focus

npm audit

## Findings

- `npm audit --json`: 0 vulnerabilities (info/low/moderate/high/critical all 0).
- `npm outdated --json`: `{}` — all dependencies current within semver ranges.
- `npm ls --all`: no new extraneous or phantom entries. `midi-mcp` no longer appears in `package-lock.json`.
- Only expected deferred entries remain: sharp WASM optional dependencies (`@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and UNMET OPTIONAL DEPENDENCY entries (`fsevents`, `bufferutil`, `utf-8-validate`, `msw`) — known npm behavior on Linux.
- Cross-workspace shared deps are aligned: `vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10` in both `akvj` and `mainframe`.
- `knip` still reports the root `vitest` unlisted binary and the `knip.json` top-level `entry` warning; these are already covered by Task 276 (`config/scripts/engines health sweep`) and are not re-filed here.

## Action required

None for this sweep. Supply-chain/config health remains clean on the security and version fronts.
