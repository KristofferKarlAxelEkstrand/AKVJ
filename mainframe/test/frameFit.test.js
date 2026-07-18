import { describe, expect, it } from 'vitest';
import { computeFrameDrawRect, resolveScaleMode, SCALE_MODES, DEFAULT_SCALE_MODE } from '../src/js/frameFit.js';

describe('frameFit', () => {
	it('defaults unknown modes to fit', () => {
		expect(resolveScaleMode('nope')).toBe(DEFAULT_SCALE_MODE);
		expect(SCALE_MODES).toContain('fit');
	});

	it('stretch fills the target', () => {
		expect(computeFrameDrawRect(10, 5, 100, 50, 'stretch')).toEqual({
			sx: 0,
			sy: 0,
			sWidth: 10,
			sHeight: 5,
			dx: 0,
			dy: 0,
			dWidth: 100,
			dHeight: 50
		});
	});

	it('fit letterboxes uniformly', () => {
		const rect = computeFrameDrawRect(100, 50, 100, 100, 'fit');
		expect(rect.dWidth).toBe(100);
		expect(rect.dHeight).toBe(50);
		expect(rect.dx).toBe(0);
		expect(rect.dy).toBe(25);
	});

	it('cover crops uniformly', () => {
		const rect = computeFrameDrawRect(100, 50, 50, 50, 'cover');
		expect(rect.dWidth).toBe(50);
		expect(rect.dHeight).toBe(50);
		expect(rect.sWidth).toBe(50);
		expect(rect.sHeight).toBe(50);
		expect(rect.sx).toBe(25);
		expect(rect.sy).toBe(0);
	});

	it('none centers with pad when source is smaller', () => {
		const rect = computeFrameDrawRect(2, 2, 10, 10, 'none');
		expect(rect.dx).toBe(4);
		expect(rect.dy).toBe(4);
		expect(rect.dWidth).toBe(2);
		expect(rect.dHeight).toBe(2);
		expect(rect.sx).toBe(0);
		expect(rect.sy).toBe(0);
	});

	it('none centered-crops when source is larger', () => {
		const rect = computeFrameDrawRect(20, 20, 10, 10, 'none');
		expect(rect.sx).toBe(5);
		expect(rect.sy).toBe(5);
		expect(rect.sWidth).toBe(10);
		expect(rect.sHeight).toBe(10);
		expect(rect.dx).toBe(0);
		expect(rect.dy).toBe(0);
	});
});
