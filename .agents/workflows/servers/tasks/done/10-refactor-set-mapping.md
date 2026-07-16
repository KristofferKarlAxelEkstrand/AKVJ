# Task: Refactor and Rename set-mapping.json

## Objective
Replace the flat array `set-mapping.json` with a human-friendly grouped format, renamed to `midi-layout.json`.

## Requirements
1. **Rename**: `set-mapping.json` → `midi-layout.json`
2. **Group by channel**: Nested object keyed by channel, then note, with clip ID as value
3. **Sparse**: Omit empty channels/notes — no padding
4. **Update consumers**:
   - `mainframe` UI (read/write new structure)
   - `akvj/src/js/visuals/ClipLoader.js` (parse nested grouping into clip tree)
   - `mainframe/scripts/clips/lib/validate/` (validate new format)
   - `mainframe/server/index.js` (API endpoints for mapping)

## Schema (proposed)
```json
{
  "1": {
    "0": "c1-n0-v0",
    "1": "c1-n1-v0"
  },
  "5": {
    "0": "c5-n0-v0"
  }
}
```
Channels use DAW numbering (1-16). Keys are string numbers. Values are clip IDs.

## Constraints
- Backward compatibility: provide migration or update existing file in-place
- Update all tests that reference set-mapping.json
- Maintain 60fps in akvj
