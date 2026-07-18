import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

const PNG_4x4 = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWP4z8DwHxkzkC4AADxAH+HdRw9wAAAAAElFTkSuQmCC';

let testClipsDir;
let testRawAssetsDir;
let testKeyMapPath;
let testProjectsDir;
let testActiveProjectPath;
let server;
let baseUrl;

async function setupTestProjectsDir() {
	testProjectsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-projects-test-'));
	testActiveProjectPath = path.join(testProjectsDir, 'active-project.json');
	testClipsDir = path.join(testProjectsDir, 'default', 'clips');
	testRawAssetsDir = path.join(testProjectsDir, 'default', '.raw-assets');
	testKeyMapPath = path.join(testProjectsDir, 'default', 'key-map.json');
	await fs.mkdir(path.join(testClipsDir, 'test-clip-a'), { recursive: true });
	await fs.mkdir(testRawAssetsDir, { recursive: true });
	await fs.writeFile(path.join(testClipsDir, 'test-clip-a', 'sprite.png'), Buffer.from(PNG_4x4, 'base64'));
	await fs.writeFile(path.join(testClipsDir, 'test-clip-a', 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, loop: true, retrigger: true }));
	await fs.writeFile(path.join(testProjectsDir, 'index.json'), `${JSON.stringify([{ id: 'default', name: 'Default' }], null, '\t')}\n`);
	await fs.writeFile(testKeyMapPath, `${JSON.stringify({ 1: { 0: { 0: 'test-clip-a' } } }, null, '\t')}\n`);
	await fs.writeFile(testActiveProjectPath, `${JSON.stringify({ project: 'default' }, null, '\t')}\n`);
}

async function cleanupTestProjectsDir() {
	if (testProjectsDir) {
		await fs.rm(testProjectsDir, { recursive: true, force: true });
	}
}

async function fetchJson(method, pathname, body) {
	const response = await fetch(`${baseUrl}${pathname}`, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	});
	const responseBody = await response.json().catch(() => ({}));
	return { status: response.status, data: responseBody };
}

