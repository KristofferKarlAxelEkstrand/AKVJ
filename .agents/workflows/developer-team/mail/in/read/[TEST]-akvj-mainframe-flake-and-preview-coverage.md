# Test Marshal — flake hunt + new custom-element coverage sweep

Area: akvj timing tests + mainframe `<preview-clip>` element

## Findings

- `akvj/test/ClipTiming.test.js` line 253 contains a vacuous assertion:
  `expect(true).toBe(true)` inside the test "random/shuffle: sync fields are irrelevant — not exercised here...".
  The comment explains that the behavior lives in `Clip.js`, so the test passes no matter what.
  This is a trust / flake risk because it inflates pass counts without exercising any code path.
  - Action: remove the placeholder, or move the assertion to `Clip.test.js` verifying that `Clip` does NOT pass `syncBeats` to `ClipTiming` for `random`/`shuffle` playback modes.
  - Tier: unit (akvj)

- `mainframe/src/js/PreviewClip.js` (462 lines, used in `mainframe/src/index.html` as `<preview-clip id="clip-editor-preview">`) has a dedicated test file, but `mainframe/test/PreviewClip.test.js` leaves most of the public API and lifecycle untested:
  - Playback modes other than `loop`/`once` (`pingpong`, `shuffle`, `reverse`, `random`, `scrub`) never exercise `#advanceFrame` with `ShuffleState`/`PingpongState`.
  - `#loadClip` error paths (`fetch` 4xx/5xx, `loadImages` `onerror`, malformed JSON) are not covered.
  - `#normalizeDurationsMs` fallback to `FALLBACK_MS` and `#getFrameInterval` speed division are not exercised.
  - `attributeChangedCallback` for `playback-mode`, `is-playing`, and `current-frame` is not tested.
  - `disconnectedCallback` cleanup (cancelAnimationFrame, DOM removal) has no test.
  - `currentFrame` clamping when `totalFrames > 0` is not tested (only the `totalFrames === 0` case).
  - The test suite uses `await new Promise(resolve => setTimeout(resolve, 0))` to flush `loadClip`; this is a fragile timing pattern.
  - Action: strengthen unit tests for the above cases; replace `setTimeout` flushes with a deterministic flush helper (e.g. `flushPromises` or `await vi.waitFor`).
  - Tier: unit (mainframe/jsdom)

## Product bug note
None observed. The vacuous test and coverage gaps are test-debt only.

## Next sweep area
akvj src/visuals/core (`midiConstants.js`, `snapToPixel.js`, `timing.js`) or mainframe server/pipeline (per coverage log rotation).
