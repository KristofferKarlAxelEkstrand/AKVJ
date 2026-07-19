import { describe, test, expect } from 'vitest';
import { normalizeClipMetadata, PLAYBACK_MODES, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE, DEFAULT_PLAYBACK, DEFAULT_TRIGGER_TYPE } from '../src/js/visuals/clipMetadata.js';

describe('normalizeClipMetadata', () => {
	test('returns empty object for null/undefined input', () => {
		expect(normalizeClipMetadata(null)).toEqual({});
		expect(normalizeClipMetadata(undefined)).toEqual({});
	});

	test('returns empty object for non-object input', () => {
		expect(normalizeClipMetadata('string')).toEqual({});
		expect(normalizeClipMetadata(42)).toEqual({});
		expect(normalizeClipMetadata([])).toEqual({});
	});

	test('normalizes frames from canonical field', () => {
		const result = normalizeClipMetadata({ frames: 10, framesPerRow: 4 });
		expect(result.frames).toBe(10);
	});

	test('normalizes frames from legacy numberOfFrames', () => {
		const result = normalizeClipMetadata({ numberOfFrames: 8, framesPerRow: 4 });
		expect(result.frames).toBe(8);
	});

	test('frames defaults to null when neither field present', () => {
		const result = normalizeClipMetadata({ framesPerRow: 4 });
		expect(result.frames).toBeNull();
	});

	test('canonical frames takes priority over numberOfFrames', () => {
		const result = normalizeClipMetadata({ frames: 10, numberOfFrames: 20, framesPerRow: 4 });
		expect(result.frames).toBe(10);
	});

	test('normalizes playback from canonical field', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1, playback: 'once' });
		expect(result.playback).toBe('once');
	});

	test('normalizes playback from legacy loop=false', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1, loop: false });
		expect(result.playback).toBe('once');
	});

	test('normalizes playback from legacy loop=true', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1, loop: true });
		expect(result.playback).toBe('loop');
	});

	test('playback defaults to loop when neither field present', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1 });
		expect(result.playback).toBe(DEFAULT_PLAYBACK);
	});

	test('canonical playback takes priority over loop', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1, playback: 'reverse', loop: false });
		expect(result.playback).toBe('reverse');
	});

	test('invalid playback falls back to default', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1, playback: 'invalid' });
		expect(result.playback).toBe(DEFAULT_PLAYBACK);
	});

	test('applies defaults for optional fields', () => {
		const result = normalizeClipMetadata({ frames: 1, framesPerRow: 1 });
		expect(result.png).toBe('sprite.png');
		expect(result.retrigger).toBe(true);
		expect(result.triggerType).toBe(DEFAULT_TRIGGER_TYPE);
		expect(result.triggerGroup).toBeNull();
		expect(result.bitDepth).toBeNull();
		expect(result.scaleMode).toBe(DEFAULT_SCALE_MODE);
		expect(result.frameWidth).toBe(DEFAULT_FRAME_WIDTH);
		expect(result.frameHeight).toBe(DEFAULT_FRAME_HEIGHT);
		expect(result.role).toBeNull();
		expect(result.name).toBeNull();
		expect(result.frameRatesForFrames).toBeNull();
		expect(result.syncBeats).toBeNull();
	});

	test('preserves provided optional fields', () => {
		const meta = {
			frames: 5,
			framesPerRow: 3,
			png: 'custom.png',
			retrigger: false,
			triggerType: 'latch',
			triggerGroup: 'choke-1',
			bitDepth: 4,
			scaleMode: 'cover',
			frameWidth: 120,
			frameHeight: 68,
			role: 'bitmask',
			name: 'My Clip',
			frameRatesForFrames: { 0: 12, 3: 24 },
			sync: 'beat',
			syncLength: 'custom',
			syncBeats: 6
		};
		const result = normalizeClipMetadata(meta);
		expect(result.png).toBe('custom.png');
		expect(result.retrigger).toBe(false);
		expect(result.triggerType).toBe('latch');
		expect(result.triggerGroup).toBe('choke-1');
		expect(result.bitDepth).toBe(4);
		expect(result.scaleMode).toBe('cover');
		expect(result.frameWidth).toBe(120);
		expect(result.frameHeight).toBe(68);
		expect(result.role).toBe('bitmask');
		expect(result.name).toBe('My Clip');
		expect(result.frameRatesForFrames).toEqual({ 0: 12, 3: 24 });
		expect(result.syncBeats).toBe(6);
	});

	test('does not mutate input object', () => {
		const input = { frames: 3, framesPerRow: 2, loop: false };
		normalizeClipMetadata(input);
		expect(input).toEqual({ frames: 3, framesPerRow: 2, loop: false });
		expect(input.playback).toBeUndefined();
	});

	test('PLAYBACK_MODES contains all expected modes', () => {
		expect(PLAYBACK_MODES).toEqual(['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']);
	});

	test('round-trip: normalize → serialize → parse → normalize yields same result', () => {
		const original = {
			frames: 4,
			framesPerRow: 2,
			playback: 'pingpong',
			retrigger: false,
			triggerType: 'one-shot',
			triggerGroup: 'group-a',
			scaleMode: 'cover',
			frameWidth: 240,
			frameHeight: 135,
			png: 'sprite.png',
			frameRatesForFrames: { 0: 15 }
		};
		const normalized1 = normalizeClipMetadata(original);
		const serialized = JSON.stringify(normalized1);
		const reparsed = JSON.parse(serialized);
		const normalized2 = normalizeClipMetadata(reparsed);
		expect(normalized2).toEqual(normalized1);
	});
});

