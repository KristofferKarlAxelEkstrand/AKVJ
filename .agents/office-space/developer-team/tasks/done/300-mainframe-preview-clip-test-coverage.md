---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 300: Strengthen `mainframe/test/PreviewClip.test.js` coverage

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/read/[TEST]-akvj-mainframe-flake-and-preview-coverage.md`

## Description

`mainframe/src/js/PreviewClip.js` (462 lines, used in `mainframe/src/index.html` as `<preview-clip id="clip-editor-preview">`) has a dedicated test file, but `mainframe/test/PreviewClip.test.js` leaves large parts of the public API and lifecycle untested.

## Coverage gaps to address

1. **Playback modes beyond `loop`/`once`**: `pingpong`, `shuffle`, `reverse`, `random`, `scrub` never exercise `#advanceFrame` with `ShuffleState`/`PingpongState`.
2. **#loadClip error paths**: `fetch` 4xx/5xx, `loadImages` `onerror`, malformed JSON.
3. **#normalizeDurationsMs fallback**: `FALLBACK_MS` path and `#getFrameInterval` speed division.
4. **attributeChangedCallback**: `playback-mode`, `is-playing`, and `current-frame` attribute changes.
5. **disconnectedCallback cleanup**: `cancelAnimationFrame`, DOM removal.
6. **currentFrame clamping**: when `totalFrames > 0` (only `totalFrames === 0` is currently tested).
7. **Replace `setTimeout` flush pattern**: the suite uses `await new Promise(resolve => setTimeout(resolve, 0))` to flush `loadClip`; replace with a deterministic helper such as `flushPromises` or `await vi.waitFor`.

## Affected files

- `mainframe/test/PreviewClip.test.js`
- `mainframe/src/js/PreviewClip.js` (if tests reveal needed fixtures or small refactor)

## Verification

- `npm run test -w mainframe` passes.
- `npm run lint -w mainframe` passes.
- Coverage for the new paths is meaningfully improved.

## Notes

- This is test-debt only; no product bug observed.
