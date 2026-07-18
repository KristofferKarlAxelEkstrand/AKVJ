import { describe, test, expect } from 'vitest';
import { validateMetaFields } from '../scripts/clips/lib/validate/meta.js';
import { PLAYBACK_MODES, TRIGGER_TYPES, VALID_BIT_DEPTHS, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE, DEFAULT_PLAYBACK, DEFAULT_FRAME_RATE, MAX_FRAMES_PER_ROW } from '../src/js/clipSchema.js';

describe('validateMetaFields — non-mutation', () => {
	test('does not mutate meta when loop is present', () => {
		const meta = { frames: 4, framesPerRow: 2, loop: false };
		const snapshot = JSON.stringify(meta);
		validateMetaFields(meta);
		expect(JSON.stringify(meta)).toBe(snapshot);
		expect(meta.playback).toBeUndefined();
		expect(meta.loop).toBe(false);
	});

	test('does not mutate meta when loop is true', () => {
		const meta = { frames: 4, framesPerRow: 2, loop: true };
		const snapshot = JSON.stringify(meta);
		validateMetaFields(meta);
		expect(JSON.stringify(meta)).toBe(snapshot);
	});

	test('does not delete or rewrite any fields', () => {
		const meta = {
			frames: 4,
			framesPerRow: 2,
			playback: 'once',
			loop: false,
			retrigger: true,
			name: 'Test',
			png: 'sprite.png',
			triggerType: 'momentary',
			scaleMode: 'fit',
			frameWidth: 240,
			frameHeight: 135
		};
		const snapshot = JSON.stringify(meta);
		validateMetaFields(meta);
		expect(JSON.stringify(meta)).toBe(snapshot);
	});

	test('accepts legacy numberOfFrames instead of frames', () => {
		const meta = { numberOfFrames: 4, framesPerRow: 2 };
		const errors = validateMetaFields(meta);
		expect(errors).not.toContain('frames must be a positive number');
	});

	test('accepts legacy loop=false without playback', () => {
		const meta = { frames: 4, framesPerRow: 2, loop: false };
		const errors = validateMetaFields(meta);
		expect(errors).not.toContain(expect.stringContaining('playback must be one of'));
	});
});

describe('clipSchema constants', () => {
	test('PLAYBACK_MODES matches engine canonical list', () => {
		expect([...PLAYBACK_MODES]).toEqual(['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']);
	});

	test('TRIGGER_TYPES matches expected list', () => {
		expect([...TRIGGER_TYPES]).toEqual(['momentary', 'latch', 'one-shot']);
	});

	test('VALID_BIT_DEPTHS matches expected list', () => {
		expect([...VALID_BIT_DEPTHS]).toEqual([1, 2, 4, 8]);
	});

	test('default dimensions are 240x135', () => {
		expect(DEFAULT_FRAME_WIDTH).toBe(240);
		expect(DEFAULT_FRAME_HEIGHT).toBe(135);
	});

	test('default scale mode is fit', () => {
		expect(DEFAULT_SCALE_MODE).toBe('fit');
	});

	test('default playback is loop', () => {
		expect(DEFAULT_PLAYBACK).toBe('loop');
	});

	test('default frame rate is 12', () => {
		expect(DEFAULT_FRAME_RATE).toBe(12);
	});

	test('max frames per row is 16', () => {
		expect(MAX_FRAMES_PER_ROW).toBe(16);
	});

	test('constants are frozen', () => {
		expect(Object.isFrozen(PLAYBACK_MODES)).toBe(true);
		expect(Object.isFrozen(TRIGGER_TYPES)).toBe(true);
		expect(Object.isFrozen(VALID_BIT_DEPTHS)).toBe(true);
	});
});