describe('normalizeClipMetadata — sync resolution', () => {
	test('sync: "free" (or absent) leaves syncBeats null', () => {
		const normalized = normalizeClipMetadata({ frames: 4, framesPerRow: 4, sync: 'free' });
		expect(normalized.syncBeats).toBeNull();

		const omitted = normalizeClipMetadata({ frames: 4, framesPerRow: 4 });
		expect(omitted.syncBeats).toBeNull();
	});

	test('frameDurationBeats is never read or produced by this module', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: '1 bar',
			frameDurationBeats: [0.1, 0.2, 0.3, 0.4]
		});
		expect(normalized.frameDurationBeats).toBeUndefined();
		expect('frameDurationBeats' in normalized).toBe(false);
		expect(normalized.syncBeats).toBe(4);
	});

	test('1/4 beat preset → 0.25 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: '1/4 beat'
		});
		expect(normalized.syncBeats).toBe(0.25);
	});

	test('1/2 beat preset → 0.5 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 2,
			framesPerRow: 2,
			sync: 'beat',
			syncLength: '1/2 beat'
		});
		expect(normalized.syncBeats).toBe(0.5);
	});

	test('1 beat preset → 1 total beat', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: '1 beat'
		});
		expect(normalized.syncBeats).toBe(1);
	});

	test('2 beats preset → 2 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: '2 beats'
		});
		expect(normalized.syncBeats).toBe(2);
	});

	test('1 bar preset @ beatsPerBar 4 → 4 total beats (spec sanity check)', () => {
		const normalized = normalizeClipMetadata({
			frames: 8,
			framesPerRow: 8,
			sync: 'beat',
			syncLength: '1 bar',
			beatsPerBar: 4
		});
		expect(normalized.syncBeats).toBe(4);
	});

	test('2 bars preset @ beatsPerBar 4 → 8 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: '2 bars',
			beatsPerBar: 4
		});
		expect(normalized.syncBeats).toBe(8);
	});

	test('4 bars preset @ default beatsPerBar → 16 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: '4 bars'
		});
		expect(normalized.syncBeats).toBe(16);
	});

	test('8 bars preset @ default beatsPerBar → 32 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 8,
			framesPerRow: 8,
			sync: 'beat',
			syncLength: '8 bars'
		});
		expect(normalized.syncBeats).toBe(32);
	});

	test('odd meter: 1 bar @ beatsPerBar 3 → 3 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 3,
			framesPerRow: 3,
			sync: 'beat',
			syncLength: '1 bar',
			beatsPerBar: 3
		});
		expect(normalized.syncBeats).toBe(3);
	});

	test('odd meter: 2 bars @ beatsPerBar 5 → 10 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 5,
			framesPerRow: 5,
			sync: 'beat',
			syncLength: '2 bars',
			beatsPerBar: 5
		});
		expect(normalized.syncBeats).toBe(10);
	});

	test('odd meter: 1 bar @ beatsPerBar 7 → 7 total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 7,
			framesPerRow: 7,
			sync: 'beat',
			syncLength: '1 bar',
			beatsPerBar: 7
		});
		expect(normalized.syncBeats).toBe(7);
	});

	test('custom syncBeats → exact total beats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: 'custom',
			syncBeats: 6
		});
		expect(normalized.syncBeats).toBe(6);
	});

	test('invalid syncLength returns null syncBeats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: 'bogus'
		});
		expect(normalized.syncBeats).toBeNull();
	});

	test('custom without syncBeats returns null syncBeats', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: 'custom'
		});
		expect(normalized.syncBeats).toBeNull();
	});

	test('custom with a non-positive syncBeats returns null', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			sync: 'beat',
			syncLength: 'custom',
			syncBeats: 0
		});
		expect(normalized.syncBeats).toBeNull();
	});

	test('does not mutate input object', () => {
		const raw = { frames: 4, framesPerRow: 4, sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 };
		const snapshot = JSON.parse(JSON.stringify(raw));
		normalizeClipMetadata(raw);
		expect(raw).toEqual(snapshot);
	});
});

