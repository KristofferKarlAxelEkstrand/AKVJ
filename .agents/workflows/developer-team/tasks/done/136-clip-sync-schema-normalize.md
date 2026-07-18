---
status: done
assignee: akvj-developer
priority: medium
---

# Task 136: Clip Timing & Sync — Slice 1: Schema + Normalize (Free/Beat, Length Presets)

## Source
Spec: `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md`
Slicing roadmap: this is slice 1 of 4. Slices 2–4 are `137-clip-sync-editor-ui.md`,
`138-clip-sync-mapping-override.md`, `139-clip-sync-polish.md` — all sequenced **after**
this one; do not start them until this slice is done and reported (their exact shape may
need small adjustments based on what this slice actually lands, e.g. final helper names).

## Goal
Add clip-level sync settings (`sync`, `syncLength`, `beatsPerBar`, `syncBeats`) to
`meta.json` that expand into the `frameDurationBeats` array the engine already consumes
(`akvj/src/js/visuals/ClipTiming.js`) — no render-hot-path changes. Free/FPS clips (no sync
fields) behave exactly as today.

## Settled Decisions (Team Lead — per spec's "settle in tasking" ask)
These were open questions in the spec; don't re-litigate, just implement:

1. **On-disk shape**: human-readable fields, not a raw total-beats number (Option A from the
   spec, matching `clip-schema.md`'s hand-writable Golden Rule):
   - `sync`: `"free"` (default/omitted) | `"beat"`.
   - `syncLength`: one of a shared preset string list:
     `"1/4 beat"`, `"1/2 beat"`, `"1 beat"`, `"2 beats"`, `"1 bar"`, `"2 bars"`,
     `"4 bars"`, `"8 bars"`, `"custom"`.
   - `syncBeats`: number, **required only when `syncLength === "custom"`** — the raw beat
     count for lengths the presets don't cover.
   - `beatsPerBar`: number, default `4`, any positive integer (3, 5, 6, 7… for odd meters).
     Only meaningful for bar-based presets; ignored for sub-beat/beat presets.
2. **Where expansion happens**: in **akvj's `clipMetadata.js`** (`normalizeClipMetadata`,
   see Task 119), not the mainframe pipeline or editor. Rationale: hand-authored clips
   (meta.json edited directly, never touched in the mainframe UI) must still work — engine
   load time is the one place every clip passes through regardless of authoring path. This
   mirrors the existing "no cross-realm import, keep small logic mirrored" precedent
   (Task 119d, Task 122) — mainframe's editor will need its **own** mirrored copy of the
   same expansion math for live preview (see slice 2), kept in sync manually and documented,
   same as `clipSchema.js` mirrors `clipMetadata.js` today.
3. **Explicit `frameDurationBeats` wins**: if a clip already has `frameDurationBeats` authored
   directly, that's respected as-is and the new `sync`/`syncLength`/`beatsPerBar` fields are
   not applied (avoids surprising a hand-author who wrote the array themselves — Option B
   still works standalone).
4. **No-clock/no-CC BPM fallback**: confirmed unchanged — `settings.bpm.default` (120,
   `akvj/src/js/core/settings.js:33`) already handles this in `ClipTiming.js`; no new code
   needed here, just don't break it.
5. **Playback-mode interaction**: confirmed per spec assumption — the synced length describes
   **one pass**; `playback` modes (loop/pingpong/etc.) repeat that pass exactly as they do
   for FPS-timed clips today. No special-casing needed — `frameDurationBeats` feeds the same
   per-frame-advance path playback modes already use.

## Expansion Algorithm (for `normalizeClipMetadata`)
Only runs when `sync === 'beat'` and `frameDurationBeats` is not already explicitly set:
1. Resolve **total beats** for the clip:
   - `syncLength === 'custom'` → `totalBeats = syncBeats`.
   - Sub-beat/beat presets (`"1/4 beat"` → 0.25, `"1/2 beat"` → 0.5, `"1 beat"` → 1,
     `"2 beats"` → 2) map directly, independent of `beatsPerBar`.
   - Bar presets (`"1 bar"`, `"2 bars"`, `"4 bars"`, `"8 bars"`) → `barCount * beatsPerBar`.
2. Resolve **per-frame base weight**: if `frameRatesForFrames[i]` is set for a frame, its
   weight is `1 / fps_i` (slower FPS = larger relative share); frames without an entry
   default to weight `1` (uniform). This captures "equal by default, or per-frame values if
   tuned" from the spec.
3. Normalize weights to sum to 1, multiply each by `totalBeats` → per-frame beats array of
   length `frames`. This becomes `frameDurationBeats`.
4. Equal-weight sanity check from the spec: 8 frames, `"1 bar"` @ `beatsPerBar: 4` → total 4
   beats → 0.5 beats/frame each. Verify this exact case in tests.

## Mainframe-Side Validation (not expansion — just shape checking)
- `mainframe/scripts/clips/lib/validate/meta.js` (existing `frameDurationBeats` checks around
  lines 17-132): add validation for `sync` (enum), `syncLength` (enum incl. `"custom"`),
  `syncBeats` (positive number, required iff `syncLength === "custom"`), `beatsPerBar`
  (positive integer). Mainframe does **not** compute `frameDurationBeats` from these — that
  stays engine-side per decision #2. Mainframe only validates shape so hand-authors get clear
  errors from `npm run clips`.
- Add the preset list + defaults as shared constants in `mainframe/shared/clipSchema.js`
  (mirrors `PLAYBACK_MODES`/`TRIGGER_TYPES` pattern already there) for slice 2's editor
  dropdown to consume.

## Suggested Tests
- `akvj/test/clipMetadata.test.js`: expansion for each preset, custom beats, odd
  `beatsPerBar` (3, 5, 7), weighted per-frame example from the spec (one frame double
  weight, rest shrink, sum stays `totalBeats`), explicit `frameDurationBeats` takes
  precedence over sync fields, `sync: 'free'`/absent unchanged behavior.
- `mainframe/test/validate-extended.test.js` (or similar): new field shape validation,
  `syncBeats` required-iff-custom, invalid preset/enum rejected.

## Files
- `akvj/src/js/visuals/clipMetadata.js` (`normalizeClipMetadata` — expansion algorithm)
- `mainframe/scripts/clips/lib/validate/meta.js` (shape validation)
- `mainframe/shared/clipSchema.js` (shared preset/default constants)
- `.agents/workflows/developer-team/spec/clip-schema.md` (document new fields — Golden Rule)
- `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md` (reference, no edits needed)
