import { describe, test, expect } from 'vitest';
import sharp from 'sharp';
import { resolveCompileOptions, resolveTargetDimensions, resolveFrameRate, resolvePlayback, resolveFramesPerRow, normalizeFrameBuffers, assertReadableFrames, resizeFrames, fitFrameBuffer, fitNone, compositeContentOntoCell, buildComposites, renderSpriteSheet, INGEST_RESIZE_KERNEL, withIngestResizeKernel } from '../shared/spritesheetCore.js';

const DEFAULT_TARGET_WIDTH = 240;
const DEFAULT_TARGET_HEIGHT = 135;
const DEFAULT_FRAME_RATE = 12;
const DEFAULT_FRAMES_PER_ROW = 16;

async function solidPng(width, height, rgba) {
	return sharp({
		create: { width, height, channels: 4, background: rgba }
	})
		.png()
		.toBuffer();
}

async function rawData(buffer) {
	const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	return { data, width: info.width, height: info.height };
}

function rgba(data, width, x, y) {
	const i = (y * width + x) * 4;
	return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

describe('resolveTargetDimensions', () => {
	test('defaults to 240x135 for missing input', () => {
		expect(resolveTargetDimensions()).toEqual({ targetWidth: DEFAULT_TARGET_WIDTH, targetHeight: DEFAULT_TARGET_HEIGHT });
	});

	test('defaults per dimension for non-integer or non-positive values', () => {
		expect(resolveTargetDimensions(100.5, 200)).toEqual({ targetWidth: DEFAULT_TARGET_WIDTH, targetHeight: 200 });
		expect(resolveTargetDimensions(200, -100)).toEqual({ targetWidth: 200, targetHeight: DEFAULT_TARGET_HEIGHT });
		expect(resolveTargetDimensions(-100, -200)).toEqual({ targetWidth: DEFAULT_TARGET_WIDTH, targetHeight: DEFAULT_TARGET_HEIGHT });
		expect(resolveTargetDimensions(0, 0)).toEqual({ targetWidth: DEFAULT_TARGET_WIDTH, targetHeight: DEFAULT_TARGET_HEIGHT });
		expect(resolveTargetDimensions('abc', NaN)).toEqual({ targetWidth: DEFAULT_TARGET_WIDTH, targetHeight: DEFAULT_TARGET_HEIGHT });
	});

	test('respects valid overrides', () => {
		expect(resolveTargetDimensions(320, 180)).toEqual({ targetWidth: 320, targetHeight: 180 });
	});
});

describe('resolveFrameRate', () => {
	test('defaults to 12 for missing input', () => {
		expect(resolveFrameRate()).toBe(DEFAULT_FRAME_RATE);
	});

	test('defaults to 12 for non-finite or non-positive values', () => {
		expect(resolveFrameRate(NaN)).toBe(DEFAULT_FRAME_RATE);
		expect(resolveFrameRate(Infinity)).toBe(DEFAULT_FRAME_RATE);
		expect(resolveFrameRate(0)).toBe(DEFAULT_FRAME_RATE);
		expect(resolveFrameRate(-12)).toBe(DEFAULT_FRAME_RATE);
		expect(resolveFrameRate('fast')).toBe(DEFAULT_FRAME_RATE);
	});

	test('respects valid frame rate', () => {
		expect(resolveFrameRate(30)).toBe(30);
		expect(resolveFrameRate(60.5)).toBe(60.5);
	});
});

describe('resolvePlayback', () => {
	test('defaults to loop for missing input', () => {
		expect(resolvePlayback()).toBe('loop');
	});

	test('defaults to loop for non-string or empty values', () => {
		expect(resolvePlayback(123)).toBe('loop');
		expect(resolvePlayback('')).toBe('loop');
		expect(resolvePlayback(null)).toBe('loop');
	});

	test('preserves valid playback mode', () => {
		expect(resolvePlayback('once')).toBe('once');
		expect(resolvePlayback('pingpong')).toBe('pingpong');
	});
});

describe('resolveCompileOptions', () => {
	test('resolves dimensions, scale mode, frame rate and playback together', () => {
		expect(resolveCompileOptions({ targetWidth: 320, targetHeight: 180, scaleMode: 'cover', frameRate: 24, playback: 'pingpong' })).toEqual({
			targetWidth: 320,
			targetHeight: 180,
			scaleMode: 'cover',
			frameRate: 24,
			playback: 'pingpong'
		});
	});

	test('falls back to defaults for missing or invalid values', () => {
		expect(resolveCompileOptions()).toEqual({
			targetWidth: 240,
			targetHeight: 135,
			scaleMode: 'fit',
			frameRate: 12,
			playback: 'loop'
		});
		expect(resolveCompileOptions({ targetWidth: 0, scaleMode: 'nope', frameRate: -1, playback: '' })).toEqual({
			targetWidth: 240,
			targetHeight: 135,
			scaleMode: 'fit',
			frameRate: 12,
			playback: 'loop'
		});
	});
});

describe('resolveFramesPerRow', () => {
	test('returns 1 for missing or non-positive counts', () => {
		expect(resolveFramesPerRow()).toBe(1);
		expect(resolveFramesPerRow(0)).toBe(1);
		expect(resolveFramesPerRow(-5)).toBe(1);
	});

	test('caps at maxFramesPerRow', () => {
		expect(resolveFramesPerRow(20, 16)).toBe(16);
		expect(resolveFramesPerRow(8, 16)).toBe(8);
	});

	test('uses default max of 16', () => {
		expect(resolveFramesPerRow(100)).toBe(DEFAULT_FRAMES_PER_ROW);
	});
});

describe('normalizeFrameBuffers', () => {
	test('decodes PNG to PNG with alpha', async () => {
		const png = await solidPng(4, 4, { r: 255, g: 0, b: 0, alpha: 255 });
		const [out] = await normalizeFrameBuffers(sharp, [png]);
		const meta = await sharp(out).metadata();
		expect(meta.format).toBe('png');
		expect(meta.hasAlpha).toBe(true);
		expect(meta.width).toBe(4);
		expect(meta.height).toBe(4);
	});

	test('decodes JPEG to PNG with alpha', async () => {
		const jpeg = await sharp(await solidPng(4, 4, { r: 0, g: 255, b: 0, alpha: 255 }))
			.jpeg()
			.toBuffer();
		const [out] = await normalizeFrameBuffers(sharp, [jpeg]);
		const meta = await sharp(out).metadata();
		expect(meta.format).toBe('png');
		expect(meta.hasAlpha).toBe(true);
		expect(meta.width).toBe(4);
		expect(meta.height).toBe(4);
	});

	test('decodes first page of GIF to PNG', async () => {
		const gif = await sharp({
			create: { width: 6, height: 6, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 255 } }
		})
			.gif()
			.toBuffer();
		const [out] = await normalizeFrameBuffers(sharp, [gif]);
		const meta = await sharp(out).metadata();
		expect(meta.format).toBe('png');
		expect(meta.hasAlpha).toBe(true);
		expect(meta.width).toBe(6);
		expect(meta.height).toBe(6);
	});
});

