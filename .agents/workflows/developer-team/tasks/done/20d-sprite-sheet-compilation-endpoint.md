# Task 20d: Sprite Sheet Compilation Endpoint

## Objective
Add a dedicated endpoint for re-compiling sprite sheets from stored raw assets with new config.

## Requirements
1. `POST /api/clips/:clipId/recompile` — re-process raw assets into a new sprite sheet
2. Accept new config (targetWidth, targetHeight, etc.)
3. Useful when raw assets exist but the compiled sprite needs different parameters
4. Tests for the new endpoint

## Dependencies
- Task 20a (raw asset storage must exist)
