---
title: Task source: [DEPS]-outdated-deps-jsdom-major
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[DEPS]-outdated-deps-jsdom-major.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: deps
from: quartermaster
created: 2026-07-30T00:00:00Z
---

# Outdated deps sweep

`npm outdated --json` (root, workspace-aware): one item.

| Package | Current | Wanted | Latest | Where | Risk |
| --- | --- | --- | --- | --- | --- |
| `jsdom` | 29.1.1 | 29.1.1 | 30.0.1 | `akvj/package.json` (devDependency, `^29.1.1`) | Major bump, dev-only (Vitest jsdom test env). Review jsdom v30 changelog for env/API breaks before bumping — not urgent, no security driver. |

Needs `npm-request` + range bump in `akvj/package.json` if the team wants to take it. No advisory forcing this; purely a version-currency item.

Everything else clean this sweep:
- `npm audit`: 0 vulnerabilities.
- `mainframe` workspace: `npm outdated` empty.
- No version skew across root/akvj/mainframe shared deps (stylelint patch from the last sweep has since resolved — `17.14.0` range now satisfies latest).
- Lockfile: no `extraneous`/phantom entries beyond the known deferred sharp-WASM optional-dep noise.
- `engines` aligned (`>=20` everywhere) and CI (`node-version: '20'`) matches.
