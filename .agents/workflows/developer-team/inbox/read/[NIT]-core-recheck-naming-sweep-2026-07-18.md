# [NIT] akvj/src/js/core/ — naming re-check (2026-07-18)

Small gifts from a re-sweep of `AdventureKidVideoJockey.js`, `AppState.js`, and
`settings.js`. Prior core nits look happily applied (`#initializeVisuals`,
`#loadedClips`, `#lastClockTimestamp`) — celebrate those. `settings.js` is still
a model citizen (clear domain keys, units on `clockTimeoutMs`).

## Checklist

- [ ] **Teardown name lies about scope** — `akvj/src/js/core/AdventureKidVideoJockey.js`
  - Current: `#teardownMIDIEventListeners()`
  - Proposed: `#teardownEventListeners()` (or `#unsubscribeAll()`)
  - Why: it clears `#unsubscribers`, which also holds the project-switch subscription
    from `#setupProjectEventListeners`. Callers in `disconnectedCallback` look like
    they only tear down MIDI; they tear down everything.

- [ ] **One event, two meanings** — `akvj/src/js/core/AppState.js`
  - Current: `EVENT_PROJECT_SWITCH` / `projectSwitch` fired by both
    `dispatchProjectSelection(note)` (`{ note }` = please switch) and the
    `activeProjectId` setter (`{ projectId }` = also treated as a switch request,
    and also written *after* a successful switch in `#switchProject`)
  - Proposed: split the names — e.g. keep `EVENT_PROJECT_SWITCH` (or
    `dispatchProjectSwitchRequest`) for *requests*, and either (a) make the
    `activeProjectId` setter silent / dispatch `EVENT_ACTIVE_PROJECT_CHANGED`, or
    (b) stop setting `appState.activeProjectId` from inside the switch success path
    in a way that re-fires the request event
  - Why: newcomers can't tell "please switch" from "active id updated" in five
    seconds; the success-path re-fire only works because of an equality short-circuit

- [ ] **Velocity constant used for CC** — `akvj/src/js/core/AppState.js` → `#convertCCToBPM`
  - Current: `ccValue / MAX_MIDI_VELOCITY` (imported from `effectConstants.js`)
  - Proposed: introduce / use a domain-honest name such as `MAX_MIDI_DATA_BYTE` (127)
    shared by velocity *and* CC normalization; keep `MAX_MIDI_VELOCITY` as an alias
    or rename call sites that aren't velocity
  - Why: the math is right (7-bit max), but the identifier teaches that BPM CC is a
    velocity — future readers will hesitate

- [ ] **Leftover vague `setup` after rename** — `akvj/src/js/core/AdventureKidVideoJockey.js`
  - Current: `#setupClips(jsonUrl)`
  - Proposed: `#loadClipsFromUrl(jsonUrl)` (or `#loadInitialClips`)
  - Why: bare `#setup()` was already renamed to `#initializeVisuals()`; this sibling
    still says "setup" while it specifically loads + assigns the clip catalog

## Out of lane (for Overseer / skip)

- `AppState.#setBPM` re-implements clamp logic already in `#clampBPM` (DRY, not naming).
- `settings.projectDefaults.effectParams` duplicates top-level `effectParams` values
  (config drift risk — Overseer/Team Lead territory).

## Notes for Team Lead

Items 1 and 4 are private renames (small). Item 3 is a shared-constant clarity fix
(touches `effectConstants.js` + a few CC/normalize call sites if you broaden it).
Item 2 is the one that may deserve its own task if you want a careful event-contract
pass with listeners (loading overlay, tests).
