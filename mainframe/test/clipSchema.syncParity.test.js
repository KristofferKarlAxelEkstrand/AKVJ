import { describe, test, expect } from 'vitest';
import {
	SYNC_MODES,
	DEFAULT_SYNC_MODE,
	SYNC_LENGTH_PRESETS,
	DEFAULT_BEATS_PER_BAR
} from '../shared/clipSchema.js';

/**
 * Mainframe `clipSchema.js` must stay aligned with
 * `akvj/src/js/visuals/clipMetadata.js` (no cross-realm import).
 */
describe('clipSchema sync constants (parity with akvj clipMetadata)', () => {
	test('sync modes and defaults match the engine mirror', () => {
		expect(SYNC_MODES).toEqual(['free', 'beat']);
		expect(DEFAULT_SYNC_MODE).toBe('free');
		expect(DEFAULT_BEATS_PER_BAR).toBe(4);
	});

	test('SYNC_LENGTH_PRESETS is the DJ-style list both editor and validation use', () => {
		expect(SYNC_LENGTH_PRESETS).toEqual([
			'1/4 beat',
			'1/2 beat',
			'1 beat',
			'2 beats',
			'1 bar',
			'2 bars',
			'4 bars',
			'8 bars',
			'custom'
		]);
	});
});
