---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 160: `Compositor.js` — Remove Dead `try/catch` Around Unthrowable Null Assignments

## Source
`.agents/workflows/developer-team/inbox/read/[TECH-DEBT]-compositor-dead-try-catch-null-assignments.md`
(Overseer, following up on an "out of lane" note from the Nitpicker's visuals sweep — verified
directly before filing).

## Problem
`akvj/src/js/visuals/Compositor.js:295-326` — `#releaseCanvasA()`, `#releaseCanvasB()`,
`#releaseMaskAndMixed()` (called from `destroy()`) each wrap plain private-field assignments to
`null` in a `try { ... } catch (error) { console.error(...) }` block. Plain `this.#field = null`
cannot throw — no fallible operation, no `.close()`, no external/DOM call. This is dead
defensive code: the catch branch can never execute. Over-application of AGENTS.md's "individual
try-catch in cleanup methods" convention, which exists for genuinely fallible operations, not
synchronous field writes.

## Fix
Collapse to plain assignments, no try/catch, e.g.:
```js
destroy() {
	this.#canvasA = null;
	this.#ctxA = null;
	this.#canvasB = null;
	this.#ctxB = null;
	this.#ctxMask = null;
	this.#canvasMixed = null;
	this.#ctxMixed = null;
	this.#mixedImageData = null;
}
```
Whether to keep the three private helper methods for grouping/readability, or inline them into
`destroy()` directly, is the implementer's call — either is fine once the try/catch is gone.

## Constraints
- No behavior change — pure dead-code removal.

## Suggested Verification
- `npm run lint`
- `npm run test` (`Compositor` / `Renderer` coverage should be unaffected)
- `npm run build`

## Files
- `akvj/src/js/visuals/Compositor.js` (lines ~289-327)
