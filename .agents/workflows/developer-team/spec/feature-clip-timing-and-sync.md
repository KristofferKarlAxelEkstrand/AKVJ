# Feature: Clip Timing & Sync

Status: draft / feature request for Team Lead tasking. Not a monolithic PR — break into small slices.

## Goal

Give every clip a clear **timing & sync** behavior that is:

1. A **setting on the clip** (`meta.json`) — the clip's own default.
2. **Overridable per placement in the mapping** (`key-map.json`) — the same clip can be
   free-running in one slot and beat-locked to one bar in another, without duplicating the clip.

When a clip is set to **sync to MIDI clock / beat**, the author says **how much musical time
the clip should span** (e.g. "one bar", "two beats", "four bars"), and we **recalculate the
per-frame timing** from the base timings the author already set. The author also needs to say
**how many beats are in a bar** (time signature), because "one bar" means something different
in 4/4 vs 3/4 vs 7/8.

---

## Current state (what already exists)

The engine already has two timing modes (see `akvj/src/js/visuals/ClipTiming.js`):

| Mode | Source field | Meaning |
| ---- | ------------ | ------- |
| **Free / FPS** | `frameRatesForFrames` (frame index → FPS) | Wall-clock timing, not musical. Default. |
| **Beat-synced** | `frameDurationBeats` (number or per-frame array of beats) | Each frame lasts N beats; converted to ms via current BPM, or to MIDI-clock pulses at 24 PPQN when a clock is present. |

So the plumbing for beat-synced playback is already there — frames can each be a number of
beats, and when `bpmSource` is the MIDI clock we advance on pulses (`ppqn: 24`,
`pulsesPerFrame = round(beats * 24)`). BPM range is 10–522, default 120 (`settings.js`).

**What's missing** (the ask):

- No **clip-level "sync mode" + musical length** concept the author sets once ("this clip = 1 bar").
- No **time signature / beats-per-bar**, so "a bar" isn't expressible.
- No **per-placement override** in the mapping — sync is baked into the clip only.
- The author sets base FPS/beat timings but there's no **"fit these frames into X musical time"**
  recalculation; they'd have to hand-compute beats-per-frame.

---

## A quick look at the DJ / VJ world (so the model matches how people think)

- **Everything is counted in bars and phrases, not seconds.** DJs beatmatch to a grid; loops and
  effects are chosen in musical units: 1, 2, 4, 8, 16, 32 beats/bars. VJ clips that "breathe" with
  the music are locked to **1 bar, 2 bars, 4 bars** etc., not to a raw FPS.
- **4/4 dominates** house/techno/most electronic and pop — 4 beats per bar. This is the sensible
  default. Phrases are typically 8/16/32 bars.
- **Other meters exist and matter for some music:**
  - **3/4** — waltz (3 beats per bar).
  - **6/8** — felt in 2 (compound), common in some pop/folk.
  - **5/4, 7/8** — odd meters (prog, jazz, folk).
  - (Minor correction to the note in the request: **tango is normally 4/4 or 2/4, not 3/4**; the
    3-beat dance people think of is the **waltz**. So yes, we do want configurable beats-per-bar,
    just tied to the right example.)
- **Loop/quantize sizes are powers-of-two of the beat** in DJ gear (Pioneer/Serato/Traktor loop
  rolls: 1/4, 1/2, 1, 2, 4, 8 beats). Offering musical presets (¼ beat, ½ beat, 1 beat, 1 bar,
  2 bars, 4 bars) will feel native to anyone from that world.
- **MIDI clock is 24 PPQN** (already our `ppqn`), and DAWs/CDJs send Start/Stop/Continue — we
  already consume clock; the sync feature should ride the same grid.

**Takeaway for the model:** let authors think in **bars & beats** with 4/4 as default, expose the
common musical presets, and allow custom beats-per-bar for odd meters.

---

## Proposed model

### 1. Sync is a clip setting, overridable in the mapping

