# Task: Rename `numberOfFrames` to `frames`

## Objective
Shorten `numberOfFrames` to `frames` in all `meta.json` files for KISS schema.

## Requirements
1. Update `meta.json` files in `clips/` to use `"frames"` instead of `"numberOfFrames"`
2. Update `akvj` (`ClipLoader.js`, `Clip.js`) to parse `"frames"`
3. Update `mainframe` pipeline validation (`lib/validate/`)
4. Update `mainframe` server API (meta read/write)
5. Update `mainframe` UI (`main.js`) to use new field name
6. Update all tests referencing `numberOfFrames`
7. Update `clips.json` generation (`generate.js`)
8. Update `AGENTS.md` and spec docs

## Constraints
- Keep backward compatibility: if `"numberOfFrames"` exists (old data), fall back to it
- All tests must pass
