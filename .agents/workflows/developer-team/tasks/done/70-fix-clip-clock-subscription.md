# Task 70: Fix Clip Clock Subscription Scales With Catalog Size

## Severity: Medium (Performance/Architecture)

## Location
- `akvj/src/js/visuals/Clip.js:269-284` — `#initBPMSync()`
- `akvj/src/js/visuals/ClipLoader.js:189-207` — `#buildLoadTasks`
- `akvj/src/js/visuals/LayerGroup.js` — candidate owner for active-set-driven approach

## Problem
Every BPM-synced clip subscribes to `EVENT_MIDI_CLOCK` at construction time and stays subscribed for its entire lifetime — even when not active. With 24 pulses per quarter note (~15-21ms), every clock pulse walks through `#handleClockPulse()` for every BPM-synced clip in the catalog.

The cost scales with total clip catalog size, not active clip count. This runs inline on the MIDI input dispatch path which has a <20ms latency budget.

## Fix
Only subscribe to `EVENT_MIDI_CLOCK` while a clip is actually active:
- Move `appState.subscribe(EVENT_MIDI_CLOCK, ...)` from `#initBPMSync()` into trigger/activation
- Call `this.#unsubscribeClock()` when clip stops being active
- Alternatively, have `LayerGroup` drive clock-based advancement for active clips only

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify BPM-synced clips still advance correctly when active

## Key Files
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/visuals/LayerGroup.js`

## Dependencies
- None. Distinct from Task 41 (double-advancement) and Task 49 (trigger group Map)
- Found by QA Reviewer