describe('assertReadableFrames', () => {
	test('passes for readable buffers', async () => {
		const png = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		await expect(assertReadableFrames(sharp, [png, png])).resolves.toBeUndefined();
	});

	test('throws for corrupt buffer', async () => {
		await expect(assertReadableFrames(sharp, [Buffer.from('not an image')])).rejects.toThrow('Could not read frame dimensions');
	});
});

describe('ingest resize kernel policy', () => {
	test('INGEST_RESIZE_KERNEL is soft lanczos3, not nearest', () => {
		expect(INGEST_RESIZE_KERNEL).toBe('lanczos3');
		expect(INGEST_RESIZE_KERNEL).not.toBe('nearest');
	});

	test('withIngestResizeKernel always sets the ingest kernel', () => {
		expect(withIngestResizeKernel({ fit: 'fill' })).toEqual({ fit: 'fill', kernel: 'lanczos3' });
		expect(withIngestResizeKernel({ fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'nearest' })).toEqual({
			fit: 'contain',
			background: { r: 0, g: 0, b: 0, alpha: 0 },
			kernel: 'lanczos3'
		});
	});

	test('stretch downscale matches explicit lanczos3 and differs from nearest', async () => {
		const size = 16;
		const raw = Buffer.alloc(size * size * 4);
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const i = (y * size + x) * 4;
				const on = (x + y) % 2 === 0;
				raw[i] = on ? 255 : 0;
				raw[i + 1] = on ? 255 : 0;
				raw[i + 2] = on ? 255 : 0;
				raw[i + 3] = 255;
			}
		}
		const src = await sharp(raw, { raw: { width: size, height: size, channels: 4 } })
			.png()
			.toBuffer();

		const fromFit = await fitFrameBuffer(sharp, src, 8, 8, 'stretch');
		const fitRaw = await sharp(fromFit).ensureAlpha().raw().toBuffer();
		const lanczosRaw = await sharp(src).ensureAlpha().resize(8, 8, { fit: 'fill', kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer();
		const nearestRaw = await sharp(src).ensureAlpha().resize(8, 8, { fit: 'fill', kernel: 'nearest' }).ensureAlpha().raw().toBuffer();

		expect(Buffer.compare(fitRaw, lanczosRaw)).toBe(0);
		expect(Buffer.compare(fitRaw, nearestRaw)).not.toBe(0);
	});
});

