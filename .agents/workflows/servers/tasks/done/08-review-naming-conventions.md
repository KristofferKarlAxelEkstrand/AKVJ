# Task: Review and Refactor Naming Conventions

## Objective
Audit naming conventions across `akvj`, `mainframe`, and JSON schemas. Ensure all names are intuitive, domain-consistent, and human-readable. Fix any violations found.

## Requirements
- Names must clearly describe intent — no cryptic abbreviations (except MIDI standards like `cc`, `sysex`)
- Domain consistency: use `Clip`, `Sprite`, `LayerGroup`, `Velocity`, `Note` consistently
- No overly generic names (`data`, `manager`, `item`, `state`, `val`)
- Surgical renames with updated imports and JSON fields

## Scope
- `akvj/src/js/` — all modules
- `mainframe/src/` — all modules
- `mainframe/server/` — server code
- `mainframe/scripts/clips/` — pipeline scripts
- JSON schemas (`meta.json`, `set-mapping.json`)

## Constraints
- Vanilla JS only, no frameworks
- Maintain 60fps in akvj
- Update all imports/references when renaming
- Keep changes minimal and surgical
