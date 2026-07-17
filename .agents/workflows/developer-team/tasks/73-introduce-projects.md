# Task 73: Introduce "Project" Concept for Clip/MIDI Mapping Groups

## Severity: Feature (Architecture)

## Summary
Introduce the concept of a "Project" to group clips, MIDI mappings, and uploads together. Currently the app operates on a single global set of clips. Projects will allow users to manage multiple distinct sets of visuals and switch between them.

## User Feedback (received)

### 1. Organization
User thinks in terms of **sets/projects** — one per gig or project. Also wants ability to organize song-by-song. Wants ability to switch sets from the keyboard (dedicated MIDI channel for set selection). Wants one big bank for a whole show, but supports song-by-song organization too.

### 2. Hot-switching
User wants to be able to switch projects with a key press. Some load time is acceptable. Not instant, but should be triggerable from MIDI.

### 3. Bitmasks
Bitmasks should be **per project**. There will likely be a standard set, but users should be able to change them per project.

### 4. On-screen behavior during a live switch (asked by Overseer, answered 2026-07-17)
Confirmed: freeze the last frame of the outgoing project, show a simple loading indicator on top (a load bar, centered on screen), swap to the new project once loaded. Explicitly wants it kept simple for now. This means switching can be implemented as a pure background load — the render loop keeps drawing the frozen last frame + overlay, never blocks — consistent with the 60fps/no-blocking rule.
- Should be a custom HTML element per project conventions (e.g. `<akvj-loading-overlay>`), not ad-hoc DOM.

## Proposed Architecture (refined with user input)

### Directory Structure
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

### General vs Project Settings
- **Project-level**: clips, key-map, bitmasks, raw assets, project-specific settings
- **General**: global app settings (canvas size, MIDI channel routing, etc.)

### MIDI Set Switching
- Dedicate a MIDI channel for project/set selection
- Note on that channel → project index → switch active project
- ClipLoader reloads clips from the new project path
- Some load time acceptable (not instant, but triggered from keyboard)

### Mainframe Changes
- Project chooser dropdown in the UI header
- API: `GET /api/projects`, `PUT /api/project` (switch), `POST /api/projects` (create)
- ClipList/MappingTable scoped to active project

### AKVJ Engine Changes
- ClipLoader reads from active project path (via `active-project.json`)
- Build pipeline: `npm run clips -- --project=<name>` or build all projects

## Sub-task Breakdown
This is a large feature — should be broken into sub-tasks:
- **73a**: Reorganize `clips/` directory structure + migration
- **73b**: Update build pipeline (`Pipeline.js`) for project-based structure
- **73c**: Mainframe API endpoints for project management
- **73d**: Mainframe UI project chooser
- **73e**: AKVJ ClipLoader reads from active project
- **73f**: MIDI set switching (dedicated channel, note-to-project mapping)
- **73g**: Settings separation (general vs project-level)

## Key Files
- `clips/` — current flat structure to be reorganized
- `clips/key-map.json` — current MIDI mapping
- `mainframe/server/index.js` — API endpoints
- `mainframe/src/js/ClipList.js` — UI for clip browsing
- `akvj/src/js/visuals/ClipLoader.js` — clip loading
- `mainframe/scripts/clips/Pipeline.js` — build pipeline

## Dependencies
- None (new feature)
- Related to Task 61 (MainframeState) — project state should be part of centralized state
