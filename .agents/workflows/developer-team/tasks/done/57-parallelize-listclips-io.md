# Task 57: Parallelize listClips Server I/O

## Severity: Low (Optimization)

## Location
`mainframe/server/index.js:105-116`

## Problem
`listClips()` calls `buildClipEntry()` sequentially with `await` in a for-loop. Each call does 2 I/O operations (read meta.json + check sprite). For 50 clips, that's 100 sequential file system calls on every page load and library refresh.

## Fix
Use `Promise.all()` to parallelize `buildClipEntry` calls, then sort results.

## Key Files
- `mainframe/server/index.js`

## Dependencies
- None (discovered during Task 37b)
