# Task 55: Fix Server serveSprite 404 Handling

## Severity: Low (Server bug)

## Location
`mainframe/server/index.js:357-372`

## Problem
`serveSprite` calls `fs.readFile(spritePath)` without a try-catch. If the sprite file doesn't exist, the server returns 500 instead of 404, making it harder to distinguish "file not found" from "server error".

## Fix
Wrap `fs.readFile` in a try-catch and return 404 with a descriptive error message when the file is not found (ENOENT).

## Key Files
- `mainframe/server/index.js`

## Dependencies
- None (discovered during Task 37b)
