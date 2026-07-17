# [BUG] Server handlePostClips Missing Error Handling (Inconsistent With Sibling Endpoint)

## Issue Description
`mainframe/server/index.js:384-398` (`handlePostClips`, the `POST /api/clips` handler used by the asset-ingestion UI to create a new clip from uploaded frames) calls `createClipFromFrames(...)` with no try/catch:

```javascript
async function handlePostClips(req, res) {
	const body = JSON.parse((await readBody(req)).toString('utf8') || '{}');
	const { clipId, role, frames, targetWidth, targetHeight, name, playback, frameRate } = body;
	if (!isValidClipId(clipId)) {
		sendJson(res, 400, { error: 'Invalid clipId' });
		return;
	}
	if (!Array.isArray(frames) || frames.length === 0) {
		sendJson(res, 400, { error: 'frames must be a non-empty array of base64 PNG strings' });
		return;
	}
	const frameBuffers = frames.map(frame => Buffer.from(String(frame).replace(/^data:image\/\w+;base64,/, ''), 'base64'));
	const result = await createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, name, playback, frameRate });
	sendJson(res, 201, { ok: true, ...result });
}
```

`createClipFromFrames` (`mainframe/server/spritesheet.js:24-46`) throws plain `Error`s for entirely foreseeable, user-correctable conditions: mismatched frame dimensions (`validateFrameDimensions`), a clip that already exists (`writeClipFiles` throws `Clip "${clipId}" already exists`), or sharp failing to decode malformed/non-PNG base64 payloads. Because `handlePostClips` doesn't catch these, they fall through to the generic top-level handler in `createMainframeServer` (`index.js:281-286`), which returns a bare `500 { error: error.message }` for all of them.

Compare this to the sibling endpoint `handleRecompileClip` (`index.js:400-421`), which calls the *same* underlying `spritesheet.js` functions and explicitly wraps them:
```javascript
try {
	const result = await recompileClip({ clipId, targetWidth, targetHeight, name, playback, frameRate, role });
	sendJson(res, 200, { ok: true, ...result });
} catch (error) {
	sendJson(res, 400, { error: error.message });
}
```
So the exact same error class ("clip already exists", "frames must share dimensions") returns `400` from recompile but `500` from create — an inconsistent, incorrect status code for a client-side validation problem. This is the same category of bug already fixed in Task 54 (`handlePutClipMeta`) and Task 55 (`serveSprite`), just in a handler those tasks didn't touch. Doesn't crash the process (the outer try/catch in `createMainframeServer` prevents that), but the mainframe frontend (`StagingPreview.js`/asset ingestion UI) can't distinguish "you made a mistake" from "the server broke," which matters for a UI that's supposed to be "easy to use, intuitive, and not overly complex" per `spec/goal.md`.

## How to Fix
Wrap the `createClipFromFrames` call in `handlePostClips` the same way `handleRecompileClip` does, mapping expected validation-style errors to `400`:
```javascript
	try {
		const result = await createClipFromFrames({ clipId, frameBuffers, role, targetWidth, targetHeight, name, playback, frameRate });
		sendJson(res, 201, { ok: true, ...result });
	} catch (error) {
		sendJson(res, 400, { error: error.message });
	}
```

## Key Files
- `mainframe/server/index.js` (`handlePostClips`, compare against `handleRecompileClip` for the correct pattern)
- `mainframe/server/spritesheet.js` (`createClipFromFrames`, `writeClipFiles`, `validateFrameDimensions` — source of the thrown errors)

## Dependencies
- None. Same bug class as Tasks 54/55, but a different, previously-unaudited handler.
