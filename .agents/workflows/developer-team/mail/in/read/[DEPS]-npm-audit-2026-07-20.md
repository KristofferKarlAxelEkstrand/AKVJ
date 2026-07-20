---
type: deps
from: quartermaster
created: 2026-07-20T09:17:42+00:00
---

# npm audit sweep — clean

- `npm audit --json`: 0 vulnerabilities (info 0, low 0, moderate 0, high 0, critical 0).
- `npm outdated --json`: `{}` — all dependencies current within semver ranges.
- `npm ls --all`: no new extraneous/phantom/invalid entries; `midi-mcp` fully absent from lockfile.
- Deferred items unchanged: sharp WASM optional-dep extraneous entries (`@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and expected UNMET OPTIONAL DEPENDENCY entries (`fsevents`, `bufferutil`, `utf-8-validate`, `msw`) — known npm behavior, already in digest.
- Shared deps aligned across `akvj`/`mainframe`: `vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10`.
- Prior `stylelint` 17.14.0 → 17.14.1 lockfile patch is resolved: `package-lock.json` now pins `17.14.1`, `npm outdated` empty.

No action required. Next: version-skew / lockfile hygiene.
