---
status: done
assignee: akvj-developer
priority: high
---

# Task 92: Implement Project Concept — Storage, Mainframe CRUD, MIDI Selection

## Severity: HIGH (Major feature — user requested, un-defers Task 73)

## Location
- `projects/` (new directory — project storage)
- `projects.json` or `projects/index.json` (project index)
- `mainframe/server/index.js` (API endpoints)
- `mainframe/src/js/mainframeState.js` (project state)
- `mainframe/src/main.js` (UI integration)
- `mainframe/src/index.html` (project UI)
- `akvj/src/js/core/settings.js` (MIDI project selection config)
- `akvj/src/js/midi-input/Midi.js` (project change handling)
- `akvj/src/js/core/AdventureKidVideoJockey.js` (project switching)
- `akvj/src/js/visuals/ClipLoader.js` (load project mappings)
- `PROJECT-SPECIFICATION.md` (documentation)
- `AGENTS.md` (MIDI channel layout update)

## Problem
The user wants a proper project concept: a project is a named set of clip mappings (and possibly settings) that can be edited through Mainframe and selected live from a MIDI note.

## Requirements

### 1. Project Storage & Model
- Projects live in `projects/{projectId}/key-map.json` (or similar)
- A project contains: name, id, and a complete MIDI-to-clip mapping
- Project index at `projects.json` or `projects/index.json`

### 2. Mainframe UI & API
- `GET /api/projects` — list all projects
- `POST /api/projects` — create new project
- `PUT /api/projects/:id` — update project (rename, edit mappings)
- `DELETE /api/projects/:id` — delete project
- UI: create/select/delete projects, edit current project's mappings
- Existing clip editor works on whichever project is active

### 3. MIDI Project Selection
- Choose a scheme for picking a project from a MIDI note
- Options: dedicated project-switch channel, or reserved notes on global channel
- When triggered, VJ engine loads that project's mapping and applies it cleanly
- Must not break existing layer group mappings (channels 1-16)

### 4. Documentation
- Update `PROJECT-SPECIFICATION.md` with final project concept and MIDI selection rules
- Update `AGENTS.md` MIDI channel layout if needed

## User Request
"Please share a brief plan before building so we can align on storage and MIDI selection approach."

## Prior User Context (already answered — don't re-ask)
Read `tasks/73-introduce-projects.md` and `spec/goal.md` "Planned: Projects" section before writing the plan. Key decisions already made by user:

1. **Project granularity**: One Project ≈ one gig/show. User also wants song-level switching within a show via a dedicated MIDI channel ("one channel is dedicated to what song is selected"). This is a two-tier idea (Project = show, with inner song/scene-select). **Open question**: Should Task 92 cover both tiers or just the outer Project level for now?
2. **Reserved channel candidate**: Code channels 13-15 (DAW 14-16) are currently reserved/unused in `settings.js` — natural fit for MIDI project/selection scheme.
3. **Live switching behavior (confirmed)**: Freeze last frame of outgoing content, show simple centered loading-bar overlay on top ("a load bar just in the middle of the screen, keep it simple... show what was playing last as just freeze and a loading on top"). Swap once ready. Must be a custom HTML element (e.g. `<akvj-loading-overlay>`). Pure background load — render loop keeps drawing frozen frame + overlay, never blocks (consistent with 60fps constraint).
4. **Bitmask/mixer clips**: Per-Project, seeded from a shared editable default — not fully global, not fully isolated.
5. **General vs Project settings split**: User confirmed distinction exists but doesn't know exactly which settings go where ("some things can't be done on a project level"). This is an open design question — propose a split and ask user to confirm.

### Proposed Architecture (from Task 73, user-reviewed)
```
clips/
  projects/
    {projectName}/
      clips/
        {clipId}/
          meta.json
          sprite.png
      key-map.json
      raw-assets/
      settings.json          # project-level settings
  active-project.json        # { "project": "default" }
```

### Sub-task Breakdown (from Task 73)
- 92a: Reorganize `clips/` directory structure + migration
- 92b: Update build pipeline for project-based structure
- 92c: Mainframe API endpoints for project management
- 92d: Mainframe UI project chooser
- 92e: AKVJ ClipLoader reads from active project
- 92f: MIDI set switching (dedicated channel, note-to-project mapping)
- 92g: Settings separation (general vs project-level)
- 92h: Loading overlay custom element (`<akvj-loading-overlay>`)
- 92i: Documentation update (PROJECT-SPECIFICATION.md, AGENTS.md)

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/server/index.js`
- `mainframe/src/js/mainframeState.js`
- `mainframe/src/main.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/midi-input/Midi.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `PROJECT-SPECIFICATION.md`

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — keep it simple, plan before building
- **Avoid over-engineering** — simple project structure
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 87 (URL Routing) — in progress, project routes will need routing
- Task 73 (Introduce "Project" Concept) — DEFERRED, now un-deferred and superseded by this task
