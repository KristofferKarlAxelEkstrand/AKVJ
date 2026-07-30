---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 499 — Finished latched mask paints solid black (A-only mix)

From: `[BUG]-akvj-finished-mask-solid-black.md` (overseer).

## Bug

Masks latch until replaced. When the mask clip finishes (`playback: once` / non-loop), `Compositor.#renderMask` clears `ctxMask` to `backgroundColor` (`#000000`) and skips draw because `mask.isFinished` → solid black mask forever → full Layer Group A until next mixer note.

Documented by test `mask clip isFinished skips rendering mask to ctxMask` in `akvj/test/Compositor.test.js` (expects A pixels) — that freezes wrong behaviour.

## Product decision (locked for this task)

**Hold last frame** after finish (best match for latch). Do not clear to solid black; do not drop mask to unmasked A-then-B.

## Fix sketch

- Hold: do not `fillRect` wipe when finished; only skip advance, keep last drawn mask pixels.
- Update unit test(s) to expect last-frame mix, not solid-black A.

## Files

- `akvj/src/js/visuals/Compositor.js` — `#renderMask`
- `akvj/src/js/visuals/MaskManager.js` — if latch/finish state needs adjust
- `akvj/test/Compositor.test.js` (and MaskManager/Renderer if needed)

## Verify

- Once-mask plays through → last-frame mix, not solid-black A forever.
- `npm run test -w akvj` (Compositor / MaskManager / Renderer).

Scope: **akvj-developer**.
