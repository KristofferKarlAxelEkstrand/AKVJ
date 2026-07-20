---
type: deps
from: quartermaster
created: 2026-07-20T12:34:16+00:00
---

# npm audit sweep — 2026-07-20

## Current → proposed

- `npm audit --json` → 0 vulnerabilities (info 0, low 0, moderate 0, high 0, critical 0). Risk: none — keep current.
- `npm outdated --json` → `{}` — all dependencies current within semver ranges. Risk: none.
- `npm ls --all` → 6 sharp WASM optional-dep extraneous entries (`@emnapi/*`, `@img/sharp-wasm32`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`) and expected UNMET OPTIONAL DEPENDENCY entries — unchanged, no action. Risk: none (known npm optional-dep behavior).
- `package-lock.json` clean: `midi-mcp` absent; no version skew across `akvj`/`mainframe` (`vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10` aligned). Risk: none.

No security advisories or outdated packages to address.

Next focus: version-skew / lockfile hygiene.
