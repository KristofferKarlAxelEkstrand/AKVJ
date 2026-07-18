---
status: done
assignee: none
priority: high
---

# Task 110: Mainframe API Endpoints for Projects (CRUD)

## Severity: High (Feature — part of Task 92 Project Concept)

## Location
- `mainframe/server/index.js`
- `mainframe/server/paths.js`

## Problem
The AKVJ side of the Project Concept is complete (Task 92), but the Mainframe API endpoints for project CRUD are not yet implemented. Users need API endpoints to create, read, update, delete, and switch active project.

## Requirements
1. `GET /api/projects` — list all projects from `projects/index.json`
2. `GET /api/projects/:id` — get single project details
3. `POST /api/projects` — create new project (name, optional copy-from default)
4. `PUT /api/projects/:id` — update project (rename, settings)
5. `DELETE /api/projects/:id` — delete project (cannot delete default)
6. `POST /api/projects/:id/activate` — set active project in `active-project.json`
7. `GET /api/projects/active` — get active project ID
8. Project key-map CRUD: `GET/PUT /api/projects/:id/key-map`

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **NPM Protocol**: NEVER run `npm install` yourself.

## Dependencies
- Task 92 (AKVJ side) — completed, provides project storage structure

## Notes
- Projects use shared clip pool — only key-maps differ per project
- `projects/index.json` and `active-project.json` already exist at repo root
