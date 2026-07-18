# Task 87: URL Routing Structure for Mainframe

## Severity: Medium (Architecture — user requested)

## Location
- `mainframe/src/main.js` (routing integration)
- `mainframe/src/index.html` (view containers)
- `mainframe/src/styles.css` (view visibility by route)
- `mainframe/src/js/mainframeState.js` (route state if needed)

## Problem
The user wants proper URL routing for different Mainframe views, with future support for project-based dynamic routes.

## Requirements

### Current Views (Implement Now)
- `/key-map` → The Set Mapping view
- `/clip/new` → The Upload / New Clip view
- `/library` → The Clip Library view

### Future Dynamic Architecture (Plan For)
- `/` → Start page displaying list of available projects
- `/project/<name>/` → Main view inside a specific project
- `/project/<name>/clip/<name>` → View for a specific clip within a project
- Note: Changing clip name changes URL — this is accepted behavior

### Goals
- Bookmark specific views
- Browser back/forward button support
- Clear hierarchical URL structure
- Architecture should be extensible for future project-based routes

## Scope
- Implement a simple client-side router (vanilla JS — no frameworks)
- Route between the 3 current views based on URL path
- Show/hide view containers based on current route
- Support browser history API (pushState, popstate)
- Plan architecture to be extensible for future `/project/<name>/...` routes
- Update tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/main.js`
- `mainframe/src/index.html`
- `mainframe/src/styles.css`

## Constraints
- **Vanilla JS only** — no routing frameworks
- **Avoid over-engineering** — simple hash-based or History API router
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 85 (Clip Categories) — related, both affect ClipList/navigation
- Task 73 (Projects) — future routes depend on this, but current routes can be implemented independently
