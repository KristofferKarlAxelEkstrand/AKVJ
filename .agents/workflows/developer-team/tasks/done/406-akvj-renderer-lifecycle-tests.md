---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# 406 — Renderer lifecycle test coverage

From `[TEST]-akvj-renderer-lifecycle-coverage.md` (test-marshal). Test-only — extend
`akvj/test/Renderer.test.js` with `installRAFMocks` + `createMockContext` from
`akvj/test/utils/rendererFixture.js`.

**Do not change `akvj/src/`.** If a test exposes a real defect in `Renderer.js`, stop and send a
`blocked` message naming the file:line — do not fix it under this task.

- `Renderer.js:148 freeze()` — after `start()` + one frame, freeze and run the next RAF callback:
  no new `displayContext.fillRect`, no new `clip.renderToContext`, and `requestAnimationFrame` is
  still scheduled (the loop must keep running, not die).
- `Renderer.js:155 unfreeze()` — after a skipped frozen frame, unfreeze and run the next RAF
  callback: clips render again and the canvas is cleared.
- `Renderer.js:111 stop()` — assert `cancelAnimationFrame` gets the stored frame id, and a RAF
  callback captured before `stop()` is a no-op afterwards (`#isRunning` guard, `Renderer.js:164`).
- `Renderer.js:69 start()` idempotency — two `start()` calls schedule exactly one RAF.
- `Renderer.js:92 #warmup` — `start()` renders synchronously (clip `renderToContext` and display
  `fillRect` before any RAF callback fires) and effects are **not** applied during warm-up
  (`Renderer.js:74`).

## Verify

- `npm run lint && npm run test`
- `git diff --stat akvj/src/` is empty.
