# Task 63: Fix StagingPreview Shuffle Mode Identical to Random

## Severity: Low (Tech debt)

## Location
`mainframe/src/js/StagingPreview.js:240-245`

## Problem
Both `shuffle` and `random` cases use `Math.floor(Math.random() * frameCount)`. True shuffle should avoid repeating and play every frame once before any repeats.

## Fix
Implement a Fisher-Yates shuffle queue for `shuffle` mode: pre-compute a shuffled order, iterate through it, re-shuffle when exhausted.

## Key Files
- `mainframe/src/js/StagingPreview.js`

## Dependencies
- None (discovered during Task 37b)
