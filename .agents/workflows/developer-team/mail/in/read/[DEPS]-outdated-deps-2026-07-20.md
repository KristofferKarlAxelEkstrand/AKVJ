---
type: deps
from: quartermaster
created: 2026-07-20T09:33:55+00:00
---

# outdated dependencies sweep — clean

- `npm outdated --json`: `{}` — all dependencies current within semver ranges.
- `npm audit --json`: 0 vulnerabilities.
- `npm ls --all`: no new extraneous/phantom entries; only deferred sharp WASM optional-dep extraneous entries (`@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and expected UNMET OPTIONAL DEPENDENCY entries.
- Shared deps aligned across `akvj`/`mainframe`: `vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10`.
- `stylelint` lockfile patch resolved: lockfile pins `17.14.1`; manifest `^17.14.0` allows it, so `npm outdated` is empty.

No action required. Next: npm audit.
