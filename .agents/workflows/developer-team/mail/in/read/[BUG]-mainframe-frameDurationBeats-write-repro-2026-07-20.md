---
type: bug
from: field-tester
created: 2026-07-20T12:45:00.000Z
---

# Mainframe `POST /api/clips` persists a field the pipeline rejects

See `mail/in/[BUG]-mainframe-writes-rejected-frameDurationBeats-2026-07-20.md` for the source-code map. This ticket adds a runnable repro.

## Repro command

Save the script below to `.fieldtest-repro.mjs` in the repo root, then run:

```bash
node .fieldtest-repro.mjs
```

```javascript
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { validate } from './mainframe/scripts/clips/lib/validate/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmp = await fs.mkdtemp(path.join('/tmp', 'ft-repro-'));
const projectsDir = path.join(tmp, 'projects');
const activePath = path.join(tmp, 'active.json');
await fs.mkdir(projectsDir, { recursive: true });
await fs.writeFile(activePath, JSON.stringify({ project: 'fieldtest' }));

const port = 17777;
const server = spawn('node', ['mainframe/server/index.js'], {
	cwd: __dirname,
	env: { ...process.env, MAINFRAME_API_PORT: String(port), AKVJ_PROJECTS_DIR: projectsDir, AKVJ_ACTIVE_PROJECT_PATH: activePath }
});

await new Promise(resolve => setTimeout(resolve, 1500));

async function request(method, pathname, body) {
	const url = `http://127.0.0.1:${port}${pathname}`;
	const res = await fetch(url, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	let json;
	try { json = JSON.parse(text); } catch { json = text; }
	return { status: res.status, json, text };
}

await request('GET', '/api/health');

const buf = await sharp({ create: { width: 240, height: 135, channels: 3, background: 'black' } }).png().toBuffer();
const png = 'data:image/png;base64,' + buf.toString('base64');

await request('POST', '/api/projects', { id: 'fieldtest', name: 'Field Test', copyFrom: false });
await request('POST', '/api/projects/fieldtest/activate', {});
const create = await request('POST', '/api/clips', { clipId: 'ft-clip', frames: [png], name: 'FT', frameDurationBeats: 0.5 });

const metaPath = path.join(projectsDir, 'fieldtest', 'clips', 'ft-clip', 'meta.json');
const metaRaw = await fs.readFile(metaPath, 'utf8');
console.log('--- create clip status ---');
console.log(create.status, create.json);
console.log('--- meta.json ---');
console.log(metaRaw);

const result = await validate(path.join(projectsDir, 'fieldtest', 'clips'));
console.log('--- pipeline validate ---');
console.log(JSON.stringify(result, null, 2));

server.kill();
await new Promise(resolve => server.on('exit', resolve));
await fs.rm(tmp, { recursive: true, force: true });

const hasField = metaRaw && metaRaw.includes('frameDurationBeats');
const hasValidateError = result.errors.some(item => item.errors.some(err => String(err).includes('frameDurationBeats')));

if (create.status === 201 && hasField && hasValidateError) {
	console.log('\nBUG REPRODUCED: server wrote frameDurationBeats; pipeline rejects it');
	process.exit(1);
}
console.log('\nNo bug: create status', create.status, 'has field', hasField, 'validate error', hasValidateError);
```

## Output

```text
--- create clip status ---
201 { ok: true, clipId: 'ft-clip', frames: 1, framesPerRow: 1 }
--- meta.json ---
{
	"png": "sprite.png",
	"frames": 1,
	"framesPerRow": 1,
	"playback": "loop",
	"retrigger": true,
	"frameRatesForFrames": {
		"0": 12
	},
	"scaleMode": "fit",
	"frameWidth": 240,
	"frameHeight": 135,
	"placement": {
		"x": 0,
		"y": 0
	},
	"name": "FT",
	"frameDurationBeats": 0.5
}
--- pipeline validate ---
{
  "valid": [],
  "errors": [
    {
      "clipId": "ft-clip",
      "errors": [
        "frameDurationBeats is no longer supported. Use sync: \"beat\" with syncLength and syncBeats instead."
      ]
    }
  ]
}

BUG REPRODUCED: server wrote frameDurationBeats; pipeline rejects it
```

## Expected

`POST /api/clips` should reject `frameDurationBeats` the same way `mainframe/scripts/clips/lib/validate/meta.js` and `npm run clips` do, so the server never writes a field the pipeline will refuse to build.

## Narrowest repro

`mainframe/server/handlers/clips.js` `handlePostClips` passes `frameDurationBeats` straight to `createClipFromFrames` → `spritesheet.js` `buildClipMeta` writes it into `meta.json` with no validation. Any client that includes `frameDurationBeats` in a create-clip request gets a 201 and a clip that `npm run clips` will reject.
