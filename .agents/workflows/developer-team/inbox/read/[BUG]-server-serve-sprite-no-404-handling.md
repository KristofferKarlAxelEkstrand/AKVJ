# [BUG] Server serveSprite does not handle file not found

## Location
`mainframe/server/index.js:357-372`

## Description
The `serveSprite` function calls `fs.readFile(spritePath)` without a try-catch. If the sprite file does not exist (e.g., meta.json references a png that was deleted), the promise rejects and is caught by the top-level error handler, returning a 500 error. A 404 would be more appropriate.

## Impact
Frontend gets a 500 error instead of 404 when a sprite file is missing, making it harder to distinguish between "file not found" and "server error". The `ClipList` preview will show a broken image with no meaningful error message.

## Suggested Fix
Wrap `fs.readFile` in a try-catch and return 404 with a descriptive error message when the file is not found (ENOENT).