describe('resizeFrames', () => {
	test('applies shared scale mode string to all frames', async () => {
		const red = await solidPng(4, 4, { r: 255, g: 0, b: 0, alpha: 255 });
		const out = await resizeFrames(sharp, [red], 8, 8, 'stretch');
		expect(out).toHaveLength(1);
		const meta = await sharp(out[0]).metadata();
		expect(meta.width).toBe(8);
		expect(meta.height).toBe(8);
	});

	test('applies per-frame config array', async () => {
		const red = await solidPng(4, 4, { r: 255, g: 0, b: 0, alpha: 255 });
		const green = await solidPng(4, 4, { r: 0, g: 255, b: 0, alpha: 255 });
		const out = await resizeFrames(sharp, [red, green], 8, 8, [
			{ scaleMode: 'custom', width: 2, height: 2, placement: { x: 0, y: 0 } },
			{ scaleMode: 'fit', placement: { x: 0, y: 0 } }
		]);
		expect(out).toHaveLength(2);
		const { data, width, height } = await rawData(out[0]);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// custom 2x2 centered at (3,3)
		expect(rgba(data, width, 3, 3).r).toBe(255);
		expect(rgba(data, width, 0, 0).a).toBe(0);

		const second = await rawData(out[1]);
		expect(second.width).toBe(8);
		expect(second.height).toBe(8);
		// fit of 4x4 into 8x8 fills the cell
		expect(rgba(second.data, second.width, 0, 0).g).toBe(255);
	});
});

