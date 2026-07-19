# The Quartermaster — Supply Log

Running record of dependency/config checks so I don't re-report. One line per finding:
`YYYY-MM-DD | focus | finding | ticket filed / deferred (why)`. Track sweep rotation too.

## Next sweep focus
outdated deps

## Known items from the Wave 2 review (verify current, then file if still open)
- ~~`vite` version skew: `akvj` `^8.1.4` vs `mainframe` `^8.1.5` — align.~~ **FIXED** (both now ^8.1.5)
- `package-lock.json` marks `midi-mcp` `extraneous` after the workspace was removed — `npm install` to clean (Team Lead runs it). **STILL OPEN — needs [LOCK]**
- ~~`engines` mismatch: root+CI say Node 20, CONTRIBUTING says Node 18 — docs fix.~~ **FIXED** (CONTRIBUTING now says Node 20+)
- ~~`knip.json` scans non-existent `akvj/scripts/**` and a removed `midi-mcp` workspace.~~ **FIXED** (dead refs removed)
- ~~`eslint.config.js` ignores dead `midi-mcp/**` paths.~~ **FIXED** (dead refs removed)
- ~~Duplicate npm scripts: `sort-package-json` vs `format:sort-package-json`.~~ **FIXED** (bare alias removed)
- ~~Broken smoke test scripts (.test.js vs .smoke.js).~~ **FIXED** (paths corrected)
- ~~README references Husky/lint-staged that don't exist.~~ **FIXED** (section removed)

