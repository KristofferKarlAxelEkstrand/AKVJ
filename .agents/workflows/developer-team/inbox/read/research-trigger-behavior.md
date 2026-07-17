# Task: Research and Implement Layered Trigger Behaviors

## Core Goal
Currently, clip behaviors like `"loop": true` and `"retrigger": true` are hardcoded at the clip level in `meta.json`. We need to expand this into a more robust, dual-layered triggering system. The `meta.json` will provide the *default* behavior, but the MIDI mapping (`midi-layout.json`) will be able to *override* those defaults and introduce advanced trigger logic (like Latch, Momentary, and Choke Groups).

## Research & Design Requirements

### 1. Dual-Layer Configuration
- **Clip Defaults**: The `meta.json` holds the default behavior for a clip.
- **Mapping Overrides**: The `midi-layout.json` allows defining specific overrides for a mapped note. This means a user can map the exact same clip to Note 1 as a momentary burst, and to Note 2 as an infinitely looping, latched background.

### 2. Advanced Trigger Types
Research and design a schema for standard VJ/sampler trigger modes. Potential modes to consider:
- **Momentary**: Plays while the note is held down, stops on Note Off.
- **Latch / Toggle**: Starts playing on Note On. Ignores Note Off. Stops on the *next* Note On.
- **One-Shot**: Plays all the way through exactly once, ignoring Note Off entirely.

### 3. Trigger Grouping (Choke Groups)
Research how to implement Trigger Groups (often called "Choke Groups" in samplers). For example, if two mappings share `"triggerGroup": "A"`, triggering one will immediately kill the other. This is crucial for swapping between full-screen background loops without them overlapping or requiring manual Note Offs.

### 4. Implementation Steps
- Design the exact JSON keys for these features. (e.g., `"triggerType": "latch"`, `"triggerGroup": 1`).
- Ensure the schema remains perfectly human-readable (KISS).
- Update the `akvj` MIDI routing logic (`Midi.js` / `LayerManager.js`) to parse these overrides and handle the complex state management of Latch vs Momentary.
- Update `spec/clip-schema.md` with your new designs.
