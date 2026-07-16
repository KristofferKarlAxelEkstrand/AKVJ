import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformDefaultDrumNoteMapProfile } from '../../lib/transformers/defaultDrumNoteMapProfileTransformer.js';

describe('Default Drum Note Map Profile Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-125-um-default-drum-note-map-profile.md');
		result = await transformDefaultDrumNoteMapProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Default Drum Note Map Profile');
		expect(result.metadata.doc_id).toBe('M2-125-UM');
		expect(result.metadata.version).toBe('1.0');
		expect(result.metadata.source).toBe('m2-125-um-default-drum-note-map-profile.md');
	});

	describe('Profile ID bytes', () => {
		it('should have 5 bytes', () => {
			expect(result.profile_id).toHaveLength(5);
			expect(result.summary.profile_id_byte_count).toBe(5);
		});

		it('should parse byte 1 as 0X7E Standard Defined Profile', () => {
			const byte = result.profile_id.find(b => b.byte_number === 1);
			expect(byte.value).toBe('0X7E');
			expect(byte.description).toBe('Standard Defined Profile');
		});

		it('should parse byte 2 as 0X20 Drum Note Map Profile Number MSB', () => {
			const byte = result.profile_id.find(b => b.byte_number === 2);
			expect(byte.value).toBe('0X20');
			expect(byte.description).toBe('Drum Note Map Profile Number MSB');
		});

		it('should parse byte 3 as 0X03 Drum Note Map Profile Number LSB', () => {
			const byte = result.profile_id.find(b => b.byte_number === 3);
			expect(byte.value).toBe('0X03');
			expect(byte.description).toBe('Drum Note Map Profile Number LSB');
		});

		it('should parse byte 4 as 0X01 Drum Note Map Profile Version', () => {
			const byte = result.profile_id.find(b => b.byte_number === 4);
			expect(byte.value).toBe('0X01');
			expect(byte.description).toBe('Drum Note Map Profile Version');
		});

		it('should parse byte 5 as 0XXX Drum Note Map Profile Level', () => {
			const byte = result.profile_id.find(b => b.byte_number === 5);
			expect(byte.value).toBe('0XXX');
			expect(byte.description).toBe('Drum Note Map Profile Level');
		});
	});

	describe('Profile Levels', () => {
		it('should have 4 levels', () => {
			expect(result.profile_levels).toHaveLength(4);
			expect(result.summary.profile_level_count).toBe(4);
		});

		it('should parse 0X00 as non-compliant', () => {
			const level = result.profile_levels.find(l => l.value === '0X00');
			expect(level.description).toContain('does not comply');
		});

		it('should parse 0X01 as minimum requirements', () => {
			const level = result.profile_levels.find(l => l.value === '0X01');
			expect(level.description).toContain('minimum requirements');
		});

		it('should parse 0X02-0X7E as Reserved', () => {
			const level = result.profile_levels.find(l => l.value === '0X02-0X7E');
			expect(level.description).toBe('Reserved');
		});

		it('should parse 0X7F as highest level', () => {
			const level = result.profile_levels.find(l => l.value === '0X7F');
			expect(level.description).toContain('Highest level');
		});
	});

	describe('Drum Note Map', () => {
		it('should have 62 entries (notes 27-88)', () => {
			expect(result.drum_note_map).toHaveLength(62);
			expect(result.summary.drum_note_count).toBe(62);
		});

		it('should parse note 27 as High Q', () => {
			const entry = result.drum_note_map.find(d => d.note_decimal === 27);
			expect(entry.note_hex).toBe('0X1B');
			expect(entry.name).toBe('High Q');
			expect(entry.mes).toBeNull();
			expect(entry.pan_position).toBe('Left 23%');
			expect(entry.bitmap_byte).toBe(2);
			expect(entry.bitmap_bit).toBe(0);
		});

		it('should parse note 29 as Scratch Push with MES 7', () => {
			const entry = result.drum_note_map.find(d => d.note_decimal === 29);
			expect(entry.note_hex).toBe('0X1D');
			expect(entry.name).toBe('Scratch Push');
			expect(entry.mes).toBe(7);
			expect(entry.pan_position).toBe('Left 16%');
			expect(entry.bitmap_byte).toBe(2);
			expect(entry.bitmap_bit).toBe(2);
		});

		it('should parse note 36 as Bass Drum 1', () => {
			const entry = result.drum_note_map.find(d => d.note_decimal === 36);
			expect(entry.note_hex).toBe('0X24');
			expect(entry.name).toBe('Bass Drum 1');
			expect(entry.mes).toBeNull();
			expect(entry.pan_position).toBe('Center');
			expect(entry.bitmap_byte).toBe(3);
			expect(entry.bitmap_bit).toBe(2);
		});

		it('should parse note 42 as Closed Hi-hat with MES 1', () => {
			const entry = result.drum_note_map.find(d => d.note_decimal === 42);
			expect(entry.note_hex).toBe('0X2A');
			expect(entry.name).toBe('Closed Hi-hat');
			expect(entry.mes).toBe(1);
			expect(entry.pan_position).toBe('Right 32%');
		});

		it('should parse note 88 as Applause', () => {
			const entry = result.drum_note_map.find(d => d.note_decimal === 88);
			expect(entry.note_hex).toBe('0X58');
			expect(entry.name).toBe('Applause');
			expect(entry.mes).toBeNull();
			expect(entry.pan_position).toBe('Center');
			expect(entry.bitmap_byte).toBe(10);
			expect(entry.bitmap_bit).toBe(5);
		});

		it('should have all entries with valid hex', () => {
			for (const entry of result.drum_note_map) {
				expect(entry.note_hex).toMatch(/^0X[0-9A-F]{2}$/);
			}
		});

		it('should have all notes from 27 to 88', () => {
			for (let i = 27; i <= 88; i++) {
				const entry = result.drum_note_map.find(d => d.note_decimal === i);
				expect(entry).toBeDefined();
			}
		});
	});

	describe('MES Definitions', () => {
		it('should have 7 definitions', () => {
			expect(result.mes_definitions).toHaveLength(7);
			expect(result.summary.mes_definition_count).toBe(7);
		});

		it('should parse MES 1 with Closed HH, Pedal HH, Open HH', () => {
			const mes = result.mes_definitions.find(m => m.set_number === 1);
			expect(mes.description).toContain('Closed HH (42)');
			expect(mes.description).toContain('Pedal HH (44)');
			expect(mes.description).toContain('Open HH (46)');
		});

		it('should parse MES 7 with Scratch Push and Pull', () => {
			const mes = result.mes_definitions.find(m => m.set_number === 7);
			expect(mes.description).toContain('Scratch Push (29)');
			expect(mes.description).toContain('Scratch Pull (30)');
		});
	});

	describe('Volume Curve CC#7', () => {
		it('should have 6 entries', () => {
			expect(result.volume_curve_cc7).toHaveLength(6);
			expect(result.summary.volume_curve_cc7_count).toBe(6);
		});

		it('should parse 0XFFFFFFFF as 0 dB', () => {
			const entry = result.volume_curve_cc7.find(v => v.value === '0XFFFFFFFF');
			expect(entry.amplitude).toBe('0 dB');
		});

		it('should parse 0X00000000 as -infinity', () => {
			const entry = result.volume_curve_cc7.find(v => v.value === '0X00000000');
			expect(entry.amplitude).toContain('infinity');
		});

		it('should parse 0XC1041041 as -4.9 dB', () => {
			const entry = result.volume_curve_cc7.find(v => v.value === '0XC1041041');
			expect(entry.amplitude).toBe('-4.9 dB');
		});
	});

	describe('Volume Curve RPNC#7', () => {
		it('should have 6 entries', () => {
			expect(result.volume_curve_rpnc7).toHaveLength(6);
			expect(result.summary.volume_curve_rpnc7_count).toBe(6);
		});

		it('should parse 0XFFFFFFFF as 0 dB', () => {
			const entry = result.volume_curve_rpnc7.find(v => v.value === '0XFFFFFFFF');
			expect(entry.amplitude).toBe('0 dB');
		});

		it('should parse 0X00000000 as -infinity', () => {
			const entry = result.volume_curve_rpnc7.find(v => v.value === '0X00000000');
			expect(entry.amplitude).toContain('infinity');
		});
	});

	describe('Key-Based Instrument Controllers', () => {
		it('should have 8 entries', () => {
			expect(result.key_based_controllers).toHaveLength(8);
			expect(result.summary.key_based_controller_count).toBe(8);
		});

		it('should parse controller 7 as Volume', () => {
			const ctrl = result.key_based_controllers.find(c => c.controller_number === 7);
			expect(ctrl.name).toBe('Volume');
			expect(ctrl.equivalent_rpnc).toBe('6.1.1');
		});

		it('should parse controller 10 as Pan', () => {
			const ctrl = result.key_based_controllers.find(c => c.controller_number === 10);
			expect(ctrl.name).toBe('Pan');
		});

		it('should parse controller 71 as Timbre/Harmonic Intensity', () => {
			const ctrl = result.key_based_controllers.find(c => c.controller_number === 71);
			expect(ctrl.name).toContain('Timbre/Harmonic Intensity');
			expect(ctrl.name).toContain('Sound Controller 2');
		});

		it('should parse controller 91 as Reverb Send Level', () => {
			const ctrl = result.key_based_controllers.find(c => c.controller_number === 91);
			expect(ctrl.name).toContain('Reverb Send Level');
			expect(ctrl.name).toContain('Effects 1 Depth');
		});
	});

	describe('SysEx Inquiry Message', () => {
		it('should have 11 entries', () => {
			expect(result.sysex_inquiry_message).toHaveLength(11);
			expect(result.summary.sysex_inquiry_message_count).toBe(11);
		});

		it('should start with F0 System Exclusive Start', () => {
			expect(result.sysex_inquiry_message[0].value).toBe('F0');
			expect(result.sysex_inquiry_message[0].parameter).toBe('System Exclusive Start');
		});

		it('should end with F7 End Universal System Exclusive', () => {
			const last = result.sysex_inquiry_message[10];
			expect(last.value).toBe('F7');
			expect(last.parameter).toContain('End');
		});

		it('should contain 0D as MIDI-CI Sub-ID#1', () => {
			const entry = result.sysex_inquiry_message.find(s => s.value === '0D');
			expect(entry).toBeDefined();
			expect(entry.parameter).toContain('MIDI-CI');
		});

		it('should contain 28 as Profile Details Inquiry', () => {
			const entry = result.sysex_inquiry_message.find(s => s.value === '28');
			expect(entry).toBeDefined();
			expect(entry.parameter).toContain('Profile Details Inquiry');
		});
	});

	describe('SysEx Reply Message', () => {
		it('should have 13 entries', () => {
			expect(result.sysex_reply_message).toHaveLength(13);
			expect(result.summary.sysex_reply_message_count).toBe(13);
		});

		it('should start with F0 System Exclusive Start', () => {
			expect(result.sysex_reply_message[0].value).toBe('F0');
		});

		it('should end with F7 End Universal System Exclusive', () => {
			const last = result.sysex_reply_message[12];
			expect(last.value).toBe('F7');
		});

		it('should contain 29 as Reply to Profile Details Inquiry', () => {
			const entry = result.sysex_reply_message.find(s => s.value === '29');
			expect(entry).toBeDefined();
			expect(entry.parameter).toContain('Reply to Profile Details Inquiry');
		});

		it('should contain 14 00 as Inquiry Target Data Length', () => {
			const entry = result.sysex_reply_message.find(s => s.value === '14 00');
			expect(entry).toBeDefined();
			expect(entry.parameter).toContain('Inquiry Target Data Length');
		});
	});

	describe('Profile Features Supported', () => {
		it('should have 10 bytes', () => {
			expect(result.profile_features).toHaveLength(10);
			expect(result.summary.profile_feature_byte_count).toBe(10);
		});

		it('should parse Byte 1 with 3 bit entries', () => {
			const byte1 = result.profile_features.find(f => f.byte_number === 1);
			expect(byte1.bits).toHaveLength(3);
		});

		it('should parse Byte 1 D0 as MIDI 2.0 Per-Note Controllers', () => {
			const byte1 = result.profile_features.find(f => f.byte_number === 1);
			const d0 = byte1.bits.find(b => b.bit_number === 0);
			expect(d0.description).toContain('MIDI 2.0 Per-Note Controllers');
		});

		it('should parse Byte 1 D1 as MIDI 1.0 Key-Based Instrument Controllers', () => {
			const byte1 = result.profile_features.find(f => f.byte_number === 1);
			const d1 = byte1.bits.find(b => b.bit_number === 1);
			expect(d1.description).toContain('MIDI 1.0 Key-Based Instrument Controllers');
			expect(d1.description).toContain('Universal SysEx');
		});

		it('should parse Byte 1 D2-D6 as Reserved', () => {
			const byte1 = result.profile_features.find(f => f.byte_number === 1);
			const reserved = byte1.bits.find(b => b.bit_range === '2-6');
			expect(reserved).toBeDefined();
			expect(reserved.description).toBe('Reserved');
		});

		it('should parse Byte 2 with 7 bit entries (D0-D6)', () => {
			const byte2 = result.profile_features.find(f => f.byte_number === 2);
			expect(byte2.bits).toHaveLength(7);
			expect(byte2.bits[0].description).toContain('Note Number 27');
			expect(byte2.bits[6].description).toContain('Note Number 33');
		});

		it('should parse Byte 10 D6 as Reserved', () => {
			const byte10 = result.profile_features.find(f => f.byte_number === 10);
			const d6 = byte10.bits.find(b => b.bit_number === 6);
			expect(d6.description).toBe('Reserved');
		});
	});

	describe('Version History', () => {
		it('should have 1 entry', () => {
			expect(result.version_history).toHaveLength(1);
			expect(result.summary.version_history_count).toBe(1);
		});

		it('should parse 2025-01-31 v1.0 Initial release', () => {
			const entry = result.version_history[0];
			expect(entry.date).toBe('2025-01-31');
			expect(entry.version).toBe('1.0');
			expect(entry.changes).toBe('Initial release');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.profile_id_byte_count).toBe(5);
			expect(result.summary.profile_level_count).toBe(4);
			expect(result.summary.drum_note_count).toBe(62);
			expect(result.summary.mes_definition_count).toBe(7);
			expect(result.summary.volume_curve_cc7_count).toBe(6);
			expect(result.summary.volume_curve_rpnc7_count).toBe(6);
			expect(result.summary.key_based_controller_count).toBe(8);
			expect(result.summary.sysex_inquiry_message_count).toBe(11);
			expect(result.summary.sysex_reply_message_count).toBe(13);
			expect(result.summary.profile_feature_byte_count).toBe(10);
			expect(result.summary.version_history_count).toBe(1);
		});
	});
});
