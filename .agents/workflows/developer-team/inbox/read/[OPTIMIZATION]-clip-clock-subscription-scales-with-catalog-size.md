# [OPTIMIZATION] Every BPM-Synced Clip Subscribes to MIDI Clock for Its Entire Lifetime, Not Just While Active

## Issue Description
`ClipLoader.setupClips()` (`akvj/src/js/visuals/ClipLoader.js:189-207` → `#buildLoadTasks`) eagerly instantiates a `Clip` for **every** entry in the key map at startup, not lazily on first trigger. Any clip with `frameDurationBeats` metadata runs `#initBPMSync()` (`akvj/src/js/visuals/Clip.js:269-284`), which unconditionally does:

```javascript
this.#unsubscribeClock = appState.subscribe(EVENT_MIDI_CLOCK, () => this.#handleClockPulse());
```

This subscription is created once at construction and never torn down until `Clip.destroy()` is called — i.e., it lives for the entire app session, regardless of whether that specific clip is ever selected into a `LayerGroup`'s active set.

`Midi.js` dispatches `EVENT_MIDI_CLOCK` synchronously (`appState.dispatchMIDIClock`) on every incoming 0xF8 clock byte — 24 pulses per quarter note, so roughly every 15-21ms in typical BPM ranges. Because `EventTarget.dispatchEvent` runs listeners synchronously and in order, every clock pulse walks through `#handleClockPulse()` (`Clip.js:454-469`) for **every** BPM-synced clip in the whole loaded catalog, not just the handful currently active on screen. The only early exit is `appState.bpmSource !== BPM_SOURCE_CLOCK` (line 458) — when the clock *is* the active BPM source (the primary real-time-sync use case this feature exists for), there's no per-clip "am I active" check; `#isFinished` defaults to `false` for freshly-constructed, never-triggered clips, so it doesn't short-circuit them either.

Each individual call is cheap (an increment + comparison), so at small catalog sizes this is not a noticeable performance problem today. But it's architecturally the wrong shape: the cost scales with **total clip catalog size** rather than **active clip count**, and this work runs directly inline on the MIDI input dispatch path (shared with note-on/off handling), which is the one path in the app with an explicit latency budget (per `AGENTS.md`: "<20ms MIDI latency"). As the clip bank grows (this is a live-performance VJ tool — clip banks are expected to grow over a project's life), this scales in the wrong direction with no cap.

Note: since `trigger()`/`reset()` resets frame position and `#pulseCount` unconditionally, the silent background pulse-counting on inactive clips has no visible effect on playback — it's pure wasted work, not a correctness bug.

## How to Fix
Only subscribe to `EVENT_MIDI_CLOCK` while a clip is actually active, rather than self-registering globally at construction:
- Move the `appState.subscribe(EVENT_MIDI_CLOCK, ...)` call out of `#initBPMSync()` and into whatever marks a clip "active" (e.g., on trigger / entering a `LayerGroup`'s active set), and call `this.#unsubscribeClock()` when it stops being active (on `stop()`/eviction from active set) — mirroring the pattern already used for cleanup in `destroy()`.
- Alternatively, invert the relationship: have `LayerGroup` (which already tracks its active clips, see Task 49) drive clock-based frame advancement by iterating only its active clips on each clock pulse, rather than each `Clip` self-subscribing to a global event.

## Key Files
- `akvj/src/js/visuals/Clip.js` (`#initBPMSync`, `#handleClockPulse`, `#unsubscribeClock`, `destroy()`)
- `akvj/src/js/visuals/ClipLoader.js` (`setupClips`, `#buildLoadTasks` — confirms eager, whole-catalog instantiation)
- `akvj/src/js/visuals/LayerGroup.js` (candidate owner if inverting to active-set-driven advancement)

## Dependencies
- None. Distinct from Task 41 (double-advancement race) and Task 49 (trigger group Map) — this is about subscription lifetime/scope, not advancement correctness.
