import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

const PNG_1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGD4DwABBAEAfbLI3wAAAABJRU5ErkJggg==';
const PNG_2x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWP4z8DwH4QZYAwAR8oH+Xm0fdIAAAAASUVORK5CYII=';

function makeFrame(buffer) {
	return Buffer.from(buffer, 'base64');
}

describe('createClipFromFrames', () => {
	let clipsDir;
	let createClipFromFrames;

	beforeEach(async () => {
		clipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-spritesheet-clips-'));
		process.env.AKVJ_CLIPS_DIR = clipsDir;
		vi.resetModules();
		const module = await import('../server/spritesheet.js');
		createClipFromFrames = module.createClipFromFrames;
	});

	afterEach(async () => {
		delete process.env.AKVJ_CLIPS_DIR;
		if (clipsDir) {
			await fs.rm(clipsDir, { recursive: true, force: true });
		}
	});

	test('rejects invalid clipId', async () => {
		await expect(createClipFromFrames({ clipId: '../escape', frameBuffers: [makeFrame(PNG_1x1)] })).rejects.toThrow('Invalid clipId');
	});

	test('rejects empty frame array', async () => {
		await expect(createClipFromFrames({ clipId: 'test-clip', frameBuffers: [] })).rejects.toThrow('At least one frame image is required');
	});

	test('rejects non-array frameBuffers', async () => {
		await expect(createClipFromFrames({ clipId: 'test-clip', frameBuffers: null })).rejects.toThrow('At least one frame image is required');
	});

	test('creates a clip with a single frame', async () => {
		const result = await createClipFromFrames({
			clipId: 'single-frame',
			frameBuffers: [makeFrame(PNG_1x1)]
		});
		expect(result.clipId).toBe('single-frame');
		expect(result.frames).toBe(1);
		expect(result.framesPerRow).toBe(1);

		const spritePath = path.join(clipsDir, 'single-frame', 'sprite.png');
		const metaPath = path.join(clipsDir, 'single-frame', 'meta.json');
		expect(await fs.access(spritePath).then(() => true)).toBe(true);
		expect(await fs.access(metaPath).then(() => true)).toBe(true);
	});

	test('creates a clip from JPEG and GIF stills', async () => {
		const { default: sharp } = await import('sharp');
		const jpegBuf = await sharp({
			create: { width: 1, height: 1, channels: 3, background: { r: 255, g: 0, b: 0 } }
		})
			.jpeg()
			.toBuffer();
		const gifBuf = await sharp({
			create: { width: 1, height: 1, channels: 3, background: { r: 0, g: 255, b: 0 } }
		})
			.gif()
			.toBuffer();

		const jpegResult = await createClipFromFrames({
			clipId: 'jpeg-still',
			frameBuffers: [jpegBuf]
		});
		expect(jpegResult.frames).toBe(1);

		const gifResult = await createClipFromFrames({
			clipId: 'gif-still',
			frameBuffers: [gifBuf]
		});
		expect(gifResult.frames).toBe(1);
	});

	test('creates a clip with multiple frames', async () => {
		const result = await createClipFromFrames({
			clipId: 'multi-frame',
			frameBuffers: [makeFrame(PNG_1x1), makeFrame(PNG_1x1), makeFrame(PNG_1x1)]
		});
		expect(result.frames).toBe(3);
		expect(result.framesPerRow).toBe(3);

		const metaPath = path.join(clipsDir, 'multi-frame', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
		expect(meta.frames).toBe(3);
		expect(meta.framesPerRow).toBe(3);
		expect(meta.png).toBe('sprite.png');
		expect(meta.playback).toBe('loop');
		expect(meta.retrigger).toBe(true);
		expect(meta.frameRatesForFrames[0]).toBe(12);
	});

	test('writes meta with bitmask role and bitDepth', async () => {
		await createClipFromFrames({
			clipId: 'mask-clip',
			frameBuffers: [makeFrame(PNG_1x1)],
			role: 'bitmask'
		});
		const metaPath = path.join(clipsDir, 'mask-clip', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
		expect(meta.role).toBe('bitmask');
		expect(meta.bitDepth).toBe(1);
	});

	test('writes meta with custom name, playback, and frameRate', async () => {
		await createClipFromFrames({
			clipId: 'custom-clip',
			frameBuffers: [makeFrame(PNG_1x1)],
			name: 'My Cool Clip',
			playback: 'once',
			frameRate: 24
		});
		const metaPath = path.join(clipsDir, 'custom-clip', 'meta.json');
		const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
		expect(meta.name).toBe('My Cool Clip');
		expect(meta.playback).toBe('once');
		expect(meta.frameRatesForFrames[0]).toBe(24);
	});

	test('accepts frames with mismatched dimensions using fit scale mode', async () => {
		const result = await createClipFromFrames({
			clipId: 'mismatch',
			frameBuffers: [makeFrame(PNG_1x1), makeFrame(PNG_2x2)],
			targetWidth: 8,
			targetHeight: 8,
			scaleMode: 'fit'
		});
		expect(result.frames).toBe(2);
		const meta = JSON.parse(await fs.readFile(path.join(clipsDir, 'mismatch', 'meta.json'), 'utf-8'));
		expect(meta.scaleMode).toBe('fit');
		expect(meta.frameWidth).toBe(8);
		expect(meta.frameHeight).toBe(8);
	});

	test('preserves alpha channel in fitted spritesheet', async () => {
		const { default: sharp } = await import('sharp');
		const transparentPng = await sharp({
			create: { width: 2, height: 2, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 0 } }
		})
			.png()
			.toBuffer();
		await createClipFromFrames({
			clipId: 'alpha-clip',
			frameBuffers: [transparentPng],
			targetWidth: 4,
			targetHeight: 4,
			scaleMode: 'fit'
		});
		const sprite = await sharp(path.join(clipsDir, 'alpha-clip', 'sprite.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		expect(sprite.info.channels).toBe(4);
		// Corner pixel of letterboxed fit should be transparent
		expect(sprite.data[3]).toBe(0);
	});

	test('none scale mode centers without stretching', async () => {
		const result = await createClipFromFrames({
			clipId: 'none-scale',
			frameBuffers: [makeFrame(PNG_1x1)],
			targetWidth: 4,
			targetHeight: 4,
			scaleMode: 'none'
		});
		expect(result.frames).toBe(1);
		const meta = JSON.parse(await fs.readFile(path.join(clipsDir, 'none-scale', 'meta.json'), 'utf-8'));
		expect(meta.scaleMode).toBe('none');
	});

	test('rejects when clip already exists', async () => {
		await createClipFromFrames({
			clipId: 'existing-clip',
			frameBuffers: [makeFrame(PNG_1x1)]
		});
		await expect(
			createClipFromFrames({
				clipId: 'existing-clip',
				frameBuffers: [makeFrame(PNG_1x1)]
			})
		).rejects.toThrow('already exists');
	});

	test('stores raw assets for future re-processing', async () => {
		await createClipFromFrames({
			clipId: 'raw-test',
			frameBuffers: [makeFrame(PNG_1x1), makeFrame(PNG_1x1)]
		});
		const rawDir = path.join(clipsDir, '.raw-assets', 'raw-test');
		const files = await fs.readdir(rawDir);
		expect(files).toHaveLength(2);
		expect(files[0]).toBe('frame-0000.png');
		expect(files[1]).toBe('frame-0001.png');
	});

	test('resizes frames to custom target dimensions', async () => {
		const sharp = (await import('sharp')).default;
		await createClipFromFrames({
			clipId: 'resized-clip',
			frameBuffers: [makeFrame(PNG_2x2)],
			targetWidth: 16,
			targetHeight: 9
		});
		const spritePath = path.join(clipsDir, 'resized-clip', 'sprite.png');
		const meta = await sharp(spritePath).metadata();
		expect(meta.width).toBe(16);
		expect(meta.height).toBe(9);
	});

	test('uses default 240x135 dimensions when not specified', async () => {
		const sharp = (await import('sharp')).default;
		await createClipFromFrames({
			clipId: 'default-size',
			frameBuffers: [makeFrame(PNG_1x1)]
		});
		const spritePath = path.join(clipsDir, 'default-size', 'sprite.png');
		const meta = await sharp(spritePath).metadata();
		expect(meta.width).toBe(240);
		expect(meta.height).toBe(135);
	});

	test('caps framesPerRow at 16 for many frames', async () => {
		const frames = Array.from({ length: 20 }, () => makeFrame(PNG_1x1));
		const result = await createClipFromFrames({
			clipId: 'many-frames',
			frameBuffers: frames
		});
		expect(result.framesPerRow).toBe(16);
	});
});

describe('recompileClip', () => {
	let clipsDir;
	let createClipFromFrames;
	let recompileClip;

	beforeEach(async () => {
		clipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-spritesheet-recompile-'));
		process.env.AKVJ_CLIPS_DIR = clipsDir;
		vi.resetModules();
		const module = await import('../server/spritesheet.js');
		createClipFromFrames = module.createClipFromFrames;
		recompileClip = module.recompileClip;
	});

	afterEach(async () => {
		delete process.env.AKVJ_CLIPS_DIR;
		if (clipsDir) {
			await fs.rm(clipsDir, { recursive: true, force: true });
		}
	});

	test('rejects invalid clipId', async () => {
		await expect(recompileClip({ clipId: '../escape' })).rejects.toThrow('Invalid clipId');
	});

	test('throws when no raw assets exist', async () => {
		await expect(recompileClip({ clipId: 'no-raw' })).rejects.toThrow('No raw assets found');
	});

	test('recompiles with default dimensions from raw assets', async () => {
		await createClipFromFrames({
			clipId: 'recompile-default',
			frameBuffers: [makeFrame(PNG_1x1), makeFrame(PNG_1x1)]
		});
		const result = await recompileClip({ clipId: 'recompile-default' });
		expect(result.clipId).toBe('recompile-default');
		expect(result.frames).toBe(2);
		expect(result.framesPerRow).toBe(2);

		const meta = JSON.parse(await fs.readFile(path.join(clipsDir, 'recompile-default', 'meta.json'), 'utf8'));
		expect(meta.frames).toBe(2);
		expect(meta.playback).toBe('loop');
	});

	test('recompiles with custom target dimensions', async () => {
		await createClipFromFrames({
			clipId: 'recompile-resized',
			frameBuffers: [makeFrame(PNG_2x2), makeFrame(PNG_2x2)]
		});
		const result = await recompileClip({
			clipId: 'recompile-resized',
			targetWidth: 120,
			targetHeight: 68
		});
		expect(result.frames).toBe(2);

		const sharp = (await import('sharp')).default;
		const spritePath = path.join(clipsDir, 'recompile-resized', 'sprite.png');
		const meta = await sharp(spritePath).metadata();
		expect(meta.width).toBe(240);
		expect(meta.height).toBe(68);
	});

	test('recompiles with updated playback and frameRate', async () => {
		await createClipFromFrames({
			clipId: 'recompile-opts',
			frameBuffers: [makeFrame(PNG_1x1)],
			playback: 'loop',
			frameRate: 12
		});
		await recompileClip({
			clipId: 'recompile-opts',
			playback: 'once',
			frameRate: 24
		});
		const meta = JSON.parse(await fs.readFile(path.join(clipsDir, 'recompile-opts', 'meta.json'), 'utf8'));
		expect(meta.playback).toBe('once');
		expect(meta.frameRatesForFrames['0']).toBe(24);
	});

	test('preserves existing meta fields not overridden by recompile', async () => {
		await createClipFromFrames({
			clipId: 'recompile-preserve',
			frameBuffers: [makeFrame(PNG_1x1)],
			role: 'bitmask'
		});
		await recompileClip({ clipId: 'recompile-preserve' });
		const meta = JSON.parse(await fs.readFile(path.join(clipsDir, 'recompile-preserve', 'meta.json'), 'utf8'));
		expect(meta.role).toBe('bitmask');
		expect(meta.bitDepth).toBe(1);
	});

	test('overwrites existing sprite.png', async () => {
		await createClipFromFrames({
			clipId: 'recompile-overwrite',
			frameBuffers: [makeFrame(PNG_1x1)],
			targetWidth: 120,
			targetHeight: 68
		});
		const originalSprite = await fs.readFile(path.join(clipsDir, 'recompile-overwrite', 'sprite.png'));
		await recompileClip({
			clipId: 'recompile-overwrite',
			targetWidth: 240,
			targetHeight: 135
		});
		const newSprite = await fs.readFile(path.join(clipsDir, 'recompile-overwrite', 'sprite.png'));
		expect(newSprite.length).not.toBe(originalSprite.length);
	});
});
