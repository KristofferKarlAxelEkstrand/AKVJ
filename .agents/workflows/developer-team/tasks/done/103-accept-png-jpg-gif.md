---
status: done
assignee: none
priority: medium
---

# Task 103: Accept PNG/JPG/GIF Stills + Unsupported-File Status

## Severity: Medium (Feature — user requested via spec)

## Location
- `mainframe/src/js/ClipFrames.js` (or new shared editor)
- `mainframe/src/main.js` (upload flow)
- `mainframe/src/index.html` (drop zone, accept attribute)

## Problem
Currently only PNG is accepted. Spec requires accepting PNG, JPG/JPEG, and GIF (still mode) with clear status messages for unsupported files.

## Requirements
1. **Accept PNG** (`.png`, `image/png`), **JPG/JPEG** (`.jpg`/`.jpeg`, `image/jpeg`), **GIF** (`.gif`, `image/gif`)
2. **Update drop-zone copy** and `accept` attribute beyond PNG-only
3. **Centralized acceptance checks** (MIME + extension) so new types are easy to add later
4. **Unsupported files**: show clear status message listing skipped files/types (do not fail silently)
5. **Valid accepted files still stage** — only hard-fail if nothing usable remains for save
6. **Multiple file selection** in one go (file picker and drag-and-drop)
7. **GIF as still**: first frame only (animated GIF expansion is Task 105)

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — centralized acceptance logic
- **NPM Protocol**: NEVER run `npm install` yourself.

## Spec Reference
`.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` §2, §8
