# Task 29: Rename midi-layout to key-map

## Objective
Rename all instances of `midi-layout` to `key-map` across the entire codebase.

## Sub-tasks
1. **File rename**: `clips/midi-layout.json` → `clips/key-map.json`
2. **Backend & pipeline**: `mainframe/server/paths.js`, `mainframe/server/index.js`, `mainframe/scripts/clips/Pipeline.js`, `mainframe/scripts/clips/lib/validateMapping.js`, `mainframe/scripts/clips/new.js`
3. **Frontend (akvj)**: `akvj/src/js/core/settings.js`, `akvj/src/js/visuals/ClipLoader.js`
4. **Mainframe frontend**: `mainframe/src/main.js` variable names
5. **Tests**: `akvj/test/ClipLoader.test.js`, `mainframe/test/server.test.js`, `mainframe/test/validateMapping.test.js`, `mainframe/test/Pipeline.test.js`, `mainframe/test/paths.test.js`
6. **Docs**: AGENTS.md, README.md, any other references

## Dependencies
None
