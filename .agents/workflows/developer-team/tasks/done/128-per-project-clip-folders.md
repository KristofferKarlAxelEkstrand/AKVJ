---
status: done
assignee: mainframe-developer
priority: high
---

# Task 128: Migrate to Per-Project Clip Folders

## Severity: Bug / High-Priority Refactor

## Summary
The Projects feature shipped with a single shared `clips/` pool, but the user has explicitly confirmed (twice) that per-project clip folders are required. Migrate the flat `clips/` pool into `projects/default/clips/` and make every project own its clip set, seeded from a shared editable default on creation.

## Acceptance Criteria
1. Migrate existing flat `clips/` into `projects/default/clips/` (or equivalent path) — **migrate, do not keep a legacy fallback**.
2. Each project gets its own clip set, including bitmask/mixer clips, seeded from a shared editable default when a new project is created.
3. Update `mainframe/server/projects.js` and `mainframe/server/index.js` to resolve and serve clips from the active project's own folder.
4. Update the clip pipeline (`mainframe/scripts/clips/`) to build/copy into the per-project clip tree.
5. Update `akvj/src/js/visuals/ClipLoader.js` to load clips from the active project's folder.
6. Update `PROJECT-SPECIFICATION.md` to document the corrected per-project structure.
7. Preserve any existing project data (`projects/default/key-map.json`, existing clips, etc.) during the migration.
8. Verify `npm run lint`, `npm run test`, and `npm run build` pass for affected workspaces.

## Out of Scope
- Two-tier song/scene switching — confirmed out of scope for now.
- MIDI channel selection — shipped channel 14 is acceptable.
- General/Project settings split — awaiting user answer; do not change until clarified.

## Notes
- Source: `inbox/read/[BUG]-projects-clip-storage-not-per-project-as-confirmed.md`
- User intent references: `spec/goal.md` "Planned: Projects" and `outbox/question-92-project-concept-approval.md`
- Target structure (from Task 73):
  ```
  clips/
    projects/
      {projectName}/
        clips/{clipId}/meta.json, sprite.png
        key-map.json
        raw-assets/
        settings.json
  ```
