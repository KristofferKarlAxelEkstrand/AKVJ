# Task 86: Clip Naming Convention — Derive ID from Name

## Severity: Medium (Feature — user requested)

## Location
- `mainframe/src/js/ClipEditor.js` (clip creation form)
- `mainframe/server/index.js` (clip creation endpoint)
- `mainframe/scripts/clips/` (clip scaffolding scripts)
- `clips/key-map.json` (mapping references)

## Problem
The user wants a streamlined clip naming workflow where the `clipId` is automatically derived from the human-readable name the user types in.

## Requirements
1. **Derive ID from Name**: When a user creates a new clip and types a human-readable name, the internal `clipId` should be automatically derived:
   - Sanitized (special characters removed)
   - Lowercased
   - Spaces replaced with hyphens
   - Example: "My Cool Clip!" → "my-cool-clip"
2. **Rename Files to Match**: The underlying files (sprite sheet, meta.json, etc.) should be automatically named to match the derived `clipId`.
3. **Seamless experience**: The name the user chooses dictates the entire naming structure automatically.

## Scope
- Update ClipEditor to show derived clipId preview as user types
- Update server clip creation endpoint to derive clipId from name
- Update clip scaffolding scripts if needed
- Ensure existing clips with manual IDs still work (backward compatibility)
- Add tests for the derivation logic

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/ClipEditor.js`
- `mainframe/server/index.js`
- `mainframe/scripts/clips/`

## Constraints
- **Avoid over-engineering** — simple sanitization function
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 85 (Clip Categories) — related but independent, can be done in either order
