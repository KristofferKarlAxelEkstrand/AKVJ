import { describe, test, expect } from 'vitest';
import { validateMetaFields } from '../scripts/clips/lib/validate/meta.js';
import { SYNC_MODES, SYNC_LENGTH_PRESETS } from '../shared/clipSchema.js';

/** Minimal valid meta shell so sync-only assertions are not drowned in other errors. */
function baseMeta(overrides = {}) {
	return {
		frames: 4,
		framesPerRow: 4,
		playback: 'loop',
		frameRatesForFrames: { 0: 12 },
		...overrides
	};
}

function syncErrors(meta) {
	return validateMetaFields(baseMeta(meta)).filter(
		message =>
			message.includes('sync') ||
			message.includes('syncLength') ||
			message.includes('syncBeats') ||
			message.includes('beatsPerBar')
	);
}

describe('validateSyncFields (via validateMetaFields)', () => {
	test('accepts free mode with no syncLength', () => {
		expect(syncErrors({ sync: 'free' })).toEqual([]);
	});

	test('accepts beat mode with a preset syncLength', () => {
		expect(syncErrors({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 })).toEqual([]);
	});

	test('accepts custom syncLength with syncBeats', () => {
		expect(syncErrors({ sync: 'beat', syncLength: 'custom', syncBeats: 6 })).toEqual([]);
	});

	test('accepts all SYNC_LENGTH_PRESETS except custom without syncBeats', () => {
		for (const syncLength of SYNC_LENGTH_PRESETS) {
			if (syncLength === 'custom') {
				continue;
			}
			expect(syncErrors({ sync: 'beat', syncLength }), syncLength).toEqual([]);
		}
	});

	test('rejects sync: beat with missing syncLength', () => {
		const errors = syncErrors({ sync: 'beat' });
		expect(errors).toContain('syncLength is required when sync is "beat"');
	});

	test('rejects invalid sync enum', () => {
		const errors = syncErrors({ sync: 'tempo' });
		expect(errors.some(message => message.startsWith('sync must be one of:'))).toBe(true);
		expect(errors[0]).toContain(SYNC_MODES.join(', '));
	});

	test('rejects invalid syncLength enum', () => {
		const errors = syncErrors({ sync: 'beat', syncLength: 'bogus' });
		expect(errors.some(message => message.startsWith('syncLength must be one of:'))).toBe(true);
		expect(errors[0]).toContain(SYNC_LENGTH_PRESETS.join(', '));
	});

	test('rejects syncLength custom without syncBeats', () => {
		const errors = syncErrors({ sync: 'beat', syncLength: 'custom' });
		expect(errors).toContain('syncBeats is required when syncLength is "custom"');
	});

	test('rejects non-positive syncBeats', () => {
		const errors = syncErrors({ sync: 'beat', syncLength: 'custom', syncBeats: 0 });
		expect(errors.some(message => message.includes('syncBeats must be a positive number'))).toBe(true);
	});

	test('rejects non-integer beatsPerBar', () => {
		const errors = syncErrors({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 4.5 });
		expect(errors.some(message => message.includes('beatsPerBar must be a positive integer'))).toBe(true);
	});

	test('rejects non-positive beatsPerBar', () => {
		const errors = syncErrors({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 0 });
		expect(errors.some(message => message.includes('beatsPerBar must be a positive integer'))).toBe(true);
	});

	test('omitting sync entirely is valid (free/FPS default)', () => {
		expect(syncErrors({})).toEqual([]);
	});
});
