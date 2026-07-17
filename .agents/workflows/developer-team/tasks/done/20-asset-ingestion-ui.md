# Task: Asset Ingestion & Authoring Workflow

## Objective
Build a unified staging UI in mainframe for drag-and-drop clip ingestion with live preview, raw asset retention, and sprite sheet compilation.

## Requirements
1. **Staging UI**: Drag & drop multiple frames or pre-made sprite sheet (.png/.jpg)
2. **Live configuration & preview**: Scale to 240x135, color depth preview, timing settings, clip naming
3. **Raw asset retention**: Store originals in `clips/.raw-assets/{clipId}/`
4. **Sprite sheet compilation**: Always output PNG sprite sheet to `clips/{clipId}/`
5. **Backend**: Update `POST /api/clips` to accept config params, use sharp for resize/convert/stitch
6. **Frontend**: Build staging UI view with canvas preview player

## Scope
This is a large feature requiring significant frontend and backend work. Should be broken into sub-tasks:
- 20a: Backend raw asset storage + sharp pipeline
- 20b: Frontend staging UI with drag & drop
- 20c: Live preview canvas with scale/color depth
- 20d: Sprite sheet compilation endpoint

## Dependencies
- Existing `sharp` dependency in mainframe
- Existing clip pipeline scripts
