# Task 49: Refactor LayerGroup Trigger Group to Use Map

## Severity: Low (Code quality / latent bug)

## Location
`akvj/src/js/visuals/LayerGroup.js:273-335`

## Problem
Trigger group uses a `Set` with object literals, requiring O(n) linear scan for lookup/removal. `#stopChokeGroupMembers` creates new objects that don't match original identity.

## Fix
Use a `Map<string, {channel, note}>` keyed by `${channel}:${note}` for O(1) lookup and removal.

## Key Files
- `akvj/src/js/visuals/LayerGroup.js`
- `akvj/test/LayerGroup.test.js`

## Dependencies
- None (discovered during Task 37a)
