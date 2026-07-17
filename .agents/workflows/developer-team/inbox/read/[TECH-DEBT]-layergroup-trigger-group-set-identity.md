# [TECH-DEBT] LayerGroup trigger group uses object identity for Set membership

## Severity: Low (Code quality / latent bug)

## Location
`akvj/src/js/visuals/LayerGroup.js:273-335` — `#addToTriggerGroup()`, `#removeFromTriggerGroup()`, `#stopChokeGroupMembers()`

## Description
The trigger group system stores `{ channel, note }` objects in a `Set`. The `#removeFromTriggerGroup` method iterates the set and compares by `member.channel === channel && member.note === note` — which is correct. However, `#stopChokeGroupMembers` also iterates and compares the same way.

The issue is that `Set.has()` won't work with these objects (since they're new object literals each time), so the code uses linear scan. This is O(n) per operation where n is the number of members in the group. For small groups this is fine, but it's a pattern that doesn't scale and is error-prone.

Additionally, `#stopChokeGroupMembers` clears the group and adds back only the excluded member:
```javascript
groupMembers.clear();
groupMembers.add({ channel: excludeChannel, note: excludeNote });
```
This creates a new object that won't match the original added by `#addToTriggerGroup`. The `#removeFromTriggerGroup` will still work (it scans by value), but the object identity differs from what was originally stored.

## Impact
Low — trigger groups are typically small. But the pattern is fragile.

## Recommendation
Use a `Map<string, {channel, note}>` keyed by `${channel}:${note}` instead of a `Set`. This gives O(1) lookup and removal:
```javascript
const key = `${channel}:${note}`;
groupMembers.set(key, { channel, note });
```
