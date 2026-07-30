import { describe, test, expect } from 'vitest';
import sharp from 'sharp';
import { fitFrameBuffer, compositeContentOntoCell } from '../shared/spritesheetCore.js';
import { resolveFrameBakeConfig, areFrameBakeConfigsUniform, FRAME_BAKE_SCALE_MODES } from '../shared/frameBake.js';

async function solidPng(width, height, rgba) {
	return sharp({
		create: { width, height, channels: 4, background: rgba }
	})
		.png()
		.toBuffer();
}

describe('frameBake helpers', () => {
	test('FRAME_BAKE_SCALE_MODES includes custom but not pattern', () => {
		expect(FRAME_BAKE_SCALE_MODES).toContain('custom');
		expect(FRAME_BAKE_SCALE_MODES).not.toContain('pattern');
	});

	test('resolveFrameBakeConfig honors a raw "pattern" scaleMode instead of coercing to "fit"', () => {
		expect(resolveFrameBakeConfig({ scaleMode: 'pattern' }).scaleMode).toBe('pattern');
	});

	test('resolveFrameBakeConfig defaults and floors placement', () => {
		expect(resolveFrameBakeConfig({ scaleMode: 'custom', width: 32.9, height: 16, placement: { x: 1.2, y: -2.8 } })).toEqual({
			scaleMode: 'custom',
			width: 32,
			height: 16,
			placement: { x: 1, y: -3 }
		});
	});

	test('areFrameBakeConfigsUniform ignores custom size when mode is not custom', () => {
		expect(areFrameBakeConfigsUniform([resolveFrameBakeConfig({ scaleMode: 'fit', width: 10, height: 10 }), resolveFrameBakeConfig({ scaleMode: 'fit', width: 99, height: 99 })])).toBe(true);
		expect(areFrameBakeConfigsUniform([resolveFrameBakeConfig({ scaleMode: 'custom', width: 10, height: 10 }), resolveFrameBakeConfig({ scaleMode: 'custom', width: 99, height: 99 })])).toBe(false);
	});
});

describe('fitFrameBuffer placement + custom', () => {
	test('none mode with placement offset shifts opaque pixel from center', async () => {
		const src = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 8, 8, {
			scaleMode: 'none',
			placement: { x: 2, y: 0 }
		});
		const { data, info } = await sharp(cell).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		expect(info.width).toBe(8);
		expect(info.height).toBe(8);
		// Center without offset would place 2×2 at left=3. With +2 → left=5.
		const idx = (y, x) => (y * info.width + x) * 4;
		expect(data[idx(3, 5)]).toBe(255);
		expect(data[idx(3, 3)]).toBe(0);
	});

	test('custom size draws image at absolute pixels then places in cell', async () => {
		const src = await solidPng(4, 4, { r: 0, g: 255, b: 0, alpha: 255 });
		const cell = await fitFrameBuffer(sharp, src, 10, 10, {
			scaleMode: 'custom',
			width: 2,
			height: 2,
			placement: { x: 0, y: 0 }
		});
		const { data, info } = await sharp(cell).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		expect(info.width).toBe(10);
		const idx = (y, x) => (y * info.width + x) * 4;
		// 2×2 centered in 10×10 → left/top = 4
		expect(data[idx(4, 4) + 1]).toBe(255);
		expect(data[idx(0, 0) + 1]).toBe(0);
	});

	test('fitFrameBuffer with a raw "pattern" scaleMode string bakes native-size, matching "none" (regression for #515)', async () => {
		const src = await solidPng(2, 2, { r: 255, g: 0, b: 0, alpha: 255 });
		const patternCell = await fitFrameBuffer(sharp, src, 8, 8, 'pattern');
		const noneCell = await fitFrameBuffer(sharp, src, 8, 8, 'none');
		const fitCell = await fitFrameBuffer(sharp, src, 8, 8, 'fit');
		expect(patternCell.equals(noneCell)).toBe(true);
		expect(patternCell.equals(fitCell)).toBe(false);
	});

	test('compositeContentOntoCell clips when placement pushes content off-cell', async () => {
		const src = await solidPng(4, 4, { r: 0, g: 0, b: 255, alpha: 255 });
		const cell = await compositeContentOntoCell(sharp, src, 4, 4, { x: 10, y: 0 });
		const { data } = await sharp(cell).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
		expect(data.every((value, i) => i % 4 === 3 || value === 0)).toBe(true);
	});
});
