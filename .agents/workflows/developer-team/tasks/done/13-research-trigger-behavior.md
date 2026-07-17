# Task: Research and Implement Layered Trigger Behaviors

## Objective
Expand clip triggering from hardcoded `loop`/`retrigger` to dual-layered system: clip defaults in `meta.json` + mapping overrides in `midi-layout.json`.

## Requirements
1. Dual-layer config: `meta.json` defaults, `midi-layout.json` overrides
2. Trigger types: Momentary, Latch/Toggle, One-Shot
3. Choke Groups: `triggerGroup` to mutually exclusive clip sets
4. Update `akvj` MIDI routing (`Midi.js`, `LayerManager.js`, `LayerGroup.js`)
5. Update `spec/clip-schema.md` with new schema designs
6. Update `midi-layout.json` schema to support per-entry overrides

## Dependencies
- Depends on task 10 (midi-layout.json refactor) — COMPLETED
- Best done after task 11 (numberOfFrames rename) to avoid schema conflicts
