# Task 85: Clip Categories (Folder-Based Organization)

## Severity: Medium (Feature — user requested)

## Location
- `clips/key-map.json` (data model)
- `clips/*/meta.json` (clip metadata)
- `mainframe/src/js/ClipList.js` (UI — folder navigation)
- `mainframe/src/js/mainframeState.js` (state — category filter)
- `mainframe/src/main.js` (integration)
- `mainframe/src/styles.css` (folder UI styling)
- `mainframe/server/index.js` (API — category endpoint if needed)

## Problem
The user wants a categorization system for clips using a folder-like structure. Clips should belong to exactly one category (mutually exclusive). The UI should display categories as traditional folders that users can navigate into.

## Requirements
1. **Data Model**: Add a `category` field to clip metadata (`meta.json`). A clip belongs to exactly one category (string, mutually exclusive). Default category could be "uncategorized" or similar.
2. **UI Presentation**: Display categories as folders in the ClipList component. Users click a folder to navigate into it and see only clips in that category. Include a "back" navigation to return to the folder list.
3. **Simplicity**: Keep the folder UI clean, straightforward, flat, and minimalist. Adhere to the flat grey background and minimalist design principles already established.
4. **Key-map integration**: Consider whether `key-map.json` needs category grouping or if category is purely per-clip in `meta.json`.

## Scope
- Add `category` field to clip metadata schema
- Update ClipList component to render folders when no category is selected, and clips when a category is selected
- Update MainframeState to track selected category
- Add category navigation (folder view → clip view → back to folders)
- Style folders as simple flat rectangles/icons
- Update server API if needed to filter by category
- Update tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run test -w akvj` if clip metadata changes affect AKVJ

## Key Files
- `mainframe/src/js/ClipList.js`
- `mainframe/src/js/mainframeState.js`
- `mainframe/src/main.js`
- `mainframe/src/styles.css`
- `mainframe/server/index.js`
- `clips/*/meta.json`

## Constraints
- **Avoid over-engineering** — simple folder structure, not a complex tag system
- **Simplicity is key** — flat, minimalist UI
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 84 (UI simplification) should complete first to establish the clean baseline