- **Clip default** lives in `meta.json` (the clip's natural behavior).
- **Placement override** lives in `key-map.json` at the slot where the clip is triggered
  (channel → note → velocity). If present, it wins for that placement; otherwise the clip default
  applies. This keeps one clip reusable at different sync settings.

### 2. Two sync modes (author picks one)

| Mode | Behavior |
| ---- | -------- |
| **Free** | Current FPS behavior (`frameRatesForFrames`). No musical locking. |
| **Beat / clock synced** | The clip spans a chosen **musical length**; per-frame timing is recalculated so the whole clip fits that length, and playback follows BPM / MIDI clock. |

### 3. When synced, the author specifies musical length + meter

- **Length**: how much musical time the clip spans. Offer presets that match DJ gear plus a custom
  value:
  - Sub-beat: `¼ beat`, `½ beat`
  - `1 beat`, `2 beats`
  - `1 bar`, `2 bars`, `4 bars`, `8 bars`
  - Custom (beats or bars).
- **Beats per bar** (time signature numerator): default **4**; allow 3, 5, 6, 7, … for odd meters.
  Needed so "1 bar" resolves to the right number of beats.
- We then know **total beats for the clip** = `lengthInBars * beatsPerBar` (or the raw beat length).

### 4. Recalculation — how "fit to N beats" works

The author's **base timings still matter** (they define relative frame weighting), we just scale
them to the musical length:

- Take the base per-frame durations (the frame weights the author set — equal by default, or the
  per-frame values if they tuned individual frames).
- Compute each frame's **share** of the clip.
- Distribute the **total beats** across frames by that share → per-frame **beats**
  (this is exactly the existing `frameDurationBeats` array the engine already consumes).
- Engine converts beats → ms (via BPM) or → clock pulses (`round(beats * 24)`) as it does today.

So the feature is largely a **UI + schema layer** that produces `frameDurationBeats` from a
friendlier "length + meter" input, rather than new render-hot-path code. The editor preview should
reflect the recalculated timing live (ties into the existing report that preview must honor frame
duration).

Equal-weight example: 8 frames, length = 1 bar in 4/4 → total 4 beats → 0.5 beats/frame.
Weighted example: same clip but frame 0 is set twice as long → its share is doubled and the rest
shrink so the whole still sums to 4 beats.

---

## Schema implications (keep it human-first — `clip-schema.md`)

The Golden Rule stands: if it's harder to hand-write, it's a bad change. Two directions to weigh in
tasking (pick one, document it):

- **Option A — author-facing sync fields, engine keeps consuming `frameDurationBeats`.**
  `meta.json` gains readable fields like `sync: "beat"`, `syncLength: "1 bar"` (or
  `syncBeats: 4`), `beatsPerBar: 4`. A build/normalize step (or the loader) expands these into the
  `frameDurationBeats` array the engine already understands. Most human-friendly; keeps the hot path
  unchanged.
- **Option B — author writes `frameDurationBeats` directly** (already supported) and the editor is
  the only place that offers the "length + meter" helper. Simplest code, but hand-authors lose the
  bars/beats convenience.

Recommendation: **Option A** for the clip default (readable intent survives round-trip), with the
same fields allowed as a **mapping override** object per slot in `key-map.json`. Keep FPS
(`frameRatesForFrames`) as the Free-mode source; don't replace it.

---

## User flows

1. **Author a synced clip:** in the editor, switch a clip to *Beat synced*, pick *1 bar*, confirm
   *4 beats/bar*; preview immediately plays the whole clip per bar at the current/default BPM.
2. **Reuse at a different length:** place the same clip in the mapping and override it to *2 bars*
   for a slower, stretched feel — clip file untouched.
3. **Odd meter:** set *beats per bar = 3* for a waltz section so "1 bar" = 3 beats.
4. **Free clip unchanged:** clips with no sync settings keep today's FPS behavior exactly.

## Open questions (settle in tasking)

- Naming of the fields (`sync` / `syncLength` / `beatsPerBar`?) and preset list — keep names obvious.
- Do we express length as **bars + beatsPerBar** or a single **total beats** number on disk?
  (Bars+meter is more human-readable; total beats is what the engine needs.)
- Mapping override shape: a nested object per slot vs. a parallel override map — must stay
  hand-editable and validate cleanly (there's already `validateMapping`).
- What happens with **no clock and no CC BPM**? Fall back to `settings.bpm.default` (120) — confirm.
- Should length presets be shared constants with the DJ-style loop sizes, and surfaced in the
  editor as a dropdown + custom field?
- Interaction with `playback` modes (loop / pingpong / once): does "1 bar" describe one pass, and
  looping just repeats it? (Assume yes; document.)

## Out of scope (for now)

- Changing the 60fps render hot path or the MIDI-clock pulse handling (already works; reuse it).
- Phrase-level (16/32-bar) arrangement/automation — this feature is per-clip length, not a timeline.
- Tempo detection / beat detection from audio — BPM comes from MIDI clock / CC / default only.
- Clip-id / rename changes.

## Suggested slicing

1. Schema + normalize: add clip-level sync fields (Option A) → expand to `frameDurationBeats`;
   keep Free/FPS untouched. Round-trip tests (human-written meta survives).
2. Editor UI: sync mode toggle + length presets + beats-per-bar, live preview using recalculated
   timing.
3. Mapping override: allow the same sync fields per slot in `key-map.json` + `validateMapping`
   support + engine applies override at trigger time.
4. Polish: DJ-style preset constants, default-BPM fallback behavior, docs in `clip-schema.md` /
   `AGENTS.md`.
