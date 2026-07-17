# Task 20b: Frontend Staging UI with Drag & Drop

## Objective
Build a drag-and-drop staging UI in the mainframe Upload tab for clip ingestion.

## Requirements
1. Drag & drop zone for multiple PNG frames or a pre-made sprite sheet
2. Clip ID input, role selector, name field
3. Config options: target width/height (default 240x135), playback mode, frame rate
4. Submit button calls updated `POST /api/clips` with config + frames
5. Replace or augment the existing upload form

## Dependencies
- Task 20a (backend must accept config params)
