import { describe, test, expect } from 'vitest';
import {
	editorValuesFromMeta,
	metaPatchFromEditor,
	optionalMetaFromEditor,
	parseFrameDurationBeats,
	DEFAULT_FRAME_WIDTH,
	DEFAULT_FRAME_HEIGHT,
	DEFAULT_SCALE_MODE
} from '../src/js/editorMeta.js';

describe('editorMeta', () => {
	test('hydrates editor fields from meta including optional fields', () => {
		expect(
			editorValuesFromMeta({
				name: 'Neon',
				role: 'bitmask',
				playback: 'once',
				frameWidth: 16,
				frameHeight: 9,
				scaleMode: 'cover',
				frameRatesForFrames: { 0: 8, 1: 4 },
				retrigger: false,
				triggerType: 'latch',
				triggerGroup: 'masks',
				bitDepth: 4,
				frameDurationBeats: [0.25, 0.5]
			})
		).toEqual({
			name: 'Neon',
			role: 'bitmask',
			playback: 'once',
			frameWidth: 16,
			frameHeight: 9,
			scaleMode: 'cover',
			frameRate: 8,
			retrigger: false,
			triggerType: 'latch',
			triggerGroup: 'masks',
			bitDepth: 4,
			frameDurationBeatsText: '[0.25,0.5]',
			sync: 'free',
			syncLength: '1 bar',
			syncBeats: null,
			beatsPerBar: 4
		});
	});

	test('applies legacy defaults when dimensions/scale are missing', () => {
		expect(editorValuesFromMeta({})).toEqual({
			name: '',
			role: '',
			playback: 'loop',
			frameWidth: DEFAULT_FRAME_WIDTH,
			frameHeight: DEFAULT_FRAME_HEIGHT,
			scaleMode: DEFAULT_SCALE_MODE,
			frameRate: 12,
			retrigger: true,
			triggerType: 'momentary',
			triggerGroup: '',
			bitDepth: 1,
			frameDurationBeatsText: '',
			sync: 'free',
			syncLength: '1 bar',
			syncBeats: null,
			beatsPerBar: 4
		});
	});

	test('hydrates beat sync fields from meta', () => {
		expect(
			editorValuesFromMeta({
				sync: 'beat',
				syncLength: 'custom',
				syncBeats: 6,
				beatsPerBar: 3
			})
		).toMatchObject({
			sync: 'beat',
			syncLength: 'custom',
			syncBeats: 6,
			beatsPerBar: 3
		});
	});

	test('metaPatchFromEditor stamps dimensions and clears unused optionals with null', () => {
		expect(
			metaPatchFromEditor({
				name: 'Show',
				role: 'bitmask',
				playback: 'loop',
				scaleMode: 'fit',
				frameWidth: 240,
				frameHeight: 135,
				frameRatesForFrames: { 0: 12 },
				retrigger: true,
				triggerType: 'momentary',
				triggerGroup: '',
				bitDepth: 2,
				frameDurationBeats: 0.25,
				sync: 'free'
			})
		).toEqual({
			name: 'Show',
			role: 'bitmask',
			playback: 'loop',
			scaleMode: 'fit',
			frameWidth: 240,
			frameHeight: 135,
			frameRatesForFrames: { 0: 12 },
			retrigger: true,
			triggerType: 'momentary',
			triggerGroup: null,
			bitDepth: 2,
			frameDurationBeats: 0.25,
			sync: 'free',
			syncLength: null,
			syncBeats: null,
			beatsPerBar: null
		});
	});

	test('metaPatchFromEditor beat mode clears explicit frameDurationBeats', () => {
		expect(
			metaPatchFromEditor({
				name: '',
				role: '',
				playback: 'loop',
				scaleMode: 'fit',
				frameWidth: 240,
				frameHeight: 135,
				retrigger: true,
				triggerType: 'momentary',
				triggerGroup: '',
				frameDurationBeats: [0.25],
				sync: 'beat',
				syncLength: '1 bar',
				beatsPerBar: 4
			})
		).toMatchObject({
			sync: 'beat',
			syncLength: '1 bar',
			beatsPerBar: 4,
			frameDurationBeats: null,
			syncBeats: null
		});
	});

	test('parseFrameDurationBeats accepts number, array, or empty', () => {
		expect(parseFrameDurationBeats('')).toEqual({ ok: true, value: null });
		expect(parseFrameDurationBeats('0.25')).toEqual({ ok: true, value: 0.25 });
		expect(parseFrameDurationBeats('[0.25, 0.5]')).toEqual({ ok: true, value: [0.25, 0.5] });
		expect(parseFrameDurationBeats('nope').ok).toBe(false);
	});

	test('optionalMetaFromEditor includes sync flag and bitmask depth', () => {
		expect(
			optionalMetaFromEditor({
				retrigger: false,
				triggerType: 'one-shot',
				triggerGroup: 'g1',
				role: 'bitmask',
				bitDepth: 8,
				frameDurationBeats: [0.5],
				sync: 'free'
			})
		).toEqual({
			syncOptionalMeta: true,
			retrigger: false,
			triggerType: 'one-shot',
			triggerGroup: 'g1',
			role: 'bitmask',
			bitDepth: 8,
			frameDurationBeats: [0.5],
			sync: 'free',
			syncLength: null,
			syncBeats: null,
			beatsPerBar: null
		});
	});
});
