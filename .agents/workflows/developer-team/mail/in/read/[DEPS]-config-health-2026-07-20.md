---
type: deps
from: quartermaster
created: 2026-07-20T08:40:19Z
---

# Config/scripts/engines health — 2026-07-20

Clean sweep. No new dependency, lockfile, or script-path findings.

- `npm outdated --json` → `{}` (stylelint `17.14.0 → 17.14.1` from 2026-07-20 sweep is now resolved in `package-lock.json`)
- `npm audit --json` → 0 vulnerabilities
- `npm ls --all` → only deferred sharp WASM extraneous optional deps + expected unmet optional deps
- No version skew across root/akvj/mainframe (`vite ^8.1.5`, `vitest ^4.1.10`, `@vitest/browser-playwright ^4.1.10` aligned)
- All root `package.json` scripts resolve to existing files/paths
- `engines` aligned: root `>=20`, CI `20`, devcontainer Node 22
- `knip.json` and `eslint.config.js` contain no dead paths or removed workspace refs
- `akvj/test/smoke/akvj-startup.smoke.js` still unreferenced (knip unused-file territory; previously deferred to Test Marshal)

**Tracked elsewhere:** stale doc paths (`CONTRIBUTING.md`, `docs/how-to-program-midi.md`, `README.md` `migrate:clips` reference) and `clips/` empty folder are already captured in `epics/todo/refactor-for-greatness-2.md` Task S8, not re-filed.

Next focus: `npm audit`.