describe('fitFrameBuffer', () => {
	test('stretch fills the cell exactly', async () => {
		const src = await solidPng(4, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, 'stretch');
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 0, 0).r).toBe(255);
		expect(rgba(data, width, 7, 7).r).toBe(255);
	});

	test('fit letterboxes non-square source with transparent background', async () => {
		const src = await solidPng(4, 2, { r: 0, g: 255, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, 'fit');
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// padded rows are transparent; filled rows are green
		expect(rgba(data, width, 0, 0).a).toBe(0);
		expect(rgba(data, width, 4, 4).g).toBe(255);
		expect(rgba(data, width, 0, 7).a).toBe(0);
	});

	test('fit honors placement offsets', async () => {
		const src = await solidPng(4, 2, { r: 0, g: 255, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, { scaleMode: 'fit', placement: { x: 2, y: 0 } });
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// fitted buffer shifted right 2, so leftmost pixels are transparent
		expect(rgba(data, width, 0, 4).a).toBe(0);
		expect(rgba(data, width, 2, 4).g).toBe(255);
	});

	test('cover crops to fill the cell', async () => {
		const src = await solidPng(2, 4, { r: 0, g: 0, b: 255, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, 'cover');
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 0, 0).b).toBe(255);
		expect(rgba(data, width, 7, 7).b).toBe(255);
	});

	test('cover honors placement offsets', async () => {
		const src = await solidPng(2, 4, { r: 0, g: 0, b: 255, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, { scaleMode: 'cover', placement: { x: 2, y: 0 } });
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// shifted right, leftmost pixels are transparent
		expect(rgba(data, width, 0, 4).a).toBe(0);
		expect(rgba(data, width, 2, 4).b).toBe(255);
	});

	test('none centers native-sized content and pads smaller source', async () => {
		const src = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, 'none');
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 0, 0).a).toBe(0);
		expect(rgba(data, width, 3, 3).r).toBe(255);
	});

	test('none crops oversized sources to target center', async () => {
		// 12x12 with a 2x2 red marker at the center
		const marker = await solidPng(12, 12, { r: 0, g: 0, b: 0, alpha: 255 });
		const marked = await sharp(marker)
			.composite([{ input: await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 }), left: 5, top: 5 }])
			.png()
			.toBuffer();
		const cell = await fitFrameBuffer(sharp, marked, 8, 8, 'none');
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// center crop maps source (5,5) to (3,3)
		expect(rgba(data, width, 3, 3).r).toBe(255);
	});

	test('none honors placement offsets', async () => {
		const src = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, { scaleMode: 'none', placement: { x: 2, y: 0 } });
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// 2x2 centered at (3,3) + placement (2,0) -> (5,3)
		expect(rgba(data, width, 5, 3).r).toBe(255);
		expect(rgba(data, width, 3, 3).a).toBe(0);
	});

	test('custom resizes to explicit width/height and places content', async () => {
		const src = await solidPng(4, 4, { r: 255, g: 255, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 10, 10, {
			scaleMode: 'custom',
			width: 2,
			height: 2,
			placement: { x: 2, y: 2 }
		});
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(10);
		expect(height).toBe(10);
		// 2x2 centered at (4,4) + placement (2,2) -> (6,6)
		expect(rgba(data, width, 6, 6).r).toBe(255);
		expect(rgba(data, width, 6, 6).g).toBe(255);
		expect(rgba(data, width, 5, 5).a).toBe(0);
	});
});

describe('fitNone', () => {
	test('crops oversized sources to target center', async () => {
		const marker = await solidPng(12, 12, { r: 0, g: 0, b: 0, alpha: 255 });
		const marked = await sharp(marker)
			.composite([{ input: await solidPng(2, 2, { r: 0, g: 255, b: 0, alpha: 255 }), left: 5, top: 5 }])
			.png()
			.toBuffer();
		const cell = await fitNone(sharp, marked, 8, 8);
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 3, 3).g).toBe(255);
	});

	test('passes smaller sources through and centers them', async () => {
		const src = await solidPng(2, 2, { r: 0, g: 0, b: 255, alpha: 255 });
		const cell = await fitNone(sharp, src, 8, 8);
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 3, 3).b).toBe(255);
		expect(rgba(data, width, 0, 0).a).toBe(0);
	});
});

