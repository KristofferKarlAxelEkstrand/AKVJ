# Team Update: Editor playback speed should default to 1x

## Summary

In the clip editor, the **playback speed** control should default to **1x**. My understanding is
that this speed is **preview-only** — it just changes how fast the staging/editor preview plays,
and does **not** get written to the clip or affect real playback in the engine. Can someone confirm
that's correct?

## Action Needed

- Default the editor playback speed to **1x**.
- Confirm the speed is **preview-only** (not persisted to `meta.json`, no effect on the AKVJ engine).
- If it turns out it *is* persisted / affects real timing, flag that — it would overlap with the
  timing & sync work and should be reconciled.

## Notes

- Related: `spec/feature-clip-timing-and-sync.md` (real per-frame timing / sync lives on the clip
  and mapping — preview speed shouldn't be confused with that).
- Also related: `bug-editor-preview-ignores-frame-duration.md` — preview timing behavior generally.

## Team Lead Confirmation (no task needed — already correct in code)
Checked `mainframe/src/js/StagingPreview.js`:
- **Already defaults to 1x**: `#playbackSpeed = 1` (private field default), and the speed
  `<select>` builder marks the `1` option `selected = true` (`StagingPreview.js:174-187`).
- **Confirmed preview-only**: `grep -rn "playbackSpeed" mainframe/src/ mainframe/server/
  mainframe/scripts/` returns hits only inside `StagingPreview.js` itself — it's never read
  from or written to `meta.json`, never sent in any `api()` save payload, and has no
  localStorage/sessionStorage persistence (none exists anywhere in mainframe). It has zero
  effect on the AKVJ engine.
- No overlap with the timing & sync spec — that's real per-frame `frameDurationBeats`
  authored on the clip/mapping; this is a client-side preview multiplier only, correctly
  separate.
- If the live app is observed defaulting to something other than 1x, that would contradict
  this static analysis and is worth a fresh, separately-reported bug with repro steps —
  but nothing in the source suggests that today.

## Correction (follow-up: `request-preview-default-1x.md`)
Incomplete the first time — the *first-ever* render does default to 1x as analyzed above,
but `loadFrames()` never resets `#playbackSpeed`/`#speedSelect` on subsequent loads, so a
speed chosen for one clip silently carries over to the next. That's what was actually being
observed live. Filed as `tasks/146-staging-preview-reset-speed-on-load.md`.
