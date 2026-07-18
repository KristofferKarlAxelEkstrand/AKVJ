import { describe, test, expect } from 'vitest';
import {
	CLIP_ID_PATTERN,
	SAFE_PNG_NAME,
	isValidClipId,
	msToFps,
	fpsToMs,
	durationsMsToFrameRates,
	DEFAULT_FALLBACK_FPS,
	SCALE_MODES,
	DEFAULT_SCALE_MODE,
	resolveScaleMode,
	computeFrameDrawRect,
	DEFAULT_FRAME_WIDTH,
	DEFAULT_FRAME_HEIGHT,
	PLAYBACK_MODES,
	DEFAULT_PLAYBACK,
	DEFAULT_FRAME_RATE
} from '../shared/index.js';

describe('mainframe/shared', () => {
	test('isValidClipId matches CLIP_ID_PATTERN rules', () => {
		expect(isValidClipId('neon-skull')).toBe(true);
		expect(isValidClipId('c1_n0')).toBe(true);
		expect(isValidClipId('123')).toBe(false);
		expect(isValidClipId('../x')).toBe(false);
		expect(CLIP_ID_PATTERN.test('ok-id')).toBe(true);
	});

	test('SAFE_PNG_NAME accepts basename png only', () => {
		expect(SAFE_PNG_NAME.test('sprite.png')).toBe(true);
		expect(SAFE_PNG_NAME.test('Sprite.PNG')).toBe(true);
		expect(SAFE_PNG_NAME.test('../sprite.png')).toBe(false);
		expect(SAFE_PNG_NAME.test('sprite.jpg')).toBe(false);
	});

	test('frameTiming converts ms and fps', () => {
		expect(msToFps(1000)).toBe(1);
		expect(fpsToMs(DEFAULT_FALLBACK_FPS)).toBeCloseTo(1000 / 12);
		expect(durationsMsToFrameRates([500, 250])).toEqual({ 0: 2, 1: 4 });
	});

	test('frameFit defaults and computeFrameDrawRect', () => {
		expect(DEFAULT_SCALE_MODE).toBe('fit');
		expect(SCALE_MODES).toContain('cover');
		expect(resolveScaleMode('nope')).toBe('fit');
		const rect = computeFrameDrawRect(100, 50, 240, 135, 'fit');
		expect(rect.dWidth).toBeLessThanOrEqual(240);
		expect(rect.dHeight).toBeLessThanOrEqual(135);
	});

	test('clipSchema canvas and playback defaults', () => {
		expect(DEFAULT_FRAME_WIDTH).toBe(240);
		expect(DEFAULT_FRAME_HEIGHT).toBe(135);
		expect(DEFAULT_PLAYBACK).toBe('loop');
		expect(DEFAULT_FRAME_RATE).toBe(12);
		expect([...PLAYBACK_MODES]).toContain('pingpong');
	});
});
