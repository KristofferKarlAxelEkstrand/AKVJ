---
type: test
from: test-marshal
created: 2026-07-20T08:40:26Z
---

# Coverage gaps from human review (akvj + mainframe)

The human review files `[REVIEW]-akvj-src-2026-07-20.md` and `[REVIEW]-mainframe-2026-07-20.md` flagged product issues that are not guarded by tests. Add these tests before/while fixing so CI catches regressions.

## Checklist

- [ ] `akvj/src/js/visuals/Compositor.js` — unmasked both-groups path
  - What is missing: `test/Compositor.test.js` tests A-only, B-only, both-empty, and masked cases, but never `mask: null` with `isLayerGroupAEmpty: false, isLayerGroupBEmpty: false`.
  - Cases to add: no mask + both layer groups active; assert mixed canvas contains pixels from both A and B (or `drawImage` is called for both canvases). Current `#drawUnmaskedLayerGroups` uses `if/else if`, so Group B is silently dropped when Group A is active — the test should reproduce this product bug.
  - Tier: unit (jsdom)

- [ ] `akvj/src/js/visuals/ClipLoader.js` — duplicate image decoding
  - What is missing: `test/ClipLoader.test.js` checks that a source URL is loaded, but does not assert the count when the same `clipId` is mapped to multiple notes, velocities, or channels.
  - Cases to add: a key-map that references the same clip on two notes/velocities constructs/decodes the `Image` only once per unique clip; assert `loadedSrcs.length` equals unique clip count. If `maxActiveClips` trimming is implemented, trim before decode or cache after first decode.
  - Tier: unit (jsdom)

- [ ] `akvj/src/js/visuals/MaskManager.js` + `akvj/src/js/midi-input/Midi.js` — singleton settings/appState leak
  - What is missing: `MaskManager` captures `settings.channelMapping.mixer` at field-init time (`#mixerChannel`), so `test/utils/withSettings.js` cannot override the mixer channel per-test. `Midi` imports `appState` and `settings` globally rather than accepting them via constructor/options.
  - Cases to add:
    - Construct `MaskManager` inside `withSettings({ channelMapping: { mixer: 99 } })`, call `setClips` with channel 99, and verify `noteOn(99, ...)` activates the mask.
    - Construct `Midi` with an injected `appState` instance and `settings` object so state/error limits are decoupled from module-level singletons.
  - Tier: unit (jsdom)

- [ ] `mainframe/server/handlers/clips.js` — DELETE does not prune key-map
  - What is missing: `test/server.test.js` `DELETE /api/clips/:clipId` only asserts the clip directory is removed. It does not seed `key-map.json` with the deleted clip.
  - Cases to add: create a clip, map it, delete it, then `GET /api/mapping` must not contain the clip and `PUT /api/mapping` must still succeed. Current code leaves a stale slot; later `writeMapping` throws `clipId "x" is missing or incomplete` at `mappingService.js:89`.
  - Tier: integration (Node HTTP server)

- [ ] `mainframe/server/handlers/clips.js` — PUT /api/clips/:clipId value validation
  - What is missing: `server.test.js` `PUT /api/clips/:clipId` covers whitelisting and 404/400 for clipId, but not value shape (e.g. `{"frames":"banana"}` returns 200 and persists).
  - Cases to add: invalid types for `frames`, `framesPerRow`, `bitDepth`, `playback`, `retrigger`, `scaleMode`, `scaling`, `placement`, `syncBeats`, `beatsPerBar`, etc. return 400 and do not mutate `meta.json`. Reuse `mainframe/scripts/clips/lib/validate/meta.js` or equivalent schema.
  - Tier: integration (Node HTTP server)

- [ ] `mainframe/server/index.js` + `mainframe/server/httpUtils.js` — oversized body returns 500 instead of 413
  - What is missing: `test/httpUtils.test.js` unit-tests `readBody` rejection, but no integration test verifies the router maps the rejected body to 413.
  - Cases to add: POST/PUT with a body larger than `MAX_BODY_BYTES` (32 MiB) returns 413 and does not crash the server. `readBody` rejection must be caught and mapped to 413 before the socket/response is destroyed.
  - Tier: integration (Node HTTP server)