describe('compositeContentOntoCell', () => {
	test('positive placement offsets shift content right and down', async () => {
		const src = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await compositeContentOntoCell(sharp, src, 8, 8, { x: 2, y: 2 });
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 0, 0).a).toBe(0);
		// centered at (3,3) + (2,2) -> (5,5)
		expect(rgba(data, width, 5, 5).r).toBe(255);
	});

	test('zero offset with cell-sized content passes through', async () => {
		const src = await solidPng(8, 8, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await compositeContentOntoCell(sharp, src, 8, 8, { x: 0, y: 0 });
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		expect(rgba(data, width, 0, 0).r).toBe(255);
		expect(rgba(data, width, 7, 7).r).toBe(255);
	});

	test('fully-off-cell content returns transparent cell', async () => {
		const src = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await compositeContentOntoCell(sharp, src, 8, 8, { x: 10, y: 0 });
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				expect(rgba(data, width, x, y).a).toBe(0);
			}
		}
	});

	test('contentIsFullCell=true shifts cell-sized content by placement', async () => {
		// left half red, right half green
		const red = await solidPng(4, 8, { r: 255, g: 0, b: 0, alpha: 255 });
		const green = await solidPng(4, 8, { r: 0, g: 255, b: 0, alpha: 255 });
		const content = await sharp({
			create: { width: 8, height: 8, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 255 } }
		})
			.composite([
				{ input: red, left: 0, top: 0 },
				{ input: green, left: 4, top: 0 }
			])
			.png()
			.toBuffer();

		const cell = await compositeContentOntoCell(sharp, content, 8, 8, { x: 2, y: 0 }, true);
		const { data, width, height } = await rawData(cell);
		expect(width).toBe(8);
		expect(height).toBe(8);
		// shifted right 2: columns 0-1 red (from original cols 6-7? no, content shifted, left 2 columns cropped)
		// original content: cols 0-3 red, 4-7 green. Shift right 2 -> visible cols 2-7 of original at cols 2-7.
		// So col 2 of cell is original col 0 (red), col 6 is original col 4 (green).
		expect(rgba(data, width, 2, 4).r).toBe(255);
		expect(rgba(data, width, 6, 4).g).toBe(255);
		expect(rgba(data, width, 0, 4).a).toBe(0);
	});

	test('throws for unreadable content', async () => {
		await expect(compositeContentOntoCell(sharp, Buffer.from('invalid'), 8, 8, { x: 0, y: 0 })).rejects.toThrow('Could not read content dimensions');
	});
});

describe('buildComposites', () => {
	test('lays out frames in rows under maxFramesPerRow cap', () => {
		const frames = [Buffer.from('0'), Buffer.from('1'), Buffer.from('2')];
		const composites = buildComposites(frames, 10, 20, 2);
		expect(composites).toHaveLength(3);
		expect(composites[0]).toEqual({ input: frames[0], left: 0, top: 0 });
		expect(composites[1]).toEqual({ input: frames[1], left: 10, top: 0 });
		expect(composites[2]).toEqual({ input: frames[2], left: 0, top: 20 });
	});

	test('uses frame count as framesPerRow when under cap', () => {
		const frames = [Buffer.from('0'), Buffer.from('1')];
		const composites = buildComposites(frames, 8, 8, 16);
		expect(composites[0]).toEqual({ input: frames[0], left: 0, top: 0 });
		expect(composites[1]).toEqual({ input: frames[1], left: 8, top: 0 });
	});
});

describe('renderSpriteSheet', () => {
	test('creates sheet with dimensions width * framesPerRow by height * rows', async () => {
		const red = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const green = await solidPng(2, 2, { r: 0, g: 255, b: 0, alpha: 255 });
		const blue = await solidPng(2, 2, { r: 0, g: 0, b: 255, alpha: 255 });
		const composites = buildComposites([red, green, blue], 2, 2, 2);
		const sheet = await renderSpriteSheet(sharp, composites, 2, 2, 3, 2);
		const { data, width, height } = await rawData(sheet);
		expect(width).toBe(4);
		expect(height).toBe(4);
		expect(rgba(data, width, 0, 0).r).toBe(255);
		expect(rgba(data, width, 2, 0).g).toBe(255);
		expect(rgba(data, width, 0, 2).b).toBe(255);
	});
});
