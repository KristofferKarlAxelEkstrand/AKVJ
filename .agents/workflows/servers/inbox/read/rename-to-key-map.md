# Refactor: Rename midi-layout to key-map

**Context & Rationale:**
We have decided to formalize the terminology for how clips are assigned to MIDI notes and channels. Since AKVJ functions very similarly to a multi-sampled instrument (where samples are mapped to specific key and velocity ranges), the industry-standard term "Key-map" (or Keymap) is the most accurate and universally understood term for this.

**Action Plan for the Server Architect:**
Please execute a complete refactoring to rename all instances of `midi-layout` to `key-map`.

### 1. File Rename
- Rename the actual data file in the clips bucket: `clips/midi-layout.json` -> `clips/key-map.json`.

### 2. Update Backend & Pipeline (`mainframe`)
- `mainframe/server/paths.js`: Rename `MIDI_LAYOUT_PATH` to `KEY_MAP_PATH` and point it to `key-map.json`.
- `mainframe/server/index.js`: Update the endpoints and helper functions (e.g., `flattenMidiLayout` -> `flattenKeyMap`).
- `mainframe/scripts/clips/Pipeline.js`: Update the copy and validation steps to reference `key-map.json`.
- `mainframe/scripts/clips/lib/validateMapping.js`: Rename `validateMidiLayout` to `validateKeyMap` and update all internal error string references.
- `mainframe/scripts/clips/new.js`: Update console log instructions.
- `mainframe/src/main.js`: Update API fetch paths from `/api/mapping` (if applicable) and any variable names referring to layout/mapping to use `keyMap`.

### 3. Update Frontend (`akvj`)
- `akvj/src/js/core/settings.js`: Rename `midiLayoutJsonUrl` to `keyMapJsonUrl` -> `'/clips/key-map.json'`.
- `akvj/src/js/visuals/ClipLoader.js`: Update references in `setupClips` and error logging.

### 4. Update Tests
You will need to run a full find-and-replace in the test suites to fix the mocks and fixtures:
- `akvj/test/ClipLoader.test.js`
- `mainframe/test/server.test.js`
- `mainframe/test/validateMapping.test.js`
- `mainframe/test/Pipeline.test.js`
- `mainframe/test/paths.test.js`

After this refactor, run `npm run test:all` to ensure the rename is complete and no references were left behind.
