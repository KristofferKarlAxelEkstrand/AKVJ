---
status: done
assignee: akvj-developer
priority: high
---

# Task 119: Clip-Format Core (P0 Backbone)

## Severity: Refactor

## Summary
Consolidate clip metadata reading, normalization, and validation so each realm (`akvj` and `mainframe`) has exactly one behavior. This is the backbone for all upcoming feature work.

## Acceptance Criteria
- **akvj**: Introduce a single `normalizeClipMetadata(meta)` used by `ClipLoader.js` and `tools/clip-preview/ClipPreview.js`; handle `frames ?? numberOfFrames` and `playback ?? (loop === false ? 'once' : 'loop')` in one place.
- **mainframe**: `scripts/clips/lib/validate/meta.js` must stop mutating source meta during validation (no silent `loop` → `playback` rewrite, no field deletion). Separate report vs migrate/`--fix`.
- **mainframe**: Unify the two spritesheet builders (`server/spritesheet.js` and `scripts/clips/spritesheet.js`) into one compositing lib inside `mainframe` (e.g., `scripts/clips/lib/spritesheet-core.js` or `mainframe/shared/`). Pick one `framesPerRow` default and document it.
- **Per realm**: One clip-schema constants module (`akvj/src/js/settings.js` for engine, `mainframe/src/js/clipSchema.js` for mainframe) with `240×135` default, `scaleMode: 'fit'`, and playback-mode list; add tests asserting they match `spec/clip-schema.md`.
- **Round-trip tests**: hand-written `meta.json` → load → save → identical human-readable output (KISS invariant).
- Verify `npm run lint`, `npm run test`, and `npm run build` pass for affected workspaces.

## Notes
- Keep changes inside each realm; no shared JS import between `akvj` and `mainframe`.
- Do not change the on-disk `meta.json` shape in ways that hurt hand-editability.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §0.
