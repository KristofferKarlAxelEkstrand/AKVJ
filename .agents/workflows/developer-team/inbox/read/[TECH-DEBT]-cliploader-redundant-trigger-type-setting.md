# [BUG] ClipLoader does not pass triggerType/triggerGroup from mapping overrides to Clip constructor

## Severity: Low (Potential bug)

## Location
`akvj/src/js/visuals/ClipLoader.js:82-99` — `#createClip()` and `akvj/src/js/visuals/ClipLoader.js:109-135` — `#loadMappedClip()`

## Description
In `#loadMappedClip()`, the code loads the image, merges overrides into metadata, creates the clip, then separately extracts `triggerType` and `triggerGroup` from the merged metadata:

```javascript
const mergedMetadata = overrides ? { ...clipMetadata, ...overrides } : clipMetadata;
const clip = this.#createClip(image, mergedMetadata);
...
return {
    ...
    triggerType: mergedMetadata.triggerType ?? 'momentary',
    triggerGroup: mergedMetadata.triggerGroup ?? null
};
```

Then in `#buildClipsObject()`:
```javascript
clip.triggerType = triggerType;
clip.triggerGroup = triggerGroup;
```

The `Clip` constructor already accepts `triggerType` and `triggerGroup` parameters (line 54), and `#createClip()` passes `clipMetadata` which includes the merged overrides. So `clip.triggerType` and `clip.triggerGroup` are set in the constructor, then **overwritten** in `#buildClipsObject()` with the same values.

This is redundant but not a bug per se. However, it creates confusion about the source of truth — are trigger settings on the Clip instance or on the load result? The double-set could mask a future bug where the constructor applies different logic than the external set.

## Impact
Low — currently works because both paths set the same values. But the redundancy is confusing.

## Recommendation
Either:
1. Remove `triggerType`/`triggerGroup` from `#createClip()` and only set them in `#buildClipsObject()` (external set pattern), OR
2. Remove the external set in `#buildClipsObject()` and rely on the constructor (encapsulated pattern)

Option 2 is cleaner — the Clip should own its trigger behavior.
