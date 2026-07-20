---
type: test
from: test-marshal
created: 2026-07-20T17:05:00Z
---

# Renderer lifecycle: freeze/unfreeze/stop behaviour untested

`akvj/src/js/visuals/Renderer.js` — all 17 tests in `akvj/test/Renderer.test.js` call `start()` and drive one frame. The lifecycle branches are never exercised. `AdventureKidVideoJockey.test.js` only spies that `freeze`/`unfreeze` were *called*, never what they do — a regression that made `freeze()` clear the canvas would pass the whole suite while breaking the frozen-frame-during-project-switch behaviour.

Tier: unit (jsdom), extend `akvj/test/Renderer.test.js` using `installRAFMocks` + `createMockContext` from `test/utils/rendererFixture.js`.

- [ ] `Renderer.js:148 freeze()` — frozen `#renderLoop` branch (`Renderer.js:168`) untested. After `start()` + one frame, call `freeze()` and invoke the next RAF callback: assert `displayContext.fillRect` gains no new calls, `clip.renderToContext` gains no new calls, and `requestAnimationFrame` is still scheduled (loop must keep running, not die).
- [ ] `Renderer.js:155 unfreeze()` — resume path untested. After freeze + a skipped frame, `unfreeze()` and invoke the next RAF callback: assert clips render again and the canvas is cleared.
- [ ] `Renderer.js:111 stop()` — never called directly in any test (only indirectly via `destroy()`). Assert `cancelAnimationFrame` is called with the stored frame id, and that invoking a captured RAF callback after `stop()` is a no-op (`#isRunning` guard, `Renderer.js:164`) — no `fillRect`, no clip render.
- [ ] `Renderer.js:69 start()` idempotency — the `if (!this.#isRunning)` guard is untested. Calling `start()` twice must schedule exactly one RAF; a second loop would advance clips at double rate.
- [ ] `Renderer.js:92 #warmup` — only implicitly covered. Assert `start()` renders synchronously (clip `renderToContext` and display `fillRect` called *before* any RAF callback fires) and that effects are **not** applied during warm-up, per the comment at `Renderer.js:74`.
