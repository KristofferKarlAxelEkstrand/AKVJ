// @vitest-environment node

import { describe, test, expect } from 'vitest';
import { isPipelineReadyClip } from '../server/clipCatalog.js';

describe('isPipelineReadyClip', () => {
	const readyMeta = { png: 'sprite.png', frames: 4, framesPerRow: 2 };

	test('accepts legacy meta.numberOfFrames alias', () => {
		expect(isPipelineReadyClip({ png: 'sprite.png', numberOfFrames: 3, framesPerRow: 1 }, true)).toBe(true);
	});

	test('rejects path traversal in meta.png', () => {
		expect(isPipelineReadyClip({ ...readyMeta, png: '../evil.png' }, true)).toBe(false);
		expect(isPipelineReadyClip({ ...readyMeta, png: 'subdir/sprite.png' }, true)).toBe(false);
	});

	test('rejects non-integer frames (float)', () => {
		expect(isPipelineReadyClip({ ...readyMeta, frames: 2.5 }, true)).toBe(false);
	});

	test('rejects framesPerRow of 0 or negative', () => {
		expect(isPipelineReadyClip({ ...readyMeta, framesPerRow: 0 }, true)).toBe(false);
		expect(isPipelineReadyClip({ ...readyMeta, framesPerRow: -1 }, true)).toBe(false);
	});

	test('rejects null or undefined meta', () => {
		expect(isPipelineReadyClip(null, true)).toBe(false);
		expect(isPipelineReadyClip(undefined, true)).toBe(false);
	});

	test('rejects when hasSprite is false', () => {
		expect(isPipelineReadyClip(readyMeta, false)).toBe(false);
	});

	test('accepts a valid ready clip', () => {
		expect(isPipelineReadyClip(readyMeta, true)).toBe(true);
	});
});
