# Team Update: Global "set all frames" timing input

## Summary

The clip editor should have a single **global timing input** that sets the duration for **all frames** at once. As soon as the user overrides an **individual** frame's timing, the global input becomes **greyed out** (disabled) — because timing is no longer uniform across frames.

## Impact

- Setting timing per-frame is tedious when the author just wants one consistent rate for the whole clip.
- One input to set them all makes the common case fast, while still allowing fine-grained per-frame control when needed.

## Action Needed

- Add a global timing field that applies its value to **every** frame's duration.
- When any **individual** frame timing is changed away from the uniform value, **grey out / disable** the global input (frames are now mixed).
- Decide + document the reset path: how a user gets back to uniform timing so the global input re-enables (e.g. a "reset all" / "set all" action that re-applies one value to all frames).

## Notes

- Timing stays in **ms** in the UI, backed by `frameRatesForFrames` (FPS) on disk — see `.agents/workflows/developer-team/spec/feature-edit-clip.md` (§2, §3).
- Should pair with the earlier report that the preview must honor per-frame duration (`bug-editor-preview-ignores-frame-duration.md`).
- Open question for the task: when the global input is greyed out, should it display the "mixed" state (blank) or the last uniform value? Pick one and document it.
