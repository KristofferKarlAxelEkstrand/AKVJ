import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { fpsToMs, DEFAULT_FALLBACK_FPS } from '../src/js/frameTiming.js';
import { PNG_1x1 } from './utils/pngFixtures.js';

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
			frameBuffers: [PNG_1x1, PNG_1x1],
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
			frameBuffers: [PNG_1x1, PNG_1x1],
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
			frameBuffers: [PNG_1x1, PNG_1x1, PNG_1x1],
			targetWidth: 8,
			targetHeight: 8,
			frameRatesForFrames: { 0: 8, 1: 16, 2: 4 }
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'sprite-durations'), { recursive: true, force: true });
		const result = await loadClipFrameBuffers('sprite-durations');
		expect(result.source).toBe('sprite');
		expect(result.durationsMs).toEqual([fpsToMs(8), fpsToMs(16), fpsToMs(4)]);
	});

	test('hydrates durations from frameDurationsMs when present', async () => {
		await createClipFromFrames({
			clipId: 'ms-durations',
			frameBuffers: [PNG_1x1, PNG_1x1],
			targetWidth: 8,
			targetHeight: 8
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'ms-durations'), { recursive: true, force: true });
		const metaPath = path.join(clipsDir, 'ms-durations', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		delete meta.frameRatesForFrames;
		meta.frameDurationsMs = [41.67, 100];
		await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);

		const result = await loadClipFrameBuffers('ms-durations');
		expect(result.source).toBe('sprite');
		expect(result.durationsMs).toEqual([41.67, 100]);
	});

	test('frameDurationsMs wins over frameRatesForFrames when both present', async () => {
		await createClipFromFrames({
			clipId: 'ms-wins',
			frameBuffers: [PNG_1x1, PNG_1x1],
			targetWidth: 8,
			targetHeight: 8,
			frameRatesForFrames: { 0: 10, 1: 20 }
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'ms-wins'), { recursive: true, force: true });
		const metaPath = path.join(clipsDir, 'ms-wins', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		meta.frameDurationsMs = [50, 250];
		await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);

		const result = await loadClipFrameBuffers('ms-wins');
		expect(result.durationsMs).toEqual([50, 250]);
		expect(result.durationsMs).not.toEqual([fpsToMs(10), fpsToMs(20)]);
	});

	test('extracted sprite cells are PNG with alpha', async () => {
		await createClipFromFrames({
			clipId: 'alpha-sprite',
			frameBuffers: [PNG_1x1],
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
			frameBuffers: [PNG_1x1, PNG_1x1],
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

	test('omitted frameWidth/frameHeight derives cell size as sheet÷grid', async () => {
		// 4 cells × 16×9 → single-row sheet 64×9; cell = floor(sheetW/framesPerRow) × floor(sheetH/rows)
		await createClipFromFrames({
			clipId: 'sheet-grid',
			frameBuffers: [PNG_1x1, PNG_1x1, PNG_1x1, PNG_1x1],
			targetWidth: 16,
			targetHeight: 9
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'sheet-grid'), { recursive: true, force: true });
		const metaPath = path.join(clipsDir, 'sheet-grid', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		delete meta.frameWidth;
		delete meta.frameHeight;
		await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);

		const spriteMeta = await sharp(path.join(clipsDir, 'sheet-grid', meta.png ?? 'sprite.png')).metadata();
		const expectedWidth = Math.floor(spriteMeta.width / meta.framesPerRow);
		const expectedHeight = Math.floor(spriteMeta.height / Math.ceil(meta.frames / meta.framesPerRow));

		const result = await loadClipFrameBuffers('sheet-grid');
		expect(result.source).toBe('sprite');
		expect(result.frames).toHaveLength(4);
		const first = await sharp(result.frames[0]).metadata();
		expect(first.width).toBe(expectedWidth);
		expect(first.height).toBe(expectedHeight);
		expect(first.width).toBe(16);
		expect(first.height).toBe(9);
	});

	test('partial frameWidth/frameHeight: missing side still derives from sheet÷grid', async () => {
		// 2 cells × 12×10 → sheet 24×10; keep only frameWidth, height derives as sheetH/rows
		await createClipFromFrames({
			clipId: 'partial-cell',
			frameBuffers: [PNG_1x1, PNG_1x1],
			targetWidth: 12,
			targetHeight: 10
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'partial-cell'), { recursive: true, force: true });
		const metaPath = path.join(clipsDir, 'partial-cell', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		delete meta.frameHeight;
		await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);

		const result = await loadClipFrameBuffers('partial-cell');
		const first = await sharp(result.frames[0]).metadata();
		expect(first.width).toBe(12);
		expect(first.height).toBe(10);
	});

	test('loads sprite-only clip with frameDurationBeats and no frameWidth (legacy shape)', async () => {
		await createClipFromFrames({
			clipId: 'legacy-beats',
			frameBuffers: [PNG_1x1, PNG_1x1],
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
		expect(result.durationsMs[0]).toBe(fpsToMs(DEFAULT_FALLBACK_FPS));
	});

	test('throws on invalid clipId', async () => {
		await expect(loadClipFrameBuffers('../escape')).rejects.toThrow(/Invalid clipId/);
		await expect(loadClipFrameBuffers('123')).rejects.toThrow(/Invalid clipId/);
	});

	test('throws when clip meta.json is missing', async () => {
		await expect(loadClipFrameBuffers('ghost-clip')).rejects.toThrow(/Clip "ghost-clip" not found/);
	});

	test('throws when meta exists but no raw or sprite frames', async () => {
		const clipPath = path.join(clipsDir, 'empty-clip');
		await fs.mkdir(clipPath, { recursive: true });
		await fs.writeFile(path.join(clipPath, 'meta.json'), `${JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }, null, '\t')}\n`);

		await expect(loadClipFrameBuffers('empty-clip')).rejects.toThrow(/No frames found/);
	});

	test('throws when sprite meta is missing frames or framesPerRow', async () => {
		await createClipFromFrames({
			clipId: 'bad-meta',
			frameBuffers: [PNG_1x1],
			targetWidth: 4,
			targetHeight: 4
		});
		await fs.rm(path.join(clipsDir, '.raw-assets', 'bad-meta'), { recursive: true, force: true });
		const metaPath = path.join(clipsDir, 'bad-meta', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
		delete meta.frames;
		delete meta.numberOfFrames;
		delete meta.framesPerRow;
		await fs.writeFile(metaPath, `${JSON.stringify(meta, null, '\t')}\n`);

		await expect(loadClipFrameBuffers('bad-meta')).rejects.toThrow(/missing frames\/framesPerRow/);
	});
});
