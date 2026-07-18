---
status: done
assignee: none
priority: high
---

# Task 102: Unique ID Generation + Stop Deriving ID from Name

## Severity: High (Feature — user requested via spec)

## Location
- `mainframe/src/js/ClipEditor.js` (or new shared editor)
- `mainframe/src/main.js` (upload/create flow)
- `mainframe/server/index.js` (validation)
- `mainframe/src/js/ClipFrames.js`

## Problem
Currently clip IDs are derived from clip names. The spec requires auto-generating unique IDs on create (e.g. `crypto.randomUUID()`), with hand-editing allowed only before first save. After save, ID is read-only.

## Requirements
1. **Auto-generate unique ID** on create using `crypto.randomUUID()` or similar
2. **Editable by hand before first save only** — after clip exists, ID is read-only
3. **Stop auto-deriving ID from name** — name stays human-readable label
4. **Validate uniqueness** against existing `clips/` directory
5. **Reject empties and duplicates**
6. **Existing human-readable clipIds remain valid** — no migration, only new clips get generated IDs
7. **Keep format simple** — plain unique string safe for paths (letters, numbers, hyphen, underscore)

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — plain unique string, no fancy schemes
- **NPM Protocol**: NEVER run `npm install` yourself.

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §1
