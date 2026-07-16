import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformDrawbarOrganProfile } from '../../lib/transformers/drawbarOrganProfileTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Drawbar Organ Profile (M2-121-UM) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-121-um-drawbar-organ-profile.md');
		result = await transformDrawbarOrganProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Drawbar Organ Profile');
		expect(result.metadata.doc_id).toBe('M2-121-UM');
		expect(result.metadata.protocol).toBe('midi2');
		expect(result.metadata.version).toBe('1.0.2');
		expect(result.metadata.date).toBe('2024-01-24');
	});

	describe('Version History', () => {
		it('should have 1 entry', () => {
			expect(result.version_history).toHaveLength(1);
			expect(result.summary.version_history_count).toBe(1);
		});

		it('should parse initial release', () => {
			const entry = result.version_history[0];
			expect(entry.publication_date).toBe('2024-01-24');
			expect(entry.version).toBe('1.0.2');
			expect(entry.changes).toBe('Initial release');
		});
	});

	describe('Normative References', () => {
		it('should have 8 entries', () => {
			expect(result.normative_references).toHaveLength(8);
			expect(result.summary.normative_reference_count).toBe(8);
		});

		it('should parse MA01', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA01');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Complete MIDI 1.0');
		});

		it('should parse MA08 (Rotary Speaker)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA08');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Rotary Speaker');
		});
	});

	describe('Definitions', () => {
		it('should have 26 entries', () => {
			expect(result.definitions).toHaveLength(26);
			expect(result.summary.definition_count).toBe(26);
		});

		it('should parse 100-Cent Unit', () => {
			const entry = result.definitions.find(d => d.term === '100-Cent Unit');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('one-twelfth of an octave');
		});

		it('should parse HCU', () => {
			const entry = result.definitions.find(d => d.term === 'HCU');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('100-Cent-Unit');
		});

		it('should parse Initiator', () => {
			const entry = result.definitions.find(d => d.term === 'Initiator');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('management role');
		});

		it('should parse Responder', () => {
			const entry = result.definitions.find(d => d.term === 'Responder');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Inquiry');
		});
	});

	describe('Conformance Words (Relating)', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words.relating_to_conformance).toHaveLength(3);
			expect(result.summary.conformance_relating_count).toBe(3);
		});

		it('should parse shall, should, may', () => {
			const words = result.conformance_words.relating_to_conformance.map(w => w.word);
			expect(words).toEqual(['shall', 'should', 'may']);
		});
	});

	describe('Conformance Words (Not Relating)', () => {
		it('should have 4 entries', () => {
			expect(result.conformance_words.not_relating_to_conformance).toHaveLength(4);
			expect(result.summary.conformance_not_relating_count).toBe(4);
		});

		it('should parse must, will, can, might', () => {
			const words = result.conformance_words.not_relating_to_conformance.map(w => w.word);
			expect(words).toEqual(['must', 'will', 'can', 'might']);
		});
	});

	describe('Profile ID', () => {
		it('should have 5 bytes', () => {
			expect(result.profile_id).toHaveLength(5);
			expect(result.summary.profile_id_byte_count).toBe(5);
		});

		it('should parse Byte 1 as Standard Defined Profile', () => {
			const byte1 = result.profile_id.find(b => b.byte === 1);
			expect(byte1.value).toBe('0x7E');
			expect(byte1.description).toContain('Standard Defined Profile');
		});

		it('should parse Byte 2 as Drawbar Organ Profile Number MSB', () => {
			const byte2 = result.profile_id.find(b => b.byte === 2);
			expect(byte2.value).toBe('0x20');
		});

		it('should parse Byte 3 as Profile Number LSB', () => {
			const byte3 = result.profile_id.find(b => b.byte === 3);
			expect(byte3.value).toBe('0x01');
		});

		it('should parse Byte 4 as Profile Version', () => {
			const byte4 = result.profile_id.find(b => b.byte === 4);
			expect(byte4.value).toBe('0x01');
		});

		it('should parse Byte 5 as 0xXX Profile Level', () => {
			const byte5 = result.profile_id.find(b => b.byte === 5);
			expect(byte5.value).toBe('0xXX');
			expect(byte5.description).toContain('Level');
		});
	});

	describe('Profile Levels', () => {
		it('should have 5 entries', () => {
			expect(result.profile_levels).toHaveLength(5);
			expect(result.summary.profile_level_count).toBe(5);
		});

		it('should parse 0x00 as non-compliant', () => {
			const level = result.profile_levels.find(l => l.level === '0x00');
			expect(level).toBeDefined();
			expect(level.description).toContain('does not comply');
		});

		it('should parse 0x01 as meets minimum', () => {
			const level = result.profile_levels.find(l => l.level === '0x01');
			expect(level).toBeDefined();
			expect(level.description).toContain('minimum requirements');
		});

		it('should parse 0x02 as extended features', () => {
			const level = result.profile_levels.find(l => l.level === '0x02');
			expect(level).toBeDefined();
			expect(level.description).toContain('extended');
		});

		it('should parse 0x03-0x7E as Reserved', () => {
			const level = result.profile_levels.find(l => l.level === '0x03-0x7E');
			expect(level).toBeDefined();
			expect(level.description).toBe('Reserved');
		});

		it('should parse 0x7F as highest level', () => {
			const level = result.profile_levels.find(l => l.level === '0x7F');
			expect(level).toBeDefined();
			expect(level.description).toContain('Highest level');
		});
	});

	describe('Optional Features Bitmap', () => {
		it('should have 7 entries', () => {
			expect(result.optional_features_bitmap).toHaveLength(7);
			expect(result.summary.optional_features_bitmap_count).toBe(7);
		});

		it('should parse D0 as CC#67 Soft Pedal', () => {
			const d0 = result.optional_features_bitmap.find(b => b.bit === 'D0');
			expect(d0).toBeDefined();
			expect(d0.message).toContain('CC#67');
			expect(d0.message).toContain('Soft Pedal');
		});

		it('should parse D1 as Vibrato/Chorus parameters', () => {
			const d1 = result.optional_features_bitmap.find(b => b.bit === 'D1');
			expect(d1).toBeDefined();
			expect(d1.message).toContain('RC 0x40 0x39');
			expect(d1.message).toContain('RC 0x40 0x3A');
			expect(d1.description).toContain('Vibrato/Chorus');
		});

		it('should parse D2 as Percussion parameters', () => {
			const d2 = result.optional_features_bitmap.find(b => b.bit === 'D2');
			expect(d2).toBeDefined();
			expect(d2.message).toContain('RC 0x40 0x3B');
			expect(d2.description).toContain('Percussion');
		});

		it('should parse D3 as Key Click', () => {
			const d3 = result.optional_features_bitmap.find(b => b.bit === 'D3');
			expect(d3).toBeDefined();
			expect(d3.message).toContain('Key Click');
		});

		it('should parse D4 as Crosstalk/Leakage', () => {
			const d4 = result.optional_features_bitmap.find(b => b.bit === 'D4');
			expect(d4).toBeDefined();
			expect(d4.message).toContain('Crosstalk');
		});

		it('should parse D5-6 as reserved', () => {
			const d56 = result.optional_features_bitmap.find(b => b.bit === 'D5-6');
			expect(d56).toBeDefined();
			expect(d56.message).toContain('reserved');
		});

		it('should parse D7 as reserved status bit', () => {
			const d7 = result.optional_features_bitmap.find(b => b.bit === 'D7');
			expect(d7).toBeDefined();
			expect(d7.message).toContain('status bit');
		});
	});

	describe('Drawbar Settings', () => {
		it('should have 9 entries', () => {
			expect(result.drawbar_settings).toHaveLength(9);
			expect(result.summary.drawbar_setting_count).toBe(9);
		});

		it('should parse Off/In/0 setting', () => {
			const setting = result.drawbar_settings[0];
			expect(setting.setting).toBe('Off/In/0');
			expect(setting.range_start).toBe('0x00000000');
			expect(setting.discrete_value).toBe('0x0E38E38E');
		});

		it('should parse Full/Out/8 setting', () => {
			const setting = result.drawbar_settings[8];
			expect(setting.setting).toBe('Full/Out/8');
			expect(setting.range_end).toBe('0xFFFFFFFF');
			expect(setting.discrete_value).toBe('0xF1C71C72');
		});

		it('should parse setting 4 with midpoint value', () => {
			const setting = result.drawbar_settings.find(s => s.setting === '4');
			expect(setting).toBeDefined();
			expect(setting.discrete_value).toBe('0x80000000');
		});
	});

	describe('Drawbar RCs', () => {
		it('should have 9 entries', () => {
			expect(result.drawbar_rcs).toHaveLength(9);
			expect(result.summary.drawbar_rc_count).toBe(9);
		});

		it('should parse 0x40 0x30 as 16 Drawbar', () => {
			const rc = result.drawbar_rcs.find(r => r.controller_lsb === '0x30');
			expect(rc).toBeDefined();
			expect(rc.parameter).toContain('16');
		});

		it('should parse 0x40 0x38 as 1 Drawbar', () => {
			const rc = result.drawbar_rcs.find(r => r.controller_lsb === '0x38');
			expect(rc).toBeDefined();
			expect(rc.parameter).toContain('1');
		});

		it('should have all RCs with 0x40 MSB', () => {
			result.drawbar_rcs.forEach(rc => {
				expect(rc.controller_msb).toBe('0x40');
			});
		});
	});

	describe('CC#7 Volume Response', () => {
		it('should have 6 entries', () => {
			expect(result.cc7_volume_response).toHaveLength(6);
			expect(result.summary.cc7_volume_response_count).toBe(6);
		});

		it('should parse 0xFFFFFFFF as 0 dB', () => {
			const entry = result.cc7_volume_response.find(e => e.value === '0xFFFFFFFF');
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('0 dB');
		});

		it('should parse 0x00000000 as -infinity', () => {
			const entry = result.cc7_volume_response.find(e => e.value === '0x00000000');
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('-infinity');
		});
	});

	describe('CC#11 Expression Response', () => {
		it('should have 6 entries', () => {
			expect(result.cc11_expression_response).toHaveLength(6);
			expect(result.summary.cc11_expression_response_count).toBe(6);
		});

		it('should parse 0xFFFFFFFF as 0 dB', () => {
			const entry = result.cc11_expression_response.find(e => e.value === '0xFFFFFFFF');
			expect(entry).toBeDefined();
			expect(entry.amplitude).toBe('0 dB');
		});
	});

	describe('Channel Mode Messages', () => {
		it('should have 7 entries', () => {
			expect(result.channel_mode_messages).toHaveLength(7);
			expect(result.summary.channel_mode_message_count).toBe(7);
		});

		it('should parse All Sound Off (CC#120)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 120);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('All Sound Off');
			expect(entry.description).toContain('muted');
		});

		it('should parse Reset All Controllers (CC#121)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 121);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Reset All Controllers');
			expect(entry.description).toContain('reset');
		});

		it('should parse All Notes Off (CC#123)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 123);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('All Notes Off');
		});

		it('should parse Omni Mode Off (CC#124)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 124);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Omni Mode Off');
		});

		it('should parse Omni Mode On (CC#125)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 125);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Omni Mode On');
		});

		it('should parse Mono Mode On (CC#126)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 126);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Mono Mode On');
		});

		it('should parse Poly Mode On (CC#127)', () => {
			const entry = result.channel_mode_messages.find(m => m.cc_number === 127);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Poly Mode On');
			expect(entry.description).toContain('Mode 3');
		});
	});

	describe('Optional CC Messages', () => {
		it('should have 2 entries', () => {
			expect(result.optional_cc_messages).toHaveLength(2);
			expect(result.summary.optional_cc_message_count).toBe(2);
		});

		it('should parse Hold1 Sustain (CC#64)', () => {
			const entry = result.optional_cc_messages.find(c => c.cc_number === 64);
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Sustain');
			expect(entry.value_ranges).toHaveLength(2);
			expect(entry.default_value).toBe('0x00000000');
		});

		it('should parse Soft Pedal (CC#67)', () => {
			const entry = result.optional_cc_messages.find(c => c.cc_number === 67);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Soft Pedal');
			expect(entry.value_ranges).toHaveLength(2);
			expect(entry.default_value).toBe('0x00000000');
			expect(entry.description).toContain('Soft');
		});
	});

	describe('Optional RCs', () => {
		it('should have 9 entries', () => {
			expect(result.optional_rcs).toHaveLength(9);
			expect(result.summary.optional_rc_count).toBe(9);
		});

		it('should parse 0x40 0x39 as Vibrato / Chorus Type', () => {
			const rc = result.optional_rcs.find(r => r.controller_lsb === '0x39');
			expect(rc).toBeDefined();
			expect(rc.parameter).toContain('Vibrato');
		});

		it('should parse 0x40 0x3F as Reserved', () => {
			const rc = result.optional_rcs.find(r => r.controller_lsb === '0x3F');
			expect(rc).toBeDefined();
			expect(rc.parameter).toBe('Reserved');
		});
	});

	describe('Optional RC Details', () => {
		it('should have 8 entries', () => {
			expect(result.optional_rc_details).toHaveLength(8);
			expect(result.summary.optional_rc_detail_count).toBe(8);
		});

		it('should parse 6.1.2.1 Vibrato/Chorus Type with 6 value ranges', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.1');
			expect(detail).toBeDefined();
			expect(detail.controller_msb).toBe('0x40');
			expect(detail.controller_lsb).toBe('0x39');
			expect(detail.value_ranges).toHaveLength(6);
			expect(detail.value_ranges[0].label).toBe('V1');
			expect(detail.value_ranges[5].label).toBe('C3');
		});

		it('should parse 6.1.2.2 Vibrato/Chorus Off/On with default', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.2');
			expect(detail).toBeDefined();
			expect(detail.value_ranges).toHaveLength(2);
			expect(detail.default_value).toBe('0x00000000');
		});

		it('should parse 6.1.2.3 Percussion Off/On', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.3');
			expect(detail).toBeDefined();
			expect(detail.value_ranges).toHaveLength(2);
			expect(detail.value_ranges[0].label).toBe('Off');
			expect(detail.value_ranges[1].label).toBe('On');
		});

		it('should parse 6.1.2.4 Percussion Normal/Soft', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.4');
			expect(detail).toBeDefined();
			expect(detail.value_ranges[0].label).toBe('Normal');
			expect(detail.value_ranges[1].label).toBe('Soft');
		});

		it('should parse 6.1.2.5 Percussion Slow/Fast', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.5');
			expect(detail).toBeDefined();
			expect(detail.value_ranges[0].label).toBe('Slow');
			expect(detail.value_ranges[1].label).toBe('Fast');
		});

		it('should parse 6.1.2.6 Percussion Type 2nd/3rd', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.6');
			expect(detail).toBeDefined();
			expect(detail.value_ranges[0].label).toBe('2nd Harmonic');
			expect(detail.value_ranges[1].label).toBe('3rd Harmonic');
		});

		it('should parse 6.1.2.7 Key Click with default', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.7');
			expect(detail).toBeDefined();
			expect(detail.value_ranges).toHaveLength(1);
			expect(detail.default_value).toBe('0x80000000');
		});

		it('should parse 6.1.2.8 Crosstalk/Leakage with default', () => {
			const detail = result.optional_rc_details.find(d => d.section === '6.1.2.8');
			expect(detail).toBeDefined();
			expect(detail.default_value).toBe('0x80000000');
		});
	});

	describe('Other Optional Messages', () => {
		it('should have 3 entries', () => {
			expect(result.other_optional_messages).toHaveLength(3);
			expect(result.summary.other_optional_message_count).toBe(3);
		});

		it('should parse Poly Pressure', () => {
			const entry = result.other_optional_messages.find(m => m.section === '6.1.3');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Poly Pressure');
			expect(entry.description).toContain('should not respond');
		});

		it('should parse Channel Pressure', () => {
			const entry = result.other_optional_messages.find(m => m.section === '6.1.4');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Channel Pressure');
		});

		it('should parse Pitch Bend', () => {
			const entry = result.other_optional_messages.find(m => m.section === '6.1.5');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Pitch Bend');
			expect(entry.description).toContain('0x80000000');
		});
	});

	describe('MIDI Messages Summary', () => {
		it('should have 19 entries', () => {
			expect(result.midi_messages_summary).toHaveLength(19);
			expect(result.summary.midi_messages_summary_count).toBe(19);
		});

		it('should parse Note On/Off as required', () => {
			const entry = result.midi_messages_summary.find(s => s.message === 'Note On/Off');
			expect(entry).toBeDefined();
			expect(entry.requirement).toBe('required');
		});

		it('should parse CC#7 Volume as required', () => {
			const entry = result.midi_messages_summary.find(s => s.message === 'CC#7');
			expect(entry).toBeDefined();
			expect(entry.parameter).toBe('Volume');
			expect(entry.requirement).toBe('required');
		});

		it('should parse CC#64 Sustain as optional', () => {
			const entry = result.midi_messages_summary.find(s => s.message === 'CC#64');
			expect(entry).toBeDefined();
			expect(entry.requirement).toBe('optional');
		});

		it('should parse CC#67 Soft as optional', () => {
			const entry = result.midi_messages_summary.find(s => s.message === 'CC#67');
			expect(entry).toBeDefined();
			expect(entry.requirement).toBe('optional');
		});

		it('should parse Pitch Bend as optional', () => {
			const entry = result.midi_messages_summary.find(s => s.message === 'Pitch Bend');
			expect(entry).toBeDefined();
			expect(entry.requirement).toBe('optional');
		});

		it('should parse Profile Specific Data as optional', () => {
			const entry = result.midi_messages_summary.find(s => s.message === 'Profile Specific Data');
			expect(entry).toBeDefined();
			expect(entry.parameter).toBe('Discover Optional Features');
			expect(entry.requirement).toBe('optional');
		});

		it('should have 15 required entries', () => {
			const required = result.midi_messages_summary.filter(s => s.requirement === 'required');
			expect(required).toHaveLength(15);
		});

		it('should have 4 optional entries', () => {
			const optional = result.midi_messages_summary.filter(s => s.requirement === 'optional');
			expect(optional).toHaveLength(4);
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.version_history_count).toBe(1);
			expect(s.normative_reference_count).toBe(8);
			expect(s.definition_count).toBe(26);
			expect(s.conformance_relating_count).toBe(3);
			expect(s.conformance_not_relating_count).toBe(4);
			expect(s.profile_id_byte_count).toBe(5);
			expect(s.profile_level_count).toBe(5);
			expect(s.optional_features_bitmap_count).toBe(7);
			expect(s.drawbar_setting_count).toBe(9);
			expect(s.drawbar_rc_count).toBe(9);
			expect(s.cc7_volume_response_count).toBe(6);
			expect(s.cc11_expression_response_count).toBe(6);
			expect(s.channel_mode_message_count).toBe(7);
			expect(s.optional_cc_message_count).toBe(2);
			expect(s.optional_rc_count).toBe(9);
			expect(s.optional_rc_detail_count).toBe(8);
			expect(s.other_optional_message_count).toBe(3);
			expect(s.midi_messages_summary_count).toBe(19);
		});
	});
});
