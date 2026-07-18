import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { fpsToMs } from '../src/js/frameTiming.js';

const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==';

describe('loadClipFrameBuffers', () => {
	let clipsDir;
	let loadClipFrameBuffers;
	let createClipFromFrames;

	beforeEach(async () => {
		clipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-frame-load-'));
		process.env.AKVJ_CLIPS_DIR = clipsDir;
		vi.resetModules();
		({ createClipFromFrames } = await import('../server/spritesheet.js'));
		({ loadClipFrameBuffers } = await import('../server/frameLoad.js'));
	});

	afterEach(async () => {
		delete process.env.AKVJ_CLIPS_DIR;
		if (clipsDir) {
			await fs.rm(clipsDir, { recursive: true, force: true });
		}
	});

	test('prefers raw assets when present', async () => {
		await createClipFromFrames({
			clipId: 'raw-clip',
			frameBuffers: [Buffer.from(PNG_1x1, 'base64'), Buffer.from(PNG_1x1, 'base64')],
			frameRatesForFrames: { 0: 10, 1: 20 }
		});
		const result = await loadClipFrameBuffers('raw-clip');
		expect(result.source).toBe('raw');
		expect(result.frames).toHaveLength(2);
		expect(result.durationsMs[0]).toBe(100);
		expect(result.durationsMs[1]).toBe(50);
	});

	test('extracts sprite cells when raw assets are missing', async () => {
		await createClipFromFrames({
			clipId: 'sprite-only',
			frameBuffers: [Buffer.from(PNG_1x1, 'base64'), Buffer.from(PNG_1x1, 'base64')],
			targetWidth: 4,
			targetHeight: 4,
			frameRatesForFrames: { 0: 5, 1: 10 }
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'sprite-only'), { recursive: true, force: true });
		const result = await loadClipFrameBuffers('sprite-only');
		expect(result.source).toBe('sprite');
		expect(result.frames).toHaveLength(2);
		expect(result.durationsMs[0]).toBe(fpsToMs(5));
		expect(result.durationsMs[1]).toBe(fpsToMs(10));
	});

	test('hydrates durations from frameRatesForFrames on sprite-only clips', async () => {
		await createClipFromFrames({
			clipId: 'sprite-durations',
			frameBuffers: [Buffer.from(PNG_1x1, 'base64'), Buffer.from(PNG_1x1, 'base64'), Buffer.from(PNG_1x1, 'base64')],
			targetWidth: 8,
			targetHeight: 8,
			frameRatesForFrames: { 0: 8, 1: 16, 2: 4 }
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'sprite-durations'), { recursive: true, force: true });
		const result = await loadClipFrameBuffers('sprite-durations');
		expect(result.source).toBe('sprite');
		expect(result.durationsMs).toEqual([fpsToMs(8), fpsToMs(16), fpsToMs(4)]);
	});

	test('extracted sprite cells are PNG with alpha', async () => {
		await createClipFromFrames({
			clipId: 'alpha-sprite',
			frameBuffers: [Buffer.from(PNG_1x1, 'base64')],
			targetWidth: 4,
			targetHeight: 4
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'alpha-sprite'), { recursive: true, force: true });
		const result = await loadClipFrameBuffers('alpha-sprite');
		const meta = await sharp(result.frames[0]).metadata();
		expect(meta.format).toBe('png');
		expect(meta.hasAlpha).toBe(true);
	});

	test('uses frameWidth/frameHeight from meta when set', async () => {
		await createClipFromFrames({
			clipId: 'sized-sprite',
			frameBuffers: [Buffer.from(PNG_1x1, 'base64'), Buffer.from(PNG_1x1, 'base64')],
			targetWidth: 16,
			targetHeight: 9
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'sized-sprite'), { recursive: true, force: true });
		const result = await loadClipFrameBuffers('sized-sprite');
		expect(result.source).toBe('sprite');
		expect(result.frames).toHaveLength(2);
		const first = await sharp(result.frames[0]).metadata();
		expect(first.width).toBe(16);
		expect(first.height).toBe(9);
	});

	test('loads sprite-only clip with frameDurationBeats and no frameWidth (legacy shape)', async () => {
		await createClipFromFrames({
			clipId: 'legacy-beats',
			frameBuffers: [Buffer.from(PNG_1x1, 'base64'), Buffer.from(PNG_1x1, 'base64')],
			targetWidth: 8,
			targetHeight: 8
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'legacy-beats'), { recursive: true, force: true });
		const metaPath = path.join(clipsDir, 'legacy-beats', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		delete meta.frameWidth;
		delete meta.frameHeight;
		delete meta.scaleMode;
		delete meta.frameRatesForFrames;
		meta.frameDurationBeats = 0.5;
		await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);

		const result = await loadClipFrameBuffers('legacy-beats');
		expect(result.source).toBe('sprite');
		expect(result.frames).toHaveLength(2);
		expect(result.meta.frameDurationBeats).toBe(0.5);
		expect(result.durationsMs[0]).toBe(fpsToMs(12));
	});
});
