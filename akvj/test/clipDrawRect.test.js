import { describe, test, expect, vi } from 'vitest';
import { MAX_PATTERN_TILES_PER_FRAME, computeDrawRect, drawStretch, drawWithScaleMode, drawPattern } from '../src/js/visuals/clipDrawRect.js';

const TARGET_WIDTH = 240;
const TARGET_HEIGHT = 135;

function createMockDrawContext() {
	return { drawImage: vi.fn() };
}

describe('MAX_PATTERN_TILES_PER_FRAME', () => {
	test('is 2048', () => {
		expect(MAX_PATTERN_TILES_PER_FRAME).toBe(2048);
	});
});

describe('computeDrawRect', () => {
	describe('fit', () => {
		test('fills the canvas when source matches target', () => {
			expect(computeDrawRect(240, 135, TARGET_WIDTH, TARGET_HEIGHT, 'fit')).toEqual({
				sx: 0,
				sy: 0,
				sWidth: 240,
				sHeight: 135,
				dx: 0,
				dy: 0,
				dWidth: 240,
				dHeight: 135
			});
		});

		test('letterboxes a smaller source centered on the canvas', () => {
			// scale = min(240/120, 135/68) = 135/68
			// dWidth = floor(120 * 135/68) = 238; dHeight = 135
			// dx = floor((240 - 238) / 2) = 1; dy = 0
			expect(computeDrawRect(120, 68, TARGET_WIDTH, TARGET_HEIGHT, 'fit')).toEqual({
				sx: 0,
				sy: 0,
				sWidth: 120,
				sHeight: 68,
				dx: 1,
				dy: 0,
				dWidth: 238,
				dHeight: 135
			});
		});
	});

	describe('cover', () => {
		test('crops the source centered and fills the canvas', () => {
			// scale = max(240/100, 135/100) = 2.4
			// sWidth = 240/2.4 = 100; sHeight = 135/2.4 = 56.25 → snap 56
			// sx = 0; sy = floor((100 - 56.25) / 2) = 21
			expect(computeDrawRect(100, 100, TARGET_WIDTH, TARGET_HEIGHT, 'cover')).toEqual({
				sx: 0,
				sy: 21,
				sWidth: 100,
				sHeight: 56,
				dx: 0,
				dy: 0,
				dWidth: TARGET_WIDTH,
				dHeight: TARGET_HEIGHT
			});
		});
	});

	describe('none', () => {
		test('pads a smaller source centered without scaling', () => {
			expect(computeDrawRect(100, 50, TARGET_WIDTH, TARGET_HEIGHT, 'none')).toEqual({
				sx: 0,
				sy: 0,
				sWidth: 100,
				sHeight: 50,
				dx: 70,
				dy: 42,
				dWidth: 100,
				dHeight: 50
			});
		});

		test('crops a larger source centered without scaling', () => {
			expect(computeDrawRect(300, 200, TARGET_WIDTH, TARGET_HEIGHT, 'none')).toEqual({
				sx: 30,
				sy: 32,
				sWidth: 240,
				sHeight: 135,
				dx: 0,
				dy: 0,
				dWidth: 240,
				dHeight: 135
			});
		});
	});
});

