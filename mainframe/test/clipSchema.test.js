import { describe, test, expect } from 'vitest';
import { validateMetaFields } from '../scripts/clips/lib/validate/meta.js';
import { PLAYBACK_MODES, TRIGGER_TYPES, VALID_BIT_DEPTHS, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE, DEFAULT_PLAYBACK, DEFAULT_FRAME_RATE, MAX_FRAMES_PER_ROW, DEFAULT_TRIGGER_TYPE, resolveTriggerType } from '../src/js/clipSchema.js';
import { SCALE_MODES } from '../shared/frameFit.js';

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

describe('validateMetaFields — frameDurationsMs', () => {
	function baseMeta(overrides = {}) {
		return { frames: 4, framesPerRow: 2, playback: 'loop', ...overrides };
	}

	test('accepts valid frameDurationsMs array matching frame count', () => {
		const meta = baseMeta({ frameDurationsMs: [1000, 1000, 1000, 1000] });
		const errors = validateMetaFields(meta);
		expect(errors.filter(e => e.includes('frameDurationsMs'))).toEqual([]);
	});

	test('rejects frameDurationsMs that is not an array', () => {
		const meta = baseMeta({ frameDurationsMs: { 0: 1000, 1: 1000 } });
		const errors = validateMetaFields(meta);
		expect(errors.some(e => e.includes('frameDurationsMs must be an array'))).toBe(true);
	});

	test('rejects frameDurationsMs with length mismatching frame count', () => {
		const meta = baseMeta({ frameDurationsMs: [1000, 1000, 1000] });
		const errors = validateMetaFields(meta);
		expect(errors.some(e => e.includes('frameDurationsMs length (3) must match frames (4)'))).toBe(true);
	});

	test('rejects frameDurationsMs with non-positive values', () => {
		const meta = baseMeta({ frameDurationsMs: [1000, 0, 1000, 1000] });
		const errors = validateMetaFields(meta);
		expect(errors.some(e => e.includes('frameDurationsMs[1] must be a positive number'))).toBe(true);
	});

	test('rejects frameDurationsMs with negative values', () => {
		const meta = baseMeta({ frameDurationsMs: [1000, -500, 1000, 1000] });
		const errors = validateMetaFields(meta);
		expect(errors.some(e => e.includes('frameDurationsMs[1] must be a positive number'))).toBe(true);
	});

	test('accepts clips with only frameRatesForFrames (backward compatibility)', () => {
		const meta = baseMeta({ frameRatesForFrames: { 0: 12, 1: 12, 2: 12, 3: 12 } });
		const errors = validateMetaFields(meta);
		expect(errors.filter(e => e.includes('frameRatesForFrames'))).toEqual([]);
	});

	test('accepts clips with both frameDurationsMs and frameRatesForFrames', () => {
		const meta = baseMeta({
			frameDurationsMs: [1000, 1000, 1000, 1000],
			frameRatesForFrames: { 0: 12, 1: 12, 2: 12, 3: 12 }
		});
		const errors = validateMetaFields(meta);
		expect(errors.filter(e => e.includes('frameDurationsMs'))).toEqual([]);
		expect(errors.filter(e => e.includes('frameRatesForFrames'))).toEqual([]);
	});
});

describe('validateMetaFields — scaleMode', () => {
	function baseMeta(overrides = {}) {
		return { frames: 4, framesPerRow: 2, playback: 'loop', ...overrides };
	}

	test('accepts scaleMode: "pattern"', () => {
		const errors = validateMetaFields(baseMeta({ scaleMode: 'pattern' }));
		expect(errors.filter(e => e.includes('scaleMode'))).toEqual([]);
	});

	test('accepts every SCALE_MODES value', () => {
		for (const scaleMode of SCALE_MODES) {
			const errors = validateMetaFields(baseMeta({ scaleMode }));
			expect(
				errors.filter(e => e.includes('scaleMode')),
				scaleMode
			).toEqual([]);
		}
	});

	test('rejects invalid scaleMode', () => {
		const errors = validateMetaFields(baseMeta({ scaleMode: 'tile' }));
		expect(errors.some(e => e.includes('scaleMode must be one of'))).toBe(true);
		expect(errors.some(e => e.includes('pattern'))).toBe(true);
	});

	test('accepts placement object with finite x/y', () => {
		const errors = validateMetaFields(baseMeta({ placement: { x: -12, y: 4.5 } }));
		expect(errors.filter(e => e.includes('placement'))).toEqual([]);
	});

	test('rejects malformed placement', () => {
		expect(validateMetaFields(baseMeta({ placement: 'center' })).some(e => e.includes('placement must be an object'))).toBe(true);
		expect(validateMetaFields(baseMeta({ placement: { x: 'a', y: 0 } })).some(e => e.includes('placement.x'))).toBe(true);
		expect(validateMetaFields(baseMeta({ placement: { x: 0, y: NaN } })).some(e => e.includes('placement.y'))).toBe(true);
	});
});

describe('validateMetaFields — scaling', () => {
	function baseMeta(overrides = {}) {
		return { frames: 4, framesPerRow: 2, playback: 'loop', ...overrides };
	}

	test('accepts nearest and smooth', () => {
		for (const scaling of ['nearest', 'smooth']) {
			const errors = validateMetaFields(baseMeta({ scaling }));
			expect(
				errors.filter(e => e.includes('scaling')),
				scaling
			).toEqual([]);
		}
	});

	test('rejects invalid scaling', () => {
		const errors = validateMetaFields(baseMeta({ scaling: 'bilinear' }));
		expect(errors.some(e => e.includes('scaling must be one of'))).toBe(true);
		expect(errors.some(e => e.includes('nearest'))).toBe(true);
		expect(errors.some(e => e.includes('smooth'))).toBe(true);
	});

	test('omitting scaling is valid', () => {
		const errors = validateMetaFields(baseMeta());
		expect(errors.filter(e => e.includes('scaling'))).toEqual([]);
	});
});

describe('clipSchema constants', () => {
	test('PLAYBACK_MODES matches engine canonical list', () => {
		expect([...PLAYBACK_MODES]).toEqual(['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']);
	});

	test('TRIGGER_TYPES matches expected list', () => {
		expect([...TRIGGER_TYPES]).toEqual(['momentary', 'latch', 'one-shot']);
	});

	test('resolveTriggerType defaults missing/empty to momentary', () => {
		expect(DEFAULT_TRIGGER_TYPE).toBe('momentary');
		expect(resolveTriggerType(undefined)).toBe('momentary');
		expect(resolveTriggerType(null)).toBe('momentary');
		expect(resolveTriggerType('')).toBe('momentary');
		expect(resolveTriggerType('latch')).toBe('latch');
		expect(resolveTriggerType('one-shot')).toBe('one-shot');
		expect(resolveTriggerType('momentary')).toBe('momentary');
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
