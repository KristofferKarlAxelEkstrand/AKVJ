---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 144: Frame Rate = FPS Preset Setter (Writes ms), Not a Standing Clip Property

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-fps-as-ms-setter-not-clip-property.md`

## Confirmed Current Behavior (verified against code)
- The editor already authors real per-frame timing in **ms** — per-frame duration inputs
  (`ClipFrame.js`) plus Task 132's global ms "Set all" (`ClipFrames.setAllDurations()`).
- `#upload-frame-rate` (`mainframe/src/index.html:96`, default 12) reads as "this clip's frame
  rate," but it's **already redundant** in the normal editor flow: `ClipEditorController.js`
  always sends a fully-populated `frameRatesForFrames: durationsMsToFrameRates(frameDurations)`
  object (one FPS entry per frame, derived from each frame's ms), so the server-side
  `frameRate` fallback in `buildClipMeta`
  (`mainframe/server/spritesheet.js:268` — `{ 0: clipOptions.frameRate || DEFAULT_FRAME_RATE }`)
  only ever kicks in when `frameRatesForFrames` is missing/not-an-object — effectively dead in
  the UI's normal path. Confirms the request's premise.
- Shared helpers already exist: `mainframe/shared/frameTiming.js` (`fpsToMs`, `msToFps`,
  `durationsMsToFrameRates`).

## Scope (per user's explicit framing — storage migration is NOT part of this task)
This is a **UX/spec reframing**, not a storage change. `frameRatesForFrames` stays the on-disk
free-mode format; `frameRate` stays as a low-level server fallback default
(`DEFAULT_FRAME_RATE`) — leave that plumbing alone. What changes is what the **editor UI**
does with the field and how it's authored.

## Requirements
1. Turn `#upload-frame-rate` from "the clip's frame rate" into an **FPS preset setter**: pick
   a rate → apply `ms = fpsToMs(fps)` to **every** frame, via the same mechanism Task 132
   built (`ClipFrames.setAllDurations(ms)` / the "Set all" flow) — this is a second entry
   point into the same uniform-duration action, not a parallel timing source.
2. Offer **presets**: 6, 12 (existing default), 15, 24, 25, 30 — pick a UI shape that fits
   next to Task 132's ms "Set all" input (dropdown + apply button, or similar). Don't treat
   this list as exhaustive/locked; 48/60 can come later if it fits.
3. Same **mixed-state behavior as Task 132**: once frames diverge from uniform, the FPS
   presets are just another way to *re-apply* uniform timing — same disable/blank/restore
   logic already built for the ms "Set all" control applies here too (no new mixed-state
   logic to invent — reuse `ClipFrames.areDurationsUniform()`).
4. Do not invent a second parallel timing source on the clip — after applying an FPS preset,
   the result must be indistinguishable on disk from having typed the equivalent ms value
   into "Set all" directly.
5. Keep engine behavior (`ClipTiming.js`) completely untouched — this is authoring-side only.

## Spec Updates
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` /
  `clip-upload-edit-feature.md`: clarify **authoring model is ms-first**; FPS is a
  preset→ms convenience setter, not a first-class per-clip property. Keep noting the on-disk
  encoding (`frameRatesForFrames`) is unchanged for now — explicitly flag ms-on-disk as a
  separate, not-yet-scoped future migration (per the user's note), don't attempt it here.
- Note the relationship to Task 132 (ms "Set all") and Task 130 (preview honors per-frame
  duration) so the three pieces read as one coherent timing model in the spec.

## Suggested Tests
- Applying an FPS preset writes the same per-frame ms as manually computing `1000/fps` and
  using "Set all" — assert equivalence.
- Preset control disables/blanks under the same mixed-duration conditions as Task 132's ms
  "Set all".
- No change to `ClipTiming.js` test suite / engine behavior.

## Files
- `mainframe/src/index.html` (`#upload-frame-rate` → preset control)
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/js/ClipFrames.js` (reuse `setAllDurations`/`areDurationsUniform`, no new API
  expected)
- `mainframe/shared/frameTiming.js` (`fpsToMs` — already exists, just consumed differently)
- `.agents/workflows/developer-team/spec/feature-edit-clip.md`
- `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md`
