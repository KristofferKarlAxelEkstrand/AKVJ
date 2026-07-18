# Team Update: Editor preview ignores frame duration

## Summary

In the Mainframe clip editor, the per-frame **duration** setting appears to have no effect on the preview playback. Changing a frame's duration doesn't visibly speed up or slow down that frame in the staging/editor preview — it feels like every frame plays at a fixed rate regardless of the value entered.

## Impact

- Authors can't trust the editor preview to reflect real clip timing.
- Timing has to be verified by saving and testing in the live AKVJ engine, which slows down the edit loop and makes duration tuning guesswork.

## Action Needed

Make the editor preview honor per-frame duration so playback in the preview matches the timing that will be written to disk.

- Frame duration (UI ms, backed by `frameRatesForFrames` FPS) should drive how long each frame is shown in the preview.
- Preview timing should stay consistent with what actually renders in the engine after save.

## Notes

- Reported from hands-on use of the editor preview; not yet root-caused.
- Related context: the edit-clip spec keeps timing in **ms** in the UI and converts to/from FPS (`frameRatesForFrames`) on disk — see `.agents/workflows/developer-team/spec/feature-edit-clip.md` (§2, §3).
- Worth confirming whether the preview is using a hardcoded/global frame rate instead of the per-frame durations.
