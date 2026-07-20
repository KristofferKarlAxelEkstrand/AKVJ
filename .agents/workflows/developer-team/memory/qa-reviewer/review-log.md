# QA Reviewer Memory

## Digest

One line per past finding — read this in full before a sweep.

- Key Constraints — **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much a
- Review History
- Approved Tasks — **Task 65**: Revert MaskManager destroy() Calls (Verified changes) [65, 68, 69, 74]
- Batch 1 (Testing/DevOps) — **Task 26a**: AKVJ E2E & Smoke Tests (APPROVED - verified tests pass) [33, 35, 36]
- Batch 2 (Core Visuals/Compositor) — **Task 40**: Fix Compositor ImageData (Reverted by Task 64, but changes were correct at th [40, 64, 41, 44, 45, 50]
- Batch 3 (Data & Loading) — **Task 47**: Remove ClipLoader Redundant Trigger Type Setting (APPROVED) [47, 49, 54, 55, 57, 60]
- Batch 4 (UI/Mainframe Fixes) — **Task 48**: Cache DebugOverlay DOM Element References (APPROVED) [48, 52, 53, 56, 58, 59]
- Additional Inbox Tasks — **Task 51**: Fix AppState.reset() Clock Timeout Race - Test Added (APPROVED) [51, 72, 43, 46, 70, 77]
- Batch 5 (2026-07-18 — cleared a 32-review backlog + 3 same-wake arrivals, 35 total) — Context: this batch had piled up (28+ deep) during a suspected ~11.5h stall from a foregro [152, 153, 155, 156, 128, 158]
- Batch 6 (2026-07-18 — 6 reviews + 1 stale leftover cleanup) — Global gate: lint clean; mainframe 551/551; akvj 448/448. Deleted stale leftover `[TASK]-r [190, 191, 193, 192, 194, 195]
- Batch 7 (2026-07-18 — post-restart, 2 reviews) — akvj suite 457/457. Both MIDI-path fixes; spot-checked production wiring + regression test [200, 201, 197, 198]
- Batch 8 (2026-07-18 — 4 reviews) — **Task 196**: akvj visuals/ naming re-check — `#lastTime`→`#lastTimestamp` (ClipTiming), ` [196, 199, 202, 203, 204]
- Batch 9 (2026-07-19 — stale-leftover cleanup only, no new reviews) — Mailbox root empty on wake. Found `[TASK]-review-239-*` and `[TASK]-review-240-*` sitting  [239, 240]
- Batch 10 (2026-07-19) — **Task 241**: `PlaybackController.setLinearProgress()` for clock-driven beat sync (sync-to [241, 242, 243, 244, 247, 82]
- Batch 11 (2026-07-19 — 3 same-wake arrivals) — Lint clean; mainframe 614/614 passed. Did not re-run full akvj suite for the single-line ` [267, 265, 268]
- Batch 12 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-239-*` and `[TASK]-review-240-*` in `slack/qa-reviewer
- Batch 13 (2026-07-19) — **Task 269**: Add unit test coverage for mainframe/src/js/AkvjMainframe.js (APPROVED — Akv [269, 270, 272, 280, 279, 273]
- Batch 14 (2026-07-19 — post-restart, 5 reviews) — Global gate: lint clean; mainframe 659/659; e2e 13/13; `npm run clips` succeeded; `npm run [278, 274, 277, 283, 282, 275]
- Batch 15 (2026-07-19 — 2 reviews) — **Task 285**: Fix Vitest worker-startup timeouts in mainframe UI tests (APPROVED — split 1 [285, 291]
- Batch 16 (2026-07-19) — **Task 284**: AKVJ UI / utils small readability nits (APPROVED — removed dead `time` field [284, 293, 298]
- Batch 17 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-276-*`, `[TASK]-review-299-*`, and `[TASK]-review-303-
- Batch 18 (2026-07-19 — stale-leftover guard + prompt reload) — Woken by additional reappearing `[TASK]-review-292-*`, `[TASK]-review-294-*`, and `[TASK]-
- Batch 19 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-287-agent-health-smart-restart-monitor.md` in `slack/q
- Batch 20 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-288-agent-health-inspector-agent.md` in `slack/qa-revi
- Batch 21 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-300-*`, `[TASK]-review-305-*`, and `[TASK]-review-307-
- Batch 22 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-306-mainframe-clipCatalog-error-and-edge-paths.md` and
- Batch 23 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-304-e2e-smoke-tier-hygiene.md` and `[TASK]-review-309-
- Batch 24 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-310-akvj-visuals-scrub-coverage.md` and `[TASK]-review
- Batch 25 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-312-mainframe-scripts-naming-magic-numbers.md` and `[T
- Batch 26 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-314-mainframe-new-widgets-naming-nits.md` and `[TASK]-
- Batch 27 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-316-mainframe-pianoroll-lint-failures.md` in `slack/qa
- Batch 28 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-317-akvj-generated-output-gitignore.md` in `slack/qa-r
- Batch 29 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-318-mainframe-shared-unit-honesty-nits.md` in `slack/q
- Batch 30 (2026-07-19 — stale-leftover guard) — Woken by reappearing `[TASK]-review-319-*`, `[TASK]-review-320-*`, and `[TASK]-review-321-

## Recent

### Batch 31 (2026-07-19 — stale-leftover guard)
Woken by reappearing `[TASK]-review-323-akvj-test-trustworthiness-flake-hunt.md` in `slack/qa-reviewer/`. Task ID already archived in `tasks/done/` (323). Applied stale-leftover guard: deleted the file without re-reviewing or re-sending a verdict.

### Batch 32 (2026-07-19 — real review)
- **Task 324**: Mainframe non-JS consistency nits (APPROVED — verified CSS custom-property cleanup in `mainframe/src/styles.css`, `PageShell.scss`, `MappingTable.scss`; dead `--bg` removed, `--warn`/`--page-bg` used correctly, redundant fallbacks removed; `npm run lint -w mainframe` passed; wrote `[APPROVED]-324-*` to `slack/team-lead/`).

### Batch 33 (2026-07-20 — real review)
- **Task 322**: E2E + root config magic-number sweep (APPROVED — `E2E_TIMEOUT_MS` replaces raw `15000` timeouts in `e2e/mainframe.spec.js`, `WEB_SERVER_TIMEOUT_MS` replaces raw `30000` in `playwright.config.js`; `npm run lint`, `npm run test`, `npm run build`, and `npx playwright test --list` all passed; wrote `[APPROVED]-322-*` to `slack/team-lead/`).
- **Task 323**: AKVJ test trustworthiness flake hunt (STALE LEFTOVER — already archived in `tasks/done/`; deleted the reappearing review file without re-reviewing).
- **Task 325**: Mainframe server/spritesheet hook timeouts (APPROVED — `mainframe/vitest.config.js` has `pool: 'forks'`, `forks.singleFork: true`, `testTimeout: 60000`, `hookTimeout: 60000`, `fileParallelism: false`; `npm run lint`, `npm run build -w mainframe`, and targeted `npx vitest run --config mainframe/vitest.config.js` passed; wrote `[APPROVED]-325-*` to `slack/team-lead/`).
- **Task 333**: README.md stale sweep (APPROVED — README channel mapping, directory tree, meta.json example, pipeline scripts path, and velocity-variants paragraph all aligned with current specs; `await-messages.js` `seenFiles` is now `const`; `npm run lint`, `npm run build`, and `npm run test -w akvj` (536 tests) passed; wrote `[APPROVED]-333-*` to `slack/team-lead/`).

### 2026-07-20 08:36 — Wake: no review files in slack/qa-reviewer/; going to await.

### 2026-07-20 09:26 — Approved tasks 326 (mainframe lane check) and 335 (akvj legacy flat-clip cleanup); lint/test/build/clips all pass, no mainframe bleed.

- Area: `akvj/src/js/visuals,mainframe`
- Refs: 326,335

### 2026-07-20 09:27 — Approved task 341 (mainframe delete clip prunes mapping); lint and server.test.js pass.

- Area: `mainframe/server`
- Refs: 341

### 2026-07-20 09:28 — Prompt updated (path routing); exiting to restart session.

### 2026-07-20 09:28 — Wake: no review files in slack/qa-reviewer/; going to await.

### 2026-07-20 12:30 — Wake: no review files in slack/qa-reviewer/; all clean.

### 2026-07-20 12:31 — Empty wake; no review files in slack/qa-reviewer/ or slack/all/.

### 2026-07-20 13:02 — Approved tasks 337 (akvj Compositor GC buffer reuse) and 342 (mainframe PUT meta validation); lint/test/build pass for both workspaces

- Area: `akvj/src/js/visuals,mainframe/server/handlers`
- Refs: 337,342

### 2026-07-20 13:03 — Woken by [PROMPT-UPDATED] broadcast in slack/all; file already consumed, no new reviews; resuming await

- Refs: 337,342
