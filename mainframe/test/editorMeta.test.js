import { describe, test, expect } from 'vitest';
import { editorValuesFromMeta, metaPatchFromEditor, optionalMetaFromEditor, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE, DEFAULT_SCALING } from '../src/js/editorMeta.js';

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
				bitDepth: 4
			})
		).toEqual({
			name: 'Neon',
			role: 'bitmask',
			playback: 'once',
			frameWidth: 16,
			frameHeight: 9,
			scaleMode: 'cover',
			scaling: DEFAULT_SCALING,
			placement: { x: 0, y: 0 },
			frameRate: 8,
			retrigger: false,
			triggerType: 'latch',
			triggerGroup: 'masks',
			bitDepth: 4,
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
			scaling: DEFAULT_SCALING,
			placement: { x: 0, y: 0 },
			frameRate: 12,
			retrigger: true,
			triggerType: 'momentary',
			triggerGroup: '',
			bitDepth: 1,
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

	test('hydrates placement and floors fractional pixels', () => {
		expect(
			editorValuesFromMeta({
				placement: { x: 10.7, y: -3.2 }
			}).placement
		).toEqual({ x: 10, y: -4 });
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
				placement: { x: 12, y: -4 },
				frameRatesForFrames: { 0: 12 },
				retrigger: true,
				triggerType: 'momentary',
				triggerGroup: '',
				bitDepth: 2,
				sync: 'free'
			})
		).toEqual({
			name: 'Show',
			role: 'bitmask',
			playback: 'loop',
			scaleMode: 'fit',
			frameWidth: 240,
			frameHeight: 135,
			placement: { x: 12, y: -4 },
			frameRatesForFrames: { 0: 12 },
			retrigger: true,
			triggerType: 'momentary',
			triggerGroup: null,
			bitDepth: 2,
			sync: 'free',
			syncLength: null,
			syncBeats: null,
			beatsPerBar: null
		});
	});

	test('metaPatchFromEditor beat mode sets sync fields', () => {
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
				sync: 'beat',
				syncLength: '1 bar',
				beatsPerBar: 4
			})
		).toMatchObject({
			sync: 'beat',
			syncLength: '1 bar',
			beatsPerBar: 4,
			syncBeats: null
		});
	});

	test('metaPatchFromEditor preserves scaling when provided', () => {
		expect(
			metaPatchFromEditor({
				playback: 'loop',
				scaleMode: 'fit',
				scaling: 'smooth',
				frameWidth: 240,
				frameHeight: 135,
				placement: { x: 0, y: 0 },
				retrigger: true,
				triggerType: 'momentary',
				triggerGroup: '',
				sync: 'free'
			})
		).toMatchObject({ scaling: 'smooth' });
	});

	test('optionalMetaFromEditor includes sync flag and bitmask depth', () => {
		expect(
			optionalMetaFromEditor({
				retrigger: false,
				triggerType: 'one-shot',
				triggerGroup: 'g1',
				role: 'bitmask',
				bitDepth: 8,
				sync: 'free'
			})
		).toEqual({
			syncOptionalMeta: true,
			retrigger: false,
			triggerType: 'one-shot',
			triggerGroup: 'g1',
			role: 'bitmask',
			bitDepth: 8,
			placement: { x: 0, y: 0 },
			sync: 'free',
			syncLength: null,
			syncBeats: null,
			beatsPerBar: null
		});
	});
});