beforeAll(async () => {
	await setupTestProjectsDir();
	process.env.AKVJ_PROJECTS_DIR = testProjectsDir;
	process.env.AKVJ_ACTIVE_PROJECT_PATH = testActiveProjectPath;
	delete process.env.AKVJ_CLIPS_DIR;
	const serverModule = await import('../server/index.js');
	server = serverModule.createMainframeServer();
	await new Promise(resolve => {
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
	if (server) {
		await new Promise(resolve => server.close(resolve));
	}
	delete process.env.AKVJ_PROJECTS_DIR;
	delete process.env.AKVJ_ACTIVE_PROJECT_PATH;
	await cleanupTestProjectsDir();
});

describe('GET /api/health', () => {
	test('returns ok', async () => {
		const { status, data } = await fetchJson('GET', '/api/health');
		expect(status).toBe(200);
		expect(data.ok).toBe(true);
	});
});

describe('GET /api/clips', () => {
	test('lists clips in the bucket', async () => {
		const { status, data } = await fetchJson('GET', '/api/clips');
		expect(status).toBe(200);
		expect(Array.isArray(data.clips)).toBe(true);
		expect(data.clips.some(clip => clip.clipId === 'test-clip-a')).toBe(true);
	});

	test('returned clip has expected fields', async () => {
		const { data } = await fetchJson('GET', '/api/clips');
		const clip = data.clips.find(c => c.clipId === 'test-clip-a');
		expect(clip).toBeDefined();
		expect(clip.hasSprite).toBe(true);
		expect(clip.pipelineReady).toBe(true);
		expect(clip.meta.frames).toBe(1);
	});
});

describe('GET /api/mapping', () => {
	test('returns the key-map as a flat array', async () => {
		const { status, data } = await fetchJson('GET', '/api/mapping');
		expect(status).toBe(200);
		expect(Array.isArray(data.mapping)).toBe(true);
		expect(data.mapping).toHaveLength(1);
		expect(data.mapping[0].clipId).toBe('test-clip-a');
	});

	test('handles malformed key-map with null/string intermediate values', async () => {
		const malformedLayout = {
			1: { 0: { 0: 'test-clip-a' } },
			2: null,
			3: 'not-an-object',
			4: { 5: null },
			5: { 6: 'also-not-an-object' }
		};
		await fs.writeFile(testKeyMapPath, JSON.stringify(malformedLayout));
		const { status, data } = await fetchJson('GET', '/api/mapping');
		expect(status).toBe(200);
		expect(data.mapping).toHaveLength(1);
		expect(data.mapping[0].clipId).toBe('test-clip-a');
		await fs.writeFile(testKeyMapPath, JSON.stringify({ 1: { 0: { 0: 'test-clip-a' } } }, null, '\t'));
	});
});

describe('PUT /api/mapping', () => {
	test('writes a valid mapping', async () => {
		const newMapping = [
			{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' },
			{ channel: 2, note: 5, velocity: 10, clipId: 'test-clip-a' }
		];
		const { status, data } = await fetchJson('PUT', '/api/mapping', { mapping: newMapping });
		expect(status).toBe(200);
		expect(data.ok).toBe(true);
		expect(data.mapping).toHaveLength(2);
	});

	test('rejects mapping with invalid clipId', async () => {
		const { status, data } = await fetchJson('PUT', '/api/mapping', {
			mapping: [{ channel: 1, note: 0, velocity: 0, clipId: 'nonexistent-clip' }]
		});
		expect(status).toBe(400);
		expect(data.error).toContain('nonexistent-clip');
	});

	test('rejects mapping with duplicate slots', async () => {
		const { status } = await fetchJson('PUT', '/api/mapping', {
			mapping: [
				{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' },
				{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' }
			]
		});
		expect(status).toBe(400);
	});
});

describe('DELETE /api/clips/:clipId', () => {
	let deleteTestDir;

	beforeEach(async () => {
		deleteTestDir = path.join(testClipsDir, 'delete-me');
		await fs.mkdir(deleteTestDir, { recursive: true });
		await fs.writeFile(path.join(deleteTestDir, 'sprite.png'), Buffer.from(PNG_4x4, 'base64'));
		await fs.writeFile(path.join(deleteTestDir, 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }));
	});

	afterEach(async () => {
		await fs.rm(deleteTestDir, { recursive: true, force: true });
	});

	test('deletes an existing clip', async () => {
		const { status, data } = await fetchJson('DELETE', '/api/clips/delete-me');
		expect(status).toBe(200);
		expect(data.ok).toBe(true);
		expect(data.clipId).toBe('delete-me');
		await expect(fs.access(deleteTestDir)).rejects.toThrow();
	});

	test('returns 404 for non-existent clip', async () => {
		const { status, data } = await fetchJson('DELETE', '/api/clips/no-such-clip');
		expect(status).toBe(404);
		expect(data.error).toContain('no-such-clip');
	});

	test('returns 400 for invalid clipId', async () => {
		const { status, data } = await fetchJson('DELETE', '/api/clips/123');
		expect(status).toBe(400);
		expect(data.error).toBe('Invalid clipId');
	});
});

describe('POST /api/clips', () => {
	afterEach(async () => {
		await fs.rm(path.join(testClipsDir, 'upload-test-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testClipsDir, 'config-test-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testRawAssetsDir, 'upload-test-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testRawAssetsDir, 'config-test-clip'), { recursive: true, force: true });
	});

	test('creates a clip from base64 PNG frames', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: 'upload-test-clip',
			frames: [PNG_4x4]
		});
		expect(status).toBe(201);
		expect(data.ok).toBe(true);
		expect(data.clipId).toBe('upload-test-clip');
		expect(data.frames).toBe(1);
		await expect(fs.access(path.join(testClipsDir, 'upload-test-clip', 'sprite.png'))).resolves.toBeUndefined();
	});

	test('rejects invalid clipId', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: '../evil',
			frames: [PNG_4x4]
		});
		expect(status).toBe(400);
		expect(data.error).toContain('Invalid clipId');
	});

	test('rejects empty clipId', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: '',
			frames: [PNG_4x4]
		});
		expect(status).toBe(400);
		expect(data.error).toBe('clipId is required');
	});

	test('rejects missing clipId even when name is provided', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			name: 'My Cool Clip',
			frames: [PNG_4x4]
		});
		expect(status).toBe(400);
		expect(data.error).toBe('clipId is required');
	});

	test('accepts UUID clipId', async () => {
		const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: uuid,
			frames: [PNG_4x4]
		});
		expect(status).toBe(201);
		expect(data.clipId).toBe(uuid);
		await fs.rm(path.join(testClipsDir, uuid), { recursive: true, force: true });
		await fs.rm(path.join(testRawAssetsDir, uuid), { recursive: true, force: true });
	});

	test('rejects empty frames array', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: 'upload-test-clip',
			frames: []
		});
		expect(status).toBe(400);
		expect(data.error).toContain('non-empty array');
	});

	test('rejects duplicate clipId', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'upload-test-clip',
			frames: [PNG_4x4]
		});
		const { status } = await fetchJson('POST', '/api/clips', {
			clipId: 'upload-test-clip',
			frames: [PNG_4x4]
		});
		expect(status).toBe(400);
	});

	test('stores raw assets alongside compiled clip', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'upload-test-clip',
			frames: [PNG_4x4]
		});
		const rawAssetPath = path.join(testRawAssetsDir, 'upload-test-clip', 'frame-0000.png');
		await expect(fs.access(rawAssetPath)).resolves.toBeUndefined();
	});

	test('accepts config params (name, playback, frameRate, targetWidth, targetHeight)', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: 'config-test-clip',
			frames: [PNG_4x4],
			name: 'Test Clip',
			playback: 'once',
			frameRate: 15,
			targetWidth: 8,
			targetHeight: 8
		});
		expect(status).toBe(201);
		expect(data.ok).toBe(true);
		const metaPath = path.join(testClipsDir, 'config-test-clip', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		expect(meta.name).toBe('Test Clip');
		expect(meta.playback).toBe('once');
		expect(meta.frameRatesForFrames['0']).toBe(15);
		const spritePath = path.join(testClipsDir, 'config-test-clip', 'sprite.png');
		const spriteBuffer = await fs.readFile(spritePath);
		const { default: sharp } = await import('sharp');
		const spriteMeta = await sharp(spriteBuffer).metadata();
		expect(spriteMeta.width).toBe(8);
		expect(spriteMeta.height).toBe(8);
	});

	test('maps frameDurations ms to frameRatesForFrames FPS', async () => {
		const { status, data } = await fetchJson('POST', '/api/clips', {
			clipId: 'duration-test-clip',
			frames: [PNG_4x4, PNG_4x4],
			frameDurations: [100, 50]
		});
		expect(status).toBe(201);
		expect(data.frames).toBe(2);
		const meta = JSON.parse(await fs.readFile(path.join(testClipsDir, 'duration-test-clip', 'meta.json'), 'utf8'));
		expect(meta.frameRatesForFrames['0']).toBe(10);
		expect(meta.frameRatesForFrames['1']).toBe(20);
		await fs.rm(path.join(testClipsDir, 'duration-test-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testRawAssetsDir, 'duration-test-clip'), { recursive: true, force: true });
	});

	test('persists scaleMode and round-trips FPS→ms on frame load', async () => {
		const { status } = await fetchJson('POST', '/api/clips', {
			clipId: 'scale-duration-clip',
			frames: [PNG_4x4, PNG_4x4],
			frameDurations: [100, 250],
			scaleMode: 'cover',
			targetWidth: 16,
			targetHeight: 9
		});
		expect(status).toBe(201);
		const meta = JSON.parse(await fs.readFile(path.join(testClipsDir, 'scale-duration-clip', 'meta.json'), 'utf8'));
		expect(meta.scaleMode).toBe('cover');
		expect(meta.frameWidth).toBe(16);
		expect(meta.frameHeight).toBe(9);
		expect(meta.frameRatesForFrames['0']).toBe(10);
		expect(meta.frameRatesForFrames['1']).toBe(4);

		const loaded = await fetchJson('GET', '/api/clips/scale-duration-clip/frames');
		expect(loaded.status).toBe(200);
		expect(loaded.data.meta.scaleMode).toBe('cover');
		expect(loaded.data.durationsMs[0]).toBe(100);
		expect(loaded.data.durationsMs[1]).toBe(250);
		await fs.rm(path.join(testClipsDir, 'scale-duration-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testRawAssetsDir, 'scale-duration-clip'), { recursive: true, force: true });
	});
});

describe('POST /api/expand-gif', () => {
	/** 2×2 two-frame animated GIF; delays 100ms and 250ms. */
	const ANIMATED_GIF_2FRAME =
		'R0lGODlhAgACAPAAAP8AAAAAACH5BAAKAAAAIf8LTkVUU0NBUEUyLjADAQAAACwAAAAAAgACAAACAoRRACH5BAAZAAAALAAAAAACAAIAgAD/AAAAAAIChFEAOw==';

	test('expands animated GIF into PNG frames with delays', async () => {
		const { status, data } = await fetchJson('POST', '/api/expand-gif', {
			image: `data:image/gif;base64,${ANIMATED_GIF_2FRAME}`
		});
		expect(status).toBe(200);
		expect(data.animated).toBe(true);
		expect(data.pages).toBe(2);
		expect(data.frames).toHaveLength(2);
		expect(data.durationsMs).toEqual([100, 250]);
		expect(data.frames[0]).toMatch(/^data:image\/png;base64,/);
	});

	test('rejects missing image payload', async () => {
		const { status, data } = await fetchJson('POST', '/api/expand-gif', {});
		expect(status).toBe(400);
		expect(data.error).toMatch(/image/i);
	});
});

describe('GET/PUT /api/clips/:clipId/frames', () => {
	afterEach(async () => {
		await fs.rm(path.join(testClipsDir, 'frames-api-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testRawAssetsDir, 'frames-api-clip'), { recursive: true, force: true });
	});

	test('returns frames for an existing clip', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'frames-api-clip',
			frames: [PNG_4x4, PNG_4x4],
			frameDurations: [100, 50]
		});
		const { status, data } = await fetchJson('GET', '/api/clips/frames-api-clip/frames');
		expect(status).toBe(200);
		expect(data.source).toBe('raw');
		expect(data.frames).toHaveLength(2);
		expect(data.durationsMs[0]).toBe(100);
		expect(data.durationsMs[1]).toBe(50);
	});

	test('loads sprite cells when raw assets are missing', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'frames-api-clip',
			frames: [PNG_4x4, PNG_4x4],
			frameDurations: [200, 100],
			targetWidth: 8,
			targetHeight: 8
		});
		await fs.rm(path.join(testRawAssetsDir, 'frames-api-clip'), { recursive: true, force: true });
		const { status, data } = await fetchJson('GET', '/api/clips/frames-api-clip/frames');
		expect(status).toBe(200);
		expect(data.source).toBe('sprite');
		expect(data.frames).toHaveLength(2);
		expect(data.durationsMs[0]).toBe(200);
		expect(data.durationsMs[1]).toBe(100);
		expect(data.frames[0]).toMatch(/^data:image\/png;base64,/);
	});

	test('updates frames and rejects empty frame list', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'frames-api-clip',
			frames: [PNG_4x4]
		});
		const empty = await fetchJson('PUT', '/api/clips/frames-api-clip/frames', { frames: [] });
		expect(empty.status).toBe(400);
		expect(empty.data.error).toMatch(/zero frames/i);

		const { status, data } = await fetchJson('PUT', '/api/clips/frames-api-clip/frames', {
			frames: [PNG_4x4, PNG_4x4],
			frameDurations: [100, 100],
			targetWidth: 8,
			targetHeight: 8
		});
		expect(status).toBe(200);
		expect(data.frames).toBe(2);
	});

	test('round-trips editor fields and stamps dimensions on meta-only save', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'frames-api-clip',
			name: 'Original',
			role: 'bitmask',
			frames: [PNG_4x4, PNG_4x4],
			frameDurations: [100, 250],
			playback: 'pingpong',
			scaleMode: 'cover',
			targetWidth: 16,
			targetHeight: 9
		});

		const loaded = await fetchJson('GET', '/api/clips/frames-api-clip/frames');
		expect(loaded.status).toBe(200);
		expect(loaded.data.meta.name).toBe('Original');
		expect(loaded.data.meta.role).toBe('bitmask');
		expect(loaded.data.meta.playback).toBe('pingpong');
		expect(loaded.data.meta.scaleMode).toBe('cover');
		expect(loaded.data.meta.frameWidth).toBe(16);
		expect(loaded.data.meta.frameHeight).toBe(9);
		expect(loaded.data.durationsMs).toEqual([100, 250]);

		const metaOnly = await fetchJson('PUT', '/api/clips/frames-api-clip', {
			name: 'Renamed',
			playback: 'loop',
			scaleMode: 'fit',
			frameWidth: 32,
			frameHeight: 18,
			frameRatesForFrames: { 0: 5, 1: 10 }
		});
		expect(metaOnly.status).toBe(200);
		expect(metaOnly.data.meta.name).toBe('Renamed');
		expect(metaOnly.data.meta.playback).toBe('loop');
		expect(metaOnly.data.meta.scaleMode).toBe('fit');
		expect(metaOnly.data.meta.frameWidth).toBe(32);
		expect(metaOnly.data.meta.frameHeight).toBe(18);
		expect(metaOnly.data.meta.frameRatesForFrames['0']).toBe(5);
		expect(metaOnly.data.meta.role).toBe('bitmask');

		const reloaded = await fetchJson('GET', '/api/clips/frames-api-clip/frames');
		expect(reloaded.data.meta.name).toBe('Renamed');
		expect(reloaded.data.meta.scaleMode).toBe('fit');
		expect(reloaded.data.meta.frameWidth).toBe(32);
		expect(reloaded.data.meta.frameHeight).toBe(18);
		expect(reloaded.data.durationsMs[0]).toBe(200);
		expect(reloaded.data.durationsMs[1]).toBe(100);
	});

	test('frame overwrite save stamps scaleMode and dimensions', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'frames-api-clip',
			frames: [PNG_4x4],
			scaleMode: 'fit',
			targetWidth: 8,
			targetHeight: 8
		});
		const { status } = await fetchJson('PUT', '/api/clips/frames-api-clip/frames', {
			frames: [PNG_4x4, PNG_4x4],
			name: 'Overwritten',
			playback: 'once',
			scaleMode: 'stretch',
			targetWidth: 12,
			targetHeight: 10,
			frameDurations: [50, 50]
		});
		expect(status).toBe(200);
		const meta = JSON.parse(await fs.readFile(path.join(testClipsDir, 'frames-api-clip', 'meta.json'), 'utf8'));
		expect(meta.name).toBe('Overwritten');
		expect(meta.playback).toBe('once');
		expect(meta.scaleMode).toBe('stretch');
		expect(meta.frameWidth).toBe(12);
		expect(meta.frameHeight).toBe(10);
		expect(meta.frames).toBe(2);
		expect(meta.framesPerRow).toBe(2);
	});

	test('round-trips remaining meta fields on create and meta-only save', async () => {
		const created = await fetchJson('POST', '/api/clips', {
			clipId: 'frames-api-clip',
			frames: [PNG_4x4],
			role: 'bitmask',
			retrigger: false,
			triggerType: 'latch',
			triggerGroup: 'masks',
			bitDepth: 4,
			frameDurationBeats: [0.25],
			syncOptionalMeta: true
		});
		expect(created.status).toBe(201);
		const meta = JSON.parse(await fs.readFile(path.join(testClipsDir, 'frames-api-clip', 'meta.json'), 'utf8'));
		expect(meta.retrigger).toBe(false);
		expect(meta.triggerType).toBe('latch');
		expect(meta.triggerGroup).toBe('masks');
		expect(meta.bitDepth).toBe(4);
		expect(meta.frameDurationBeats).toEqual([0.25]);

		const updated = await fetchJson('PUT', '/api/clips/frames-api-clip', {
			retrigger: true,
			triggerType: 'momentary',
			triggerGroup: null,
			role: null,
			bitDepth: null,
			frameDurationBeats: 0.5
		});
		expect(updated.status).toBe(200);
		expect(updated.data.meta.retrigger).toBe(true);
		expect(updated.data.meta.triggerType).toBe('momentary');
		expect(updated.data.meta.triggerGroup).toBeUndefined();
		expect(updated.data.meta.role).toBeUndefined();
		expect(updated.data.meta.bitDepth).toBeUndefined();
		expect(updated.data.meta.frameDurationBeats).toBe(0.5);
	});
});

