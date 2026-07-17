# [OPTIMIZATION] listClips reads every clip directory sequentially

## Location
`mainframe/server/index.js:105-116`

## Description
`listClips()` iterates over all clip directories and calls `buildClipEntry()` sequentially with `await` in a for-loop. Each `buildClipEntry` reads `meta.json` and checks sprite existence with `fs.access()`, resulting in 2 I/O operations per clip, executed one at a time.

## Impact
With many clips, the sequential I/O adds up. For 50 clips, that's 100 sequential file system calls. The `/api/clips` endpoint is called on page load and on every library refresh.

## Suggested Fix
Use `Promise.all()` to parallelize the `buildClipEntry` calls:
```javascript
const entries = await Promise.all(
    entries
        .filter(entry => entry.isDirectory() && isValidClipId(entry.name))
        .map(entry => buildClipEntry(entry.name))
);
```
Then sort the results. This allows all meta.json reads and sprite existence checks to run concurrently.
