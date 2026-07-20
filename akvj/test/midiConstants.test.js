import { describe, test, expect } from 'vitest';
import { MAX_MIDI_DATA_BYTE, MAX_MIDI_VELOCITY, MAX_MIDI_NOTE } from '../src/js/core/midiConstants.js';

describe('midiConstants', () => {
	test('constants match expected MIDI protocol limits', () => {
		expect(MAX_MIDI_DATA_BYTE).toBe(127);
		expect(MAX_MIDI_VELOCITY).toBe(127);
		expect(MAX_MIDI_VELOCITY).toBe(MAX_MIDI_DATA_BYTE);
		expect(MAX_MIDI_NOTE).toBe(127);
	});
});
