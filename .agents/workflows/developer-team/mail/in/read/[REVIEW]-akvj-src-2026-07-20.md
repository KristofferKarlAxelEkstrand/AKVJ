---
type: review
from: human
created: 2026-07-20T06:51:55.792Z
---

# Team Update: akvj/ review

Reviewed `akvj/src/js` (~6.3k lines). `npm run test` green (536 + 18), `npm run lint` clean. Five findings, worst first.

1. **CI-breaking format drift** — `akvj/src/js/visuals/ClipLoader.js` has tab-only blank lines (36, 45, 51, 57, 63, 69…). `npx prettier --check` fails; CI runs `prettier --check .`. Fix: `npm run format:prettier`.
2. **Hot-path GC churn** — `akvj/src/js/visuals/Compositor.js:203-205` allocates 3 fresh `ImageData` (~390 KB) per frame = ~23 MB/s at 60fps, despite the `#pixelBuffers` "reused every frame to avoid GC allocation" comment (only `output` is reused). Hoist A/B/mask buffers or blend via `globalCompositeOperation`.
3. **Layer Group B silently dropped** — `Compositor.js:182-188`: with no mask loaded and both groups active, only A is drawn; B never reaches output. No test covers that combination (`test/Compositor.test.js` only tests one-empty cases). Confirm intent, then document + test.
4. **Duplicate image loads** — `ClipLoader.js:355-371` creates one `Image` + one `Clip` per velocity slot, so a clip mapped across 4 channels × 8 velocities decodes 32 times. Cache by `clipId` within a load pass. Also makes the `maxActiveClips` cap (line 419) cosmetic — it trims after every image already loaded.
5. **Singleton settings leak past DI** — `MaskManager.js:32` and `Midi.js` read the global `settings`/`appState` at field-init while `Renderer`/`AppState` take injection, so `test/utils/withSettings.js` can't override mixer channel or MIDI limits.

Action: 1 is a one-liner — take it now. 2-4 want epics; 3 needs a product call before code.