describe('normalizeClipMetadata — frameDurationsMs conversion', () => {
	test('frameDurationsMs converts to frameRatesForFrames (FPS = 1000 / durationMs)', () => {
		const normalized = normalizeClipMetadata({
			frames: 4,
			framesPerRow: 4,
			frameDurationsMs: { 0: 50, 1: 100, 2: 33.33, 3: 25 }
		});
		expect(normalized.frameRatesForFrames[0]).toBe(20); // 1000 / 50
		expect(normalized.frameRatesForFrames[1]).toBe(10); // 1000 / 100
		expect(normalized.frameRatesForFrames[2]).toBeCloseTo(30.003, 3); // 1000 / 33.33 (approximate due to floating-point)
		expect(normalized.frameRatesForFrames[3]).toBe(40); // 1000 / 25
	});

	test('frameDurationsMs with single frame converts correctly', () => {
		const normalized = normalizeClipMetadata({
			frames: 1,
			framesPerRow: 1,
			frameDurationsMs: { 0: 16.67 }
		});
		expect(normalized.frameRatesForFrames[0]).toBeCloseTo(60, 1); // 1000 / 16.67 ≈ 60
	});

	test('frameRatesForFrames takes priority over frameDurationsMs', () => {
		const normalized = normalizeClipMetadata({
			frames: 2,
			framesPerRow: 2,
			frameRatesForFrames: { 0: 30, 1: 60 },
			frameDurationsMs: { 0: 100, 1: 50 }
		});
		expect(normalized.frameRatesForFrames).toEqual({ 0: 30, 1: 60 });
	});

	test('backward compatibility: frameRatesForFrames-only clips work unchanged', () => {
		const normalized = normalizeClipMetadata({
			frames: 3,
			framesPerRow: 3,
			frameRatesForFrames: { 0: 12, 1: 24, 2: 30 }
		});
		expect(normalized.frameRatesForFrames).toEqual({ 0: 12, 1: 24, 2: 30 });
	});

	test('invalid frameDurationsMs (zero or negative) are skipped', () => {
		const normalized = normalizeClipMetadata({
			frames: 3,
			framesPerRow: 3,
			frameDurationsMs: { 0: 50, 1: 0, 2: -10 }
		});
		expect(normalized.frameRatesForFrames).toEqual({ 0: 20 });
	});

	test('empty frameDurationsMs results in null frameRatesForFrames', () => {
		const normalized = normalizeClipMetadata({
			frames: 2,
			framesPerRow: 2,
			frameDurationsMs: {}
		});
		expect(normalized.frameRatesForFrames).toBeNull();
	});

	test('missing both frameRatesForFrames and frameDurationsMs results in null', () => {
		const normalized = normalizeClipMetadata({
			frames: 2,
			framesPerRow: 2
		});
		expect(normalized.frameRatesForFrames).toBeNull();
	});

	test('non-object frameDurationsMs is ignored', () => {
		const normalized = normalizeClipMetadata({
			frames: 2,
			framesPerRow: 2,
			frameDurationsMs: 'invalid'
		});
		expect(normalized.frameRatesForFrames).toBeNull();
	});
});
