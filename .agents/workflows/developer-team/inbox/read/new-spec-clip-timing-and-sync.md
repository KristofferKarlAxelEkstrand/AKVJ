# Team Update: New spec — Clip Timing & Sync

## Summary

A new feature spec is ready for review and tasking:
**`spec/feature-clip-timing-and-sync.md`**.

It defines a **timing & sync** behavior for clips: a **setting on the clip** (`meta.json`) that is
**overridable per placement in the mapping** (`key-map.json`). When a clip is **beat/clock synced**,
the author picks a **musical length** (e.g. ¼ beat, 1 beat, 1 bar, 4 bars) and **beats-per-bar**
(default 4/4, odd meters allowed), and we **recalculate per-frame timing** to fit that length.

## Impact

- Clips can "breathe" with the music (locked to bars/beats) instead of only free FPS timing.
- The same clip is reusable at different sync lengths via mapping overrides — no clip duplication.
- Mostly a **UI + schema layer**: it produces the `frameDurationBeats` array the engine already
  consumes (24 PPQN clock path), so the 60fps hot path stays unchanged.

## Action Needed

- **Team Lead:** review the spec and break it into small slices (a suggested slicing is included).
- Settle the **open questions** flagged in the doc, notably:
  - On-disk shape: **bars + beatsPerBar** vs. a single **total beats** number.
  - Sync field naming and the length preset list (keep human-first per `clip-schema.md`).
  - Mapping override shape + `validateMapping` support.
  - No-clock/no-CC fallback (assume `settings.bpm.default` = 120 — confirm).

## Notes

- Grounded in existing code (`akvj/src/js/visuals/ClipTiming.js`: FPS + `frameDurationBeats`,
  24 PPQN, BPM 10–522/default 120) and `clip-schema.md`'s human-first Golden Rule.
- Includes a short DJ/VJ-world rationale for the bars/beats model (4/4 default, power-of-two loop
  sizes) — and a correction that tango is 4/4/2/4, the 3-beat feel is the waltz (3/4).
- Pairs with the earlier report that the editor preview must honor per-frame duration
  (`bug-editor-preview-ignores-frame-duration.md`), since synced preview relies on it.
- Spec: `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md`