describe('PUT /api/clips/:clipId', () => {
	afterEach(async () => {
		await fs.writeFile(path.join(testClipsDir, 'test-clip-a', 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, loop: true, retrigger: true }));
	});

	test('updates metadata fields', async () => {
		const { status, data } = await fetchJson('PUT', '/api/clips/test-clip-a', {
			frames: 3,
			framesPerRow: 2,
			loop: false
		});
		expect(status).toBe(200);
		expect(data.ok).toBe(true);
		expect(data.meta.frames).toBe(3);
		expect(data.meta.framesPerRow).toBe(2);
		expect(data.meta.loop).toBe(false);
	});

	test('preserves non-edited fields', async () => {
		const { data } = await fetchJson('PUT', '/api/clips/test-clip-a', {
			frames: 5
		});
		expect(data.meta.retrigger).toBe(true);
		expect(data.meta.png).toBe('sprite.png');
	});

	test('ignores non-whitelisted fields', async () => {
		const { data } = await fetchJson('PUT', '/api/clips/test-clip-a', {
			frames: 2,
			hackedField: 'evil'
		});
		expect(data.meta.hackedField).toBeUndefined();
	});

	test('returns 404 for non-existent clip', async () => {
		const { status, data } = await fetchJson('PUT', '/api/clips/no-such-clip', {
			frames: 1
		});
		expect(status).toBe(404);
		expect(data.error).toContain('no-such-clip');
	});

	test('returns 400 for invalid clipId', async () => {
		const { status, data } = await fetchJson('PUT', '/api/clips/123', {
			frames: 1
		});
		expect(status).toBe(400);
		expect(data.error).toBe('Invalid clipId');
	});
});