describe('drawStretch', () => {
	test('draws the source frame to the full target canvas', () => {
		const ctx = createMockDrawContext();
		const image = { width: 480, height: 135 };

		drawStretch(ctx, image, 240, 0, 240, 135, TARGET_WIDTH, TARGET_HEIGHT);

		expect(ctx.drawImage).toHaveBeenCalledTimes(1);
		expect(ctx.drawImage).toHaveBeenCalledWith(image, 240, 0, 240, 135, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
	});
});

describe('drawWithScaleMode', () => {
	test('applies placement offset on top of fit centering', () => {
		const ctx = createMockDrawContext();
		const image = { width: 120, height: 68 };

		drawWithScaleMode(ctx, image, 0, 0, 120, 68, TARGET_WIDTH, TARGET_HEIGHT, 'fit', { x: 10, y: 5 });

		// Base fit rect: dx=1, dy=0 → placed at snap(1+10)=11, snap(0+5)=5
		expect(ctx.drawImage).toHaveBeenCalledTimes(1);
		expect(ctx.drawImage).toHaveBeenCalledWith(image, 0, 0, 120, 68, 11, 5, 238, 135);
	});

	test('snaps fractional placement to whole pixels', () => {
		const ctx = createMockDrawContext();
		const image = { width: 100, height: 100 };

		drawWithScaleMode(ctx, image, 0, 0, 100, 100, TARGET_WIDTH, TARGET_HEIGHT, 'none', { x: 10.7, y: 20.3 });

		const call = ctx.drawImage.mock.calls[0];
		const base = computeDrawRect(100, 100, TARGET_WIDTH, TARGET_HEIGHT, 'none');
		expect(call[5]).toBe(Math.floor(base.dx + 10.7));
		expect(call[6]).toBe(Math.floor(base.dy + 20.3));
	});

	test('offsets the source sample by cover crop sx/sy', () => {
		const ctx = createMockDrawContext();
		const image = { width: 200, height: 200 };
		const sourceX = 40;
		const sourceY = 10;

		drawWithScaleMode(ctx, image, sourceX, sourceY, 100, 100, TARGET_WIDTH, TARGET_HEIGHT, 'cover', { x: 0, y: 0 });

		const rect = computeDrawRect(100, 100, TARGET_WIDTH, TARGET_HEIGHT, 'cover');
		expect(ctx.drawImage).toHaveBeenCalledWith(image, sourceX + rect.sx, sourceY + rect.sy, rect.sWidth, rect.sHeight, rect.dx, rect.dy, rect.dWidth, rect.dHeight);
	});
});

describe('drawPattern', () => {
	test('returns without drawing when tile dimensions are non-positive', () => {
		const ctx = createMockDrawContext();
		const image = { width: 8, height: 8 };

		drawPattern(ctx, image, 0, 0, 0, 8, TARGET_WIDTH, TARGET_HEIGHT, { x: 0, y: 0 });
		drawPattern(ctx, image, 0, 0, 8, -1, TARGET_WIDTH, TARGET_HEIGHT, { x: 0, y: 0 });

		expect(ctx.drawImage).not.toHaveBeenCalled();
	});

	test('tiles across the canvas including a leading negative offset row/column', () => {
		const ctx = createMockDrawContext();
		const image = { width: 60, height: 45 };
		const tileWidth = 60;
		const tileHeight = 45;

		drawPattern(ctx, image, 0, 0, tileWidth, tileHeight, TARGET_WIDTH, TARGET_HEIGHT, { x: 0, y: 0 });

		const drawCalls = ctx.drawImage.mock.calls;
		// Starts at (-60, -45) so full 240×135 coverage needs more than 4×3 = 12 tiles
		expect(drawCalls.length).toBeGreaterThanOrEqual(12);
		expect(drawCalls.length).toBeLessThan(MAX_PATTERN_TILES_PER_FRAME);

		for (const call of drawCalls) {
			expect(call[3]).toBe(tileWidth);
			expect(call[4]).toBe(tileHeight);
			expect(call[7]).toBe(tileWidth);
			expect(call[8]).toBe(tileHeight);
		}

		const first = drawCalls[0];
		expect(first[5]).toBe(-tileWidth);
		expect(first[6]).toBe(-tileHeight);
	});

	test('shifts the tile grid by placement modulo tile size', () => {
		const ctx = createMockDrawContext();
		const image = { width: 60, height: 45 };

		drawPattern(ctx, image, 0, 0, 60, 45, TARGET_WIDTH, TARGET_HEIGHT, { x: 30, y: 0 });

		const xs = new Set(ctx.drawImage.mock.calls.map(call => call[5]));
		expect(xs.has(30 - 60)).toBe(true);
		expect(xs.has(30)).toBe(true);
	});

	test('clamps draw calls at MAX_PATTERN_TILES_PER_FRAME', () => {
		const ctx = createMockDrawContext();
		const image = { width: 1, height: 1 };

		drawPattern(ctx, image, 0, 0, 1, 1, TARGET_WIDTH, TARGET_HEIGHT, { x: 0, y: 0 });

		expect(ctx.drawImage).toHaveBeenCalledTimes(MAX_PATTERN_TILES_PER_FRAME);
	});
});
