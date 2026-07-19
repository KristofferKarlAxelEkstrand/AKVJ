import { describe, test, expect } from 'vitest';
import { resolveSyncBeats } from '../src/js/syncTiming.js';

/**
 * Parity suite vs akvj/test/clipMetadata.test.js (sync resolution cases).
 * Mirrors akvj's resolveSyncBeats function — returns total beats as a single number.
 */
describe('syncTiming (mainframe mirror of akvj clipMetadata resolveSyncBeats)', () => {
	test('sync: "free" (or absent) returns null', () => {
		expect(resolveSyncBeats({ sync: 'free' })).toBeNull();
		expect(resolveSyncBeats({})).toBeNull();
	});

	test('1/4 beat preset → 0.25 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '1/4 beat' })).toBe(0.25);
	});

	test('1/2 beat preset → 0.5 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '1/2 beat' })).toBe(0.5);
	});

	test('1 beat preset → 1 total beat', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '1 beat' })).toBe(1);
	});

	test('2 beats preset → 2 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '2 beats' })).toBe(2);
	});

	test('1 bar preset @ beatsPerBar 4 → 4 total beats (spec sanity check)', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 })).toBe(4);
	});

	test('2 bars preset @ beatsPerBar 4 → 8 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '2 bars', beatsPerBar: 4 })).toBe(8);
	});

	test('4 bars preset @ default beatsPerBar → 16 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '4 bars' })).toBe(16);
	});

	test('8 bars preset @ default beatsPerBar → 32 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '8 bars' })).toBe(32);
	});

	test('odd meter: 1 bar @ beatsPerBar 3 → 3 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 3 })).toBe(3);
	});

	test('odd meter: 2 bars @ beatsPerBar 5 → 10 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '2 bars', beatsPerBar: 5 })).toBe(10);
	});

	test('odd meter: 1 bar @ beatsPerBar 7 → 7 total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: '1 bar', beatsPerBar: 7 })).toBe(7);
	});

	test('custom syncBeats → exact total beats', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: 'custom', syncBeats: 6 })).toBe(6);
	});

	test('invalid syncLength returns null', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: 'bogus' })).toBeNull();
	});

	test('custom without syncBeats returns null', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: 'custom' })).toBeNull();
	});

	test('custom with a non-positive syncBeats returns null', () => {
		expect(resolveSyncBeats({ sync: 'beat', syncLength: 'custom', syncBeats: 0 })).toBeNull();
		expect(resolveSyncBeats({ sync: 'beat', syncLength: 'custom', syncBeats: -1 })).toBeNull();
	});

	test('does not mutate input object', () => {
		const raw = { sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 };
		const snapshot = JSON.parse(JSON.stringify(raw));
		resolveSyncBeats(raw);
		expect(raw).toEqual(snapshot);
	});
});
