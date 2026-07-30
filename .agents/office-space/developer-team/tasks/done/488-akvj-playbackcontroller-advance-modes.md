---
status: done
assignee: akvj-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 488 — PlaybackController `advance()` unit tests: once / loop / shuffle

From: `mail/in/read/[TEST]-akvj-playbackcontroller-advance-modes.md` (test-marshal). Tests only.

Extend `akvj/test/PlaybackController.test.js`. Existing suite covers pingpong/random/reverse/scrub; pin once/loop/shuffle at controller level.

## Do

1. **once** — frames 3: advance → 1 true, → 2 true, → stay 2 finished false; further advance stays finished.
2. **loop** — frames 3: advances land 1, 2, 0; always true; optional frames 1 stays 0.
3. **shuffle** (mock `Math.random`) — full pool before repeat; no last-of-cycle as first-of-next; single-frame; `reset()` clears pool.

## Out of scope

`setLinearProgress` (covered); Clip-level shuffle integration in `Clip.test.js`.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
