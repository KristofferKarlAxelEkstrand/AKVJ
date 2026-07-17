# Task 58: Optimize PianoKeyboard Re-render on Update

## Severity: Low (Optimization)

## Location
`mainframe/src/js/PianoKeyboard.js:73-105`

## Problem
`#render` creates 128 DOM elements every time it's called (on every channel change and mapping update). Full DOM subtree replacement with 128 element creations and 128 event listener attachments. Also uses O(n*m) `Array.find()` for mapping lookups inside the loop.

## Fix
1. Only update `piano-key--mapped` class and `title` attribute on existing elements for mapping changes
2. Use a `Map` keyed by note number for O(1) mapping lookups
3. Only full re-render when channel changes; incremental updates for mapping changes

## Key Files
- `mainframe/src/js/PianoKeyboard.js`

## Dependencies
- None (discovered during Task 37b)
