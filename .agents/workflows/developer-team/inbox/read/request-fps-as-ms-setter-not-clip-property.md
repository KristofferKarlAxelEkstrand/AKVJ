# Team Update: Frame rate should not be a clip property — FPS as ms setter

## Summary
After looking at how timing actually works today: **authors already think and edit in milliseconds**, so a standing **“frame rate on the clip”** control does not make much sense. FPS is only a useful **convenience setter** that writes ms (especially when bringing in video-style material). Specs and UI should move that direction.

## Research (current state)

| Layer | What it does today |
| ----- | ------------------ |
| Editor UI | Per-frame durations + “Set all” are in **ms** (`<clip-frames>`, `#clip-frames-all-duration`) |
| Still present | A separate **Frame rate** number input (`#upload-frame-rate`, default 12) — mostly fallback for create/preview |
| On disk | Free-mode timing is stored as **`frameRatesForFrames`** (frame index → FPS), converted via `durationsMsToFrameRates` / `fpsToMs` |
| Engine | `ClipTiming.getFrameInterval()` turns FPS back into ms (`1000 / fps`) for free mode; beat sync uses `frameDurationBeats` |
| Specs | `feature-edit-clip.md` / `clip-upload-edit-feature.md` explicitly keep **ms in UI, FPS on disk** |

So we already author in ms and only round-trip through FPS for storage. A clip-level “frame rate” field is confusing and redundant next to real per-frame ms.

## Direction

1. **Do not treat frame rate as a clip setting** the author lives with. Canonical free-mode timing is **per-frame duration in ms** (UI today; storage format can stay FPS for now or migrate later — open to Team Lead).
2. **FPS can still make sense as a setter**: pick a rate → apply `ms = 1000 / fps` to all frames (same job as “Set all”, just video-shaped).
3. **Useful presets** when someone comes from video / animation (not an exhaustive list — pick what fits the UI):
   - **6 / 12** — classic lo-fi / limited animation (12 is already our default fallback)
   - **15** — common halfway rate
   - **24** — film
   - **25** — PAL video
   - **30** — NTSC / common digital video
   (Optional later: 48, 60 — less critical for sprite VJ clips.)

## Impact
- Clip editor chrome: the standalone **Frame rate** field should not read as “this clip’s FPS.”
- Specs that say “keep FPS on disk / Free = FPS” should clarify: **authoring model is ms**; FPS is a **preset→ms helper** (and currently an on-disk encoding), not the mental model.
- Related: `feature-clip-timing-and-sync.md` Free mode wording; `request-global-frame-timing-input.md` (ms “set all”).

## Action Needed
- Update specs: free-mode timing is **ms-first**; drop “frame rate on the clip” as a first-class authored property.
- Redesign editor: either remove `#upload-frame-rate` as a clip property, or replace it with an **FPS preset setter** that only writes uniform ms (and then greys out like “Set all” when frames differ).
- Keep engine behavior correct either way (interval in ms); do not invent a second parallel timing source on the clip.

## Notes
- Shared helpers already exist: `mainframe/shared/frameTiming.js` (`fpsToMs`, `msToFps`, `durationsMsToFrameRates`).
- Whether we later store ms on disk instead of `frameRatesForFrames` is a separate migration question — not required for this UX/spec clarification.
