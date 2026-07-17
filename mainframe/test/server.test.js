import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

const PNG_4x4 = 'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWP4z8DwHxkzkC4AADxAH+HdRw9wAAAAAElFTkSuQmCC';

let testClipsDir;
let server;
let baseUrl;

async function setupTestClipsDir() {
	testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-server-test-'));
	await fs.mkdir(path.join(testClipsDir, 'test-clip-a'), { recursive: true });
	await fs.writeFile(path.join(testClipsDir, 'test-clip-a', 'sprite.png'), Buffer.from(PNG_4x4, 'base64'));
	await fs.writeFile(path.join(testClipsDir, 'test-clip-a', 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, loop: true, retrigger: true }));
	await fs.writeFile(path.join(testClipsDir, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'test-clip-a' } } }, null, '\t'));
}

async function cleanupTestClipsDir() {
	if (testClipsDir) {
		await fs.rm(testClipsDir, { recursive: true, force: true });
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
	await setupTestClipsDir();
	process.env.AKVJ_CLIPS_DIR = testClipsDir;
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
	delete process.env.AKVJ_CLIPS_DIR;
	await cleanupTestClipsDir();
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
		await fs.writeFile(path.join(testClipsDir, 'key-map.json'), JSON.stringify(malformedLayout));
		const { status, data } = await fetchJson('GET', '/api/mapping');
		expect(status).toBe(200);
		expect(data.mapping).toHaveLength(1);
		expect(data.mapping[0].clipId).toBe('test-clip-a');
		await fs.writeFile(path.join(testClipsDir, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'test-clip-a' } } }, null, '\t'));
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
		expect(status).toBe(500);
		expect(data.error).toContain('nonexistent-clip');
	});

	test('rejects mapping with duplicate slots', async () => {
		const { status } = await fetchJson('PUT', '/api/mapping', {
			mapping: [
				{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' },
				{ channel: 1, note: 0, velocity: 0, clipId: 'test-clip-a' }
			]
		});
		expect(status).toBe(500);
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
		await fs.rm(path.join(testClipsDir, '.raw-assets', 'upload-test-clip'), { recursive: true, force: true });
		await fs.rm(path.join(testClipsDir, '.raw-assets', 'config-test-clip'), { recursive: true, force: true });
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
		expect(data.error).toBe('Invalid clipId');
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
		expect(status).toBe(500);
	});

	test('stores raw assets alongside compiled clip', async () => {
		await fetchJson('POST', '/api/clips', {
			clipId: 'upload-test-clip',
			frames: [PNG_4x4]
		});
		const rawAssetPath = path.join(testClipsDir, '.raw-assets', 'upload-test-clip', 'frame-0000.png');
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

describe('404 handling', () => {
	test('unknown route returns 404', async () => {
		const { status, data } = await fetchJson('GET', '/api/unknown');
		expect(status).toBe(404);
		expect(data.error).toBe('Not found');
	});
});
