# [OPTIMIZATION] PianoKeyboard renders 128 DOM elements on every render

## Location
`mainframe/src/js/PianoKeyboard.js:73-105`

## Description
The `#render` method creates 128 DOM elements (one per MIDI note) every time it's called. `replaceChildren()` clears all existing elements and recreates them from scratch. This happens on every channel change and every mapping update.

For a 128-key keyboard, this means 128 element creations, 128 event listener attachments, and a full DOM subtree replacement on every interaction.

## Impact
May cause noticeable lag on slower devices when switching channels or updating mappings, especially with large mapping sets. The `channelMappings.find()` call inside the loop is O(n*m) where n=128 and m=mapping count.

## Suggested Fix
1. Only update the `piano-key--mapped` class and `title` attribute on existing elements when mappings change, rather than full re-render.
2. Use a `Map` keyed by note number for O(1) mapping lookups instead of `Array.find()`.
3. Consider only re-rendering when the channel actually changes, and doing incremental updates for mapping changes.