describe('GET /api/clips/:clipId/sprite', () => {
	test('serves a PNG sprite', async () => {
		const response = await fetch(`${baseUrl}/api/clips/test-clip-a/sprite`);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/png');
		const buffer = Buffer.from(await response.arrayBuffer());
		expect(buffer.length).toBeGreaterThan(0);
	});

	test('returns 400 for invalid clipId', async () => {
		const { status, data } = await fetchJson('GET', '/api/clips/123/sprite');
		expect(status).toBe(400);
		expect(data.error).toBe('Invalid clipId');
	});
});

describe('Projects API', () => {
	afterEach(async () => {
		await fs.writeFile(path.join(testProjectsDir, 'index.json'), `${JSON.stringify([{ id: 'default', name: 'Default' }], null, '\t')}\n`);
		await fs.writeFile(testActiveProjectPath, `${JSON.stringify({ project: 'default' }, null, '\t')}\n`);
		await fs.rm(path.join(testProjectsDir, 'gig-show'), { recursive: true, force: true });
		await fs.rm(path.join(testProjectsDir, 'custom-id'), { recursive: true, force: true });
	});

	test('lists projects and returns active project', async () => {
		const list = await fetchJson('GET', '/api/projects');
		expect(list.status).toBe(200);
		expect(list.data.projects.some(project => project.id === 'default')).toBe(true);

		const active = await fetchJson('GET', '/api/projects/active');
		expect(active.status).toBe(200);
		expect(active.data.project).toBe('default');
	});

	test('creates, updates, activates, and deletes a project', async () => {
		const created = await fetchJson('POST', '/api/projects', { name: 'Gig Show', copyFrom: 'default' });
		expect(created.status).toBe(201);
		expect(created.data.project.id).toBe('gig-show');

		const got = await fetchJson('GET', '/api/projects/gig-show');
		expect(got.status).toBe(200);
		expect(got.data.project.name).toBe('Gig Show');

		const renamed = await fetchJson('PUT', '/api/projects/gig-show', {
			name: 'Friday Gig',
			settings: { bpm: 128 }
		});
		expect(renamed.status).toBe(200);
		expect(renamed.data.project.name).toBe('Friday Gig');
		expect(renamed.data.project.settings.bpm).toBe(128);

		const activated = await fetchJson('POST', '/api/projects/gig-show/activate');
		expect(activated.status).toBe(200);
		expect(activated.data.project).toBe('gig-show');

		const active = await fetchJson('GET', '/api/projects/active');
		expect(active.data.project).toBe('gig-show');

		const deleted = await fetchJson('DELETE', '/api/projects/gig-show');
		expect(deleted.status).toBe(200);
		const activeAfter = await fetchJson('GET', '/api/projects/active');
		expect(activeAfter.data.project).toBe('default');
	});

	test('rejects deleting the default project', async () => {
		const { status, data } = await fetchJson('DELETE', '/api/projects/default');
		expect(status).toBe(400);
		expect(data.error).toMatch(/default/i);
	});

	test('gets and puts project key-map', async () => {
		await fetchJson('POST', '/api/projects', { name: 'Custom Id', id: 'custom-id' });
		const mapping = await fetchJson('GET', '/api/projects/custom-id/key-map');
		expect(mapping.status).toBe(200);
		expect(Array.isArray(mapping.data.mapping)).toBe(true);

		const updated = await fetchJson('PUT', '/api/projects/custom-id/key-map', {
			mapping: [{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' }]
		});
		expect(updated.status).toBe(200);
		expect(updated.data.mapping).toEqual([{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' }]);
	});


	test('createProject seeds clips from copyFrom project', async () => {
		await fs.mkdir(path.join(testClipsDir, 'seed-source-clip'), { recursive: true });
		await fs.writeFile(path.join(testClipsDir, 'seed-source-clip', 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }));
		await fs.writeFile(path.join(testClipsDir, 'seed-source-clip', 'sprite.png'), Buffer.from(PNG_4x4, 'base64'));

		const created = await fetchJson('POST', '/api/projects', { name: 'Seeded Show', id: 'seeded-show', copyFrom: 'default' });
		expect(created.status).toBe(201);
		const seededMeta = path.join(testProjectsDir, 'seeded-show', 'clips', 'seed-source-clip', 'meta.json');
		await expect(fs.access(seededMeta)).resolves.toBeUndefined();
		await fs.rm(path.join(testProjectsDir, 'seeded-show'), { recursive: true, force: true });
		await fs.rm(path.join(testClipsDir, 'seed-source-clip'), { recursive: true, force: true });
		await fetchJson('POST', '/api/projects/default/activate');
	});

	test('creates project with empty key-map when copyFrom is null', async () => {
		const created = await fetchJson('POST', '/api/projects', { name: 'Blank Map', id: 'blank-map', copyFrom: null });
		expect(created.status).toBe(201);
		const mapping = await fetchJson('GET', '/api/projects/blank-map/key-map');
		expect(mapping.status).toBe(200);
		expect(mapping.data.mapping).toEqual([]);
	});
});

describe('404 handling', () => {
	test('unknown route returns 404', async () => {
		const { status, data } = await fetchJson('GET', '/api/unknown');
		expect(status).toBe(404);
		expect(data.error).toBe('Not found');
	});
});
