---
title: Task source: [DEPS]-outdated-vite-jsdom
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[DEPS]-outdated-vite-jsdom.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: deps
from: quartermaster
created: 2026-07-30T00:00:00Z
---

# Outdated deps sweep — 2 items found

Both new since last sweep (previous checks all returned `npm outdated: {}`).

- [ ] **vite** `8.1.5` → `8.2.0` (akvj + mainframe, both `^8.1.5` — in range, no skew)
  Risk: low. Within existing semver range; a lockfile-only bump. Needs `[LOCK]` + `npm-request` (`npm install`/`npm update`) — no manifest edit required.

- [ ] **jsdom** `29.1.1` → `30.0.1` (akvj only, `^29.1.1` pinned)
  Risk: moderate — major version bump, outside current semver range. Needs a `package.json` edit (`^30.0.1`) plus `npm-request`. Check jsdom 30 changelog for breaking changes before bumping; akvj's unit tests run under jsdom (`akvj/test/*.test.js`), so a bad bump would surface as test failures, not a silent break.

No security advisories involved (`npm audit`: 0 vulnerabilities). Both are routine version currency, not urgent.
