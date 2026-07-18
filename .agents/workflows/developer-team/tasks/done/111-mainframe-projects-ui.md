---
status: done
assignee: mainframe-developer
priority: high
---

# Task 111: Mainframe UI Project Chooser

## Severity: High (Feature — part of Task 92 Project Concept)

## Location
- `mainframe/src/index.html`
- `mainframe/src/main.js`
- `mainframe/src/js/` (new components as needed)
- `mainframe/src/scss/` (styling)

## Problem
The AKVJ side of the Project Concept is complete (Task 92), but the Mainframe UI for project selection/management is not yet implemented. Users need a UI to select, create, and manage projects.

## Requirements
1. **Project selector** in Mainframe UI (dropdown or custom element)
2. **Active project indicator** — shows which project is currently active
3. **Create new project** — name input, optional copy-from default
4. **Edit project** — rename, edit key-map
5. **Switch active project** — calls API to activate
6. **Project-scoped key-map editing** — mapping page edits the active project's key-map
7. **Routing** — `/projects` page or project selector in header/nav

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **Custom Elements** — use `<project-chooser>` or similar pattern
- **CSS per element** — use SCSS scoped under custom element
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 110 (Mainframe Projects API) — must be done first
- Task 92 (AKVJ side) — completed

## Notes
- Projects use shared clip pool — only key-maps differ per project
- Existing mapping page should edit the active project's key-map
