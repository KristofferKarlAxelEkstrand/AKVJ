# The Quartermaster — Supply Log

### 2026-07-20 17:17 — Mail wake: [PROMPT-UPDATED]-mail-out-answer-block.md in slack/all (bare 'Answer:' line must end mail/out questions) — noted, file left for others. Version-skew sweep: 18 shared deps across root/akvj/mainframe, zero skew. No ticket.

## Digest

One line per past finding — read this in full before a sweep.

- ~~`vite` version skew: `akvj` `^8.1.4` vs `mainframe` `^8.1.5` — align.~~ **FIXED** (both now ^8.1.5)
- ~~`package-lock.json` marks `midi-mcp` `extraneous` after the workspace was removed — `npm install` to clean (Team Lead runs it).~~ **FIXED** (2026-07-19; lockfile regenerated, `mi… [2026, 07, 19]
- ~~`engines` mismatch: root+CI say Node 20, CONTRIBUTING says Node 18 — docs fix.~~ **FIXED** (CONTRIBUTING now says Node 20+)
- ~~`knip.json` scans non-existent `akvj/scripts/**` and a removed `midi-mcp` workspace.~~ **FIXED** (dead refs removed)
- ~~`eslint.config.js` ignores dead `midi-mcp/**` paths.~~ **FIXED** (dead refs removed)
- ~~Duplicate npm scripts: `sort-package-json` vs `format:sort-package-json`.~~ **FIXED** (bare alias removed)
- ~~Broken smoke test scripts (.test.js vs .smoke.js).~~ **FIXED** (paths corrected)
- ~~README references Husky/lint-staged that don't exist.~~ **FIXED** (section removed)
- sharp WASM extraneous entries (@emnapi/*, @img/sharp-wasm32, @napi-rs/wasm-runtime, @tybys/wasm-util) — known npm behavior with platform-specific optional deps, not actionable
- UNMET OPTIONAL DEPENDENCY entries (fsevents, bufferutil, utf-8-validate, msw) — expected on Linux or truly optional
- 2026-07-19 | npm audit | 0 vulnerabilities found. No ticket needed. Repo supply-chain health is clean.
- 2026-07-19 | outdated deps | npm outdated returns {} — all dependencies current within semver ranges. No ticket needed.
- 2026-07-19 | outdated deps | npm outdated returns {} — all dependencies current within semver ranges. No ticket needed.
- 2026-07-19 | npm audit | 0 vulnerabilities found. No ticket needed. Repo supply-chain health is clean.
- 2026-07-18 | version-skew / lockfile hygiene | Verified all 6 Wave 2 known items still open. Vite skew (^8.1.4 vs ^8.1.5), midi-mcp extraneous in lockfile, CONTRIBUTING says Node 1… [2026, 07, 18, 20]
- 2026-07-18 | [DEPS]-version-skew-lockfile-config-cleanup.md | 6 findings, routine maintenance, items 1+2 need [LOCK] [2026, 07, 18]
- 2026-07-18 | npm audit | 0 vulnerabilities found. No ticket needed.
- 2026-07-18 | outdated deps | npm outdated returned {} — all deps current within semver ranges. No ticket needed.
- 2026-07-18 | config/scripts/engines + 🎲 special mission (version truth) | Found broken smoke test scripts (root package.json references .test.js but files are .smoke.js), README r… [2026, 07, 18, 22]
- 2026-07-18 | lockfile dedup analysis | npm ls --all shows sharp WASM extraneous entries (known npm behavior, deferred) and expected UNMET OPTIONAL DEPENDENCY entries. midi-mcp extr…
- 2026-07-18 | version-skew / lockfile re-verify | Re-verified all filed items. 7 of 8 FIXED (vite skew, CONTRIBUTING Node version, knip.json dead refs, eslint.config.js dead refs, d…
- 2026-07-18 | npm audit (re-check) | 0 vulnerabilities found. No ticket needed.
- 2026-07-18 | outdated deps + 🎲 special mission (skew check) | npm outdated returns {} — all current. Cross-referenced all shared deps across root/akvj/mainframe: @vitest/browser-p…
- 2026-07-18 | config/scripts/engines + 🎲 special mission (audit day) | npm audit: 0 vulnerabilities. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No other…
- 2026-07-18 | lockfile hygiene + 🎲 special mission (lockfile sanity) | npm ls --all: 6 sharp WASM extraneous entries (deferred — known npm behavior). No phantom/missing/invalid ent…
- 2026-07-18 | npm audit | 0 vulnerabilities. No ticket needed. Repo supply-chain health is clean.
- 2026-07-18 | outdated deps | npm outdated returns {} — all current. No ticket needed.
- 2026-07-18 | config/scripts/engines health | npm audit: 0 vulns. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). knip reports unused files (akvj/test/smoke/a…
- 2026-07-18 | version-skew / lockfile hygiene | midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No version skew — all shared deps aligned. No new findings.
- 2026-07-18 | npm audit | 0 vulnerabilities. No ticket needed.
- 2026-07-18 | outdated deps | npm outdated returns {} — all current. No ticket needed.
- 2026-07-18 | config/scripts/engines health | root/akvj/mainframe engines aligned (Node 20+), CONTRIBUTING/devcontainer/CI consistent. knip.json clean, no dead midi-mcp/akvj-scripts…
- 2026-07-18 | version-skew / lockfile hygiene | No version skew across root/akvj/mainframe. Lockfile packages.extraneous: only `midi-mcp` (already filed, pending [LOCK]). npm ls: sh…
- 2026-07-19 | npm audit | 0 vulnerabilities found. npm outdated returns {} — all deps current within semver ranges. No new findings. midi-mcp extraneous still in lockfile (already f…
- 2026-07-19 | outdated deps + lockfile hygiene | `npm outdated` returns `{}`; `npm audit` 0 vulns. `package-lock.json` still contains `midi-mcp` marked extraneous at line ~53; Task … [2026, 07, 19, 53]
- 2026-07-19 | version-skew / lockfile + config hygiene | `npm outdated` empty; `npm audit` 0 vulns; no version skew across root/akvj/mainframe (`vite ^8.1.5`, `vitest ^4.1.10` align… [2026, 07, 19, 10]
- 2026-07-19 | outdated deps + lockfile hygiene | Processed `[REPORT]-266-midi-mcp-lockfile-regeneration.md` from slack. Verified `midi-mcp` removed from `package-lock.json` (no `ext… [2026, 07, 19, 266]
- 2026-07-19 | config/scripts/engines health | `npm outdated` `{}`, `npm audit` 0 vulns, no version skew, lockfile clean. Found phantom Husky/lint-staged refs in `AGENTS.md` and `CON… [2026, 07, 19]
- 2026-07-19 | npm audit | `npm audit` 0 vulns, `npm outdated` `{}`, no version skew, lockfile clean (no `midi-mcp`/extraneous). `knip` still flags unlisted `vitest` and top-level `e… [2026, 07, 19, 276]
- 2026-07-19 | version-skew / lockfile hygiene | `npm outdated` `{}`; `npm audit` 0 vulns; `package-lock.json` no extraneous entries; shared deps aligned (`vite ^8.1.5`, `vitest ^4.1… [2026, 07, 19, 10]
- 2026-07-19 | config/scripts/engines health | `npm outdated` `{}`; `npm audit` 0 vulns; `engines` aligned across root/CI/devcontainer. No new findings. Phantom Husky refs, root `vit… [2026, 07, 19, 276]
- 2026-07-19 | npm audit | `npm audit` 0 vulns; `npm outdated` `{}`; lockfile clean (`midi-mcp` resolved, only deferred sharp WASM extraneous + expected unmet optional deps). Filed `… [2026, 07, 19]
- 2026-07-19 | version-skew / lockfile hygiene | `npm outdated` `{}`; `npm audit` 0 vulns; `package-lock.json` no extraneous entries; `midi-mcp` fully absent from tracked files; shar… [2026, 07, 19, 10]
- 2026-07-19 | config/scripts/engines health | `npm outdated` `{}`; `npm audit` 0 vulns; engines aligned (root `>=20`, CI `20`, devcontainer Node 22); all root scripts resolve; `knip… [2026, 07, 19, 20]
- 2026-07-19 | npm audit | `npm audit --json`: 0 vulnerabilities; `npm outdated --json`: `{}`; `npm ls --all`: no new extraneous/phantom entries (only deferred sharp WASM optional de… [2026, 07, 19]
- 2026-07-20 | version-skew / lockfile hygiene | `npm outdated --json` reports `stylelint` `17.14.0` → `17.14.1` patch update; `package-lock.json` pins the older patch. No version sk… [2026, 07, 20, 17]
- Area: `config/scripts/engines`
- Area: `supply-chain`
- Area: `supply-chain`
- Area: `supply-chain`
- Area: `meta`
- Area: `supply-chain`
- Area: `config/scripts/engines`
- Refs: 351
- Area: `supply-chain`
- Area: `config/scripts/engines`
- Area: `config/scripts/engines`
- Refs: 357,356
- Area: `supply-chain`
- Area: `supply-chain`
- Area: `supply-chain`

## Recent

- Area: `config/scripts/engines`

- Refs: 357

- Area: `supply-chain`

- Area: `supply-chain`

- Area: `supply-chain`

- Area: `config/scripts/engines`

- Area: `supply-chain`

- Area: `supply-chain`

- Area: `supply-chain`

- Area: `config/scripts/engines`

- Area: `supply-chain`

- Area: `supply-chain`
