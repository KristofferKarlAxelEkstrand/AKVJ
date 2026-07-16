import { describe, expect, test } from 'vitest';
import { detectProtocol, parseDocId, parseVersion } from '../lib/protocol.js';

describe('detectProtocol', () => {
	test('explicit tag overrides heuristics', () => {
		expect(detectProtocol('M2-104-UM_UMP_Specification.pdf', 'midi1')).toBe('midi1');
	});

	test('invalid explicit tag falls back to heuristics', () => {
		expect(detectProtocol('M2-104-UM_UMP_Specification.pdf', 'bogus')).toBe('midi2');
	});

	test('web midi documents', () => {
		expect(detectProtocol('Web MIDI API (W3C Editor Draft)')).toBe('web-midi');
		expect(detectProtocol('web-midi-api-mdn')).toBe('web-midi');
	});

	test('midi 2.0 documents', () => {
		expect(detectProtocol('M2-101-UM_v1-2_MIDI-CI_Specification.pdf')).toBe('midi2');
		expect(detectProtocol('Universal MIDI Packet Format')).toBe('midi2');
		expect(detectProtocol('Common Rules for MIDI-CI Property Exchange')).toBe('midi2');
	});

	test('midi 1.0 documents', () => {
		expect(detectProtocol('M1_v4-2-1_MIDI_1-0_Detailed_Specification_96-1-4.pdf')).toBe('midi1');
		expect(detectProtocol('ca24 Global Parameter Control SysEx Message.pdf')).toBe('midi1');
		expect(detectProtocol('rp17 SMF Lyric Events Definition.pdf')).toBe('midi1');
		expect(detectProtocol('rfc6295-rtp-midi')).toBe('midi1');
	});

	test('General MIDI 2 is a MIDI 1.0-family standard, not midi2', () => {
		expect(detectProtocol('General_MIDI_Level_2_07-2-6_1.2a.pdf General MIDI 2 February 6, 2007')).toBe('midi1');
	});

	test('M2 General MIDI 2 profiles stay midi2 via doc id', () => {
		expect(detectProtocol('M2-118-UM_v1-0-0_General-MIDI-2-Function-Block-Profile.pdf')).toBe('midi2');
	});

	test('unknown documents fall back to general', () => {
		expect(detectProtocol('Specs index page')).toBe('general');
	});
});

describe('parseDocId', () => {
	test('parses M2 and M1 style ids', () => {
		expect(parseDocId('M2-104-UM_v1-1-2_UMP_and_MIDI_2-0_Protocol_Specification.pdf')).toBe('M2-104-UM');
		expect(parseDocId('RP-002-014_v1-1-1_MIDI_Show_Control_Specification_96-1-4.pdf')).toBe('RP-002-014');
	});

	test('normalizes short ca/rp names', () => {
		expect(parseDocId('ca18.pdf')).toBe('CA-018');
		expect(parseDocId('rp15.pdf')).toBe('RP-015');
	});

	test('returns undefined when absent', () => {
		expect(parseDocId('Summary of MIDI Messages.pdf')).toBeUndefined();
	});
});

describe('parseVersion', () => {
	test('parses dashed versions', () => {
		expect(parseVersion('M2-104-UM_v1-1-2_UMP.pdf')).toBe('1.1.2');
		expect(parseVersion('M1_v4-2-1_MIDI_1-0_Detailed_Specification_96-1-4.pdf')).toBe('4.2.1');
	});

	test('returns undefined when absent', () => {
		expect(parseVersion('ca18.pdf')).toBeUndefined();
	});
});
