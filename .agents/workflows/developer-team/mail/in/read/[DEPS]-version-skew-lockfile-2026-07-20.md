---
type: deps
from: quartermaster
created: 2026-07-20T09:19:13+00:00
---

# version-skew / lockfile hygiene sweep — clean

- `npm audit --json`: 0 vulnerabilities.
- `npm outdated --json`: `{}` — no outdated dependencies.
- `npm ls --all`: only deferred extraneous entries are the 6 sharp WASM optional-dep packages (`@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and expected UNMET OPTIONAL DEPENDENCY platform entries; no `midi-mcp`, no phantom/invalid packages.
- `package-lock.json`: `lockfileVersion: 3`, no `"extraneous"` matches, no `midi-mcp` references.
- Shared deps aligned across `akvj`/`mainframe`: `vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10`.
- `stylelint` lockfile patch resolved: lockfile pins `17.14.1`, `npm outdated` empty.

No action required. Next: config/scripts/engines health.