## Deferred (do not re-file)
- sharp WASM extraneous entries (@emnapi/*, @img/sharp-wasm32, @napi-rs/wasm-runtime, @tybys/wasm-util) — known npm behavior with platform-specific optional deps, not actionable
- UNMET OPTIONAL DEPENDENCY entries (fsevents, bufferutil, utf-8-validate, msw) — expected on Linux or truly optional

## Sweeps
- 2026-07-19 | npm audit | 0 vulnerabilities found. No ticket needed. Repo supply-chain health is clean.
- 2026-07-19 | outdated deps | npm outdated returns {} — all dependencies current within semver ranges. No ticket needed.
- 2026-07-19 | outdated deps | npm outdated returns {} — all dependencies current within semver ranges. No ticket needed.
- 2026-07-19 | npm audit | 0 vulnerabilities found. No ticket needed. Repo supply-chain health is clean.
- 2026-07-18 | version-skew / lockfile hygiene | Verified all 6 Wave 2 known items still open. Vite skew (^8.1.4 vs ^8.1.5), midi-mcp extraneous in lockfile, CONTRIBUTING says Node 18 vs engines/CI Node 20, knip.json dead midi-mcp + akvj/scripts paths, eslint.config.js dead midi-mcp refs, duplicate root scripts (sort-package-json vs format:sort-package-json). Root clips:* vs mainframe clips:* are workspace-relative proxies, not true duplicates — did not flag. | Filed [DEPS]-version-skew-lockfile-config-cleanup.md

## Filed tickets
- 2026-07-18 | [DEPS]-version-skew-lockfile-config-cleanup.md | 6 findings, routine maintenance, items 1+2 need [LOCK]
- 2026-07-18 | npm audit | 0 vulnerabilities found. No ticket needed.
- 2026-07-18 | outdated deps | npm outdated returned {} — all deps current within semver ranges. No ticket needed.
- 2026-07-18 | config/scripts/engines + 🎲 special mission (version truth) | Found broken smoke test scripts (root package.json references .test.js but files are .smoke.js), README references Husky/lint-staged that don't exist. CONTRIBUTING Node 18 vs reality already filed in prior ticket. Devcontainer uses Node 22, CI uses Node 20 — documented correctly in README+AGENTS.md, not a mismatch. | Filed [DEPS]-config-health-broken-scripts-phantom-husky.md
- 2026-07-18 | lockfile dedup analysis | npm ls --all shows sharp WASM extraneous entries (known npm behavior, deferred) and expected UNMET OPTIONAL DEPENDENCY entries. midi-mcp extraneous still in lockfile (already filed, pending Team Lead action). No new findings.
- 2026-07-18 | version-skew / lockfile re-verify | Re-verified all filed items. 7 of 8 FIXED (vite skew, CONTRIBUTING Node version, knip.json dead refs, eslint.config.js dead refs, duplicate sort-package-json script, broken smoke test paths, README Husky/lint-staged). 1 STILL OPEN: midi-mcp extraneous in package-lock.json — needs [LOCK] (npm install). Already filed, no new ticket needed.
- 2026-07-18 | npm audit (re-check) | 0 vulnerabilities found. No ticket needed.
- 2026-07-18 | outdated deps + 🎲 special mission (skew check) | npm outdated returns {} — all current. Cross-referenced all shared deps across root/akvj/mainframe: @vitest/browser-playwright ^4.1.10, vite ^8.1.5, vitest ^4.1.10 — all aligned. No skew found. No ticket needed.
- 2026-07-18 | config/scripts/engines + 🎲 special mission (audit day) | npm audit: 0 vulnerabilities. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No other JSON files reference midi-mcp. All config files clean. No new findings.
- 2026-07-18 | lockfile hygiene + 🎲 special mission (lockfile sanity) | npm ls --all: 6 sharp WASM extraneous entries (deferred — known npm behavior). No phantom/missing/invalid entries. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No new findings.
- 2026-07-18 | npm audit | 0 vulnerabilities. No ticket needed. Repo supply-chain health is clean.
- 2026-07-18 | outdated deps | npm outdated returns {} — all current. No ticket needed.
- 2026-07-18 | config/scripts/engines health | npm audit: 0 vulns. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). knip reports unused files (akvj/test/smoke/akvj-startup.smoke.js, 5 monorepo-scripts/test/*.test.js) — not in my lane (test coverage/dead code → Test Marshal/Overseer). No new config/dependency findings.
- 2026-07-18 | version-skew / lockfile hygiene | midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No version skew — all shared deps aligned. No new findings.
- 2026-07-18 | npm audit | 0 vulnerabilities. No ticket needed.
- 2026-07-18 | outdated deps | npm outdated returns {} — all current. No ticket needed.
- 2026-07-18 | config/scripts/engines health | npm audit: 0 vulns. npm outdated: {}. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No midi-mcp refs in any .js or .json files except package-lock.json. All config clean. No new findings.
- 2026-07-18 | version-skew / lockfile hygiene | midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No version skew. No new findings.
- 2026-07-18 | npm audit | 0 vulnerabilities. No ticket needed.
- 2026-07-18 | outdated deps | npm outdated returns {} — all current. No ticket needed.
- 2026-07-18 | config/scripts/engines health | root/akvj/mainframe engines aligned (Node 20+), CONTRIBUTING/devcontainer/CI consistent. knip.json clean, no dead midi-mcp/akvj-scripts refs. eslint.config.js ignores clean. test:smoke → mainframe/test/smoke/startup.smoke.js exists (fix from task 173 holding). No duplicate scripts in root/akvj/mainframe. CI workflow script refs all resolve. akvj/test/smoke/akvj-startup.smoke.js remains unreferenced by any script (knip dead-code territory, not my lane). midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No new findings.
- 2026-07-18 | version-skew / lockfile hygiene | No version skew across root/akvj/mainframe. Lockfile packages.extraneous: only `midi-mcp` (already filed, pending [LOCK]). npm ls: sharp WASM extraneous + expected UNMET OPTIONAL deps (deferred). Workspaces: akvj, mainframe. No new ticket.
- 2026-07-19 | npm audit | 0 vulnerabilities found. npm outdated returns {} — all deps current within semver ranges. No new findings. midi-mcp extraneous still in lockfile (already filed, pending [LOCK]). No ticket needed.
