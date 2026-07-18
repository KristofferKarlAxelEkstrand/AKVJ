import { describe, test, expect } from 'vitest';
import {
	expandSyncToFrameDurationBeats,
	resolveFrameDurationBeats,
	frameDurationBeatsToPreviewMs,
	PREVIEW_SYNC_BPM
} from '../src/js/syncTiming.js';

/**
 * Parity suite vs akvj/test/clipMetadata.test.js (Task 136 sync expansion cases).
 */
describe('syncTiming (mainframe mirror of akvj clipMetadata expand)', () => {
	test('explicit frameDurationBeats takes precedence over sync fields', () => {
		const beats = resolveFrameDurationBeats(
			{
				sync: 'beat',
				syncLength: '1 bar',
				frameDurationBeats: [0.1, 0.2, 0.3, 0.4]
			},
			4
		);
		expect(beats).toEqual([0.1, 0.2, 0.3, 0.4]);
	});

	test('1/4 beat preset → 0.25 total beats, equal weights', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '1/4 beat' }, 4)).toEqual([
			0.0625, 0.0625, 0.0625, 0.0625
		]);
	});

	test('1/2 beat preset → 0.5 total beats', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '1/2 beat' }, 2)).toEqual([0.25, 0.25]);
	});

	test('1 beat preset → 1 total beat', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '1 beat' }, 4)).toEqual([0.25, 0.25, 0.25, 0.25]);
	});

	test('2 beats preset → 2 total beats', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '2 beats' }, 4)).toEqual([0.5, 0.5, 0.5, 0.5]);
	});

	test('1 bar preset @ beatsPerBar 4 → 4 total beats', () => {
		expect(
			expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 }, 8)
		).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
	});

	test('2 bars preset @ beatsPerBar 4 → 8 total beats', () => {
		expect(
			expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '2 bars', beatsPerBar: 4 }, 4)
		).toEqual([2, 2, 2, 2]);
	});

	test('4 bars preset @ beatsPerBar 4 → 16 total beats', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '4 bars' }, 4)).toEqual([4, 4, 4, 4]);
	});

	test('8 bars preset @ beatsPerBar 4 → 32 total beats', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '8 bars' }, 8)).toEqual([
			4, 4, 4, 4, 4, 4, 4, 4
		]);
	});

	test('odd meter: 1 bar @ beatsPerBar 3 → 3 total beats', () => {
		expect(
			expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 3 }, 3)
		).toEqual([1, 1, 1]);
	});

	test('odd meter: 2 bars @ beatsPerBar 5 → 10 total beats', () => {
		expect(
			expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '2 bars', beatsPerBar: 5 }, 5)
		).toEqual([2, 2, 2, 2, 2]);
	});

	test('odd meter: 1 bar @ beatsPerBar 7 → 7 total beats', () => {
		expect(
			expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 7 }, 7)
		).toEqual([1, 1, 1, 1, 1, 1, 1]);
	});

	test('custom syncBeats → exact total beats', () => {
		expect(
			expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: 'custom', syncBeats: 6 }, 4)
		).toEqual([1.5, 1.5, 1.5, 1.5]);
	});

	test('weighted frames: one frame double weight, rest shrink, sum stays totalBeats', () => {
		const beats = expandSyncToFrameDurationBeats(
			{
				sync: 'beat',
				syncLength: '1 bar',
				beatsPerBar: 4,
				frameRatesForFrames: { 0: 5 }
			},
			4
		);
		expect(beats).toHaveLength(4);
		expect(beats[0]).toBeCloseTo(0.25, 10);
		expect(beats[1]).toBeCloseTo(1.25, 10);
		expect(beats[2]).toBeCloseTo(1.25, 10);
		expect(beats[3]).toBeCloseTo(1.25, 10);
		expect(beats.reduce((sum, value) => sum + value, 0)).toBeCloseTo(4, 10);
	});

	test('invalid syncLength returns null', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: 'bogus' }, 4)).toBeNull();
	});

	test('custom without syncBeats returns null', () => {
		expect(expandSyncToFrameDurationBeats({ sync: 'beat', syncLength: 'custom' }, 4)).toBeNull();
	});

	test('frameDurationBeatsToPreviewMs uses preview BPM', () => {
		expect(PREVIEW_SYNC_BPM).toBe(120);
		expect(frameDurationBeatsToPreviewMs([1, 0.5], 120)).toEqual([500, 250]);
	});
});
