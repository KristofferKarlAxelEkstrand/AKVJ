import { describe, it, expect, beforeAll } from 'vitest';
import { transformUmpMidi2Protocol } from '../../lib/transformers/umpMidi2ProtocolTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/m2-104-um-ump-and-midi-2-0-protocol-specification.md');

let result;

beforeAll(async () => {
	result = await transformUmpMidi2Protocol(MARKDOWN_PATH);
});

describe('UMP/MIDI 2.0 Protocol Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toBe('Universal MIDI Packet (UMP) Format and MIDI 2.0 Protocol Specification');
			expect(result.metadata.doc_id).toBe('M2-104-UM');
			expect(result.metadata.protocol).toBe('midi2');
			expect(result.metadata.version).toBe('1.1.2');
			expect(result.metadata.date).toBe('2023-11');
		});
	});

	describe('Message Type Allocation (Table 4)', () => {
		it('should have 16 message types', () => {
			expect(result.message_type_allocation).toHaveLength(16);
		});

		it('should parse MT 0x0 as Utility', () => {
			const mt0 = result.message_type_allocation.find(e => e.mt === '0x0');
			expect(mt0).toBeDefined();
			expect(mt0.ump_size).toBe('32 bits');
			expect(mt0.description).toBe('Utility Messages');
		});

		it('should parse MT 0x4 as MIDI 2.0 Channel Voice', () => {
			const mt4 = result.message_type_allocation.find(e => e.mt === '0x4');
			expect(mt4).toBeDefined();
			expect(mt4.ump_size).toBe('64 bits');
			expect(mt4.description).toBe('MIDI 2.0 Channel Voice Messages');
		});

		it('should parse MT 0x5 as 128-bit Data Messages', () => {
			const mt5 = result.message_type_allocation.find(e => e.mt === '0x5');
			expect(mt5).toBeDefined();
			expect(mt5.ump_size).toBe('128 bits');
			expect(mt5.description).toBe('Data Messages');
		});

		it('should parse MT 0xD as Flex Data', () => {
			const mtD = result.message_type_allocation.find(e => e.mt === '0xD');
			expect(mtD).toBeDefined();
			expect(mtD.ump_size).toBe('128 bits');
			expect(mtD.description).toBe('Flex Data Messages');
		});

		it('should parse MT 0xF as UMP Stream', () => {
			const mtF = result.message_type_allocation.find(e => e.mt === '0xF');
			expect(mtF).toBeDefined();
			expect(mtF.ump_size).toBe('128 bits');
			expect(mtF.description).toBe('UMP Stream Messages');
		});

		it('should parse reserved MT 0x7 with empty description', () => {
			const mt7 = result.message_type_allocation.find(e => e.mt === '0x7');
			expect(mt7).toBeDefined();
			expect(mt7.ump_size).toBe('32 bits');
			expect(mt7.description).toBe('');
		});
	});

	describe('Attribute Types (Table 8)', () => {
		it('should have 5 attribute types', () => {
			expect(result.attribute_types).toHaveLength(5);
		});

		it('should parse 0x00 as No Attribute Data', () => {
			const attr0 = result.attribute_types.find(e => e.attribute_type === '0x00');
			expect(attr0).toBeDefined();
			expect(attr0.definition).toContain('No Attribute Data');
		});

		it('should parse 0x03 as Pitch 7.9', () => {
			const attr3 = result.attribute_types.find(e => e.attribute_type === '0x03');
			expect(attr3).toBeDefined();
			expect(attr3.definition).toContain('Pitch 7.9');
		});
	});

	describe('Flex Data Format Fields (Table 9)', () => {
		it('should have 4 format values', () => {
			expect(result.flex_data_format_fields).toHaveLength(4);
		});

		it('should parse value 0 as Complete', () => {
			const v0 = result.flex_data_format_fields.find(e => e.value === 0);
			expect(v0).toBeDefined();
			expect(v0.ump_type).toContain('Complete');
		});

		it('should parse value 3 as End', () => {
			const v3 = result.flex_data_format_fields.find(e => e.value === 3);
			expect(v3).toBeDefined();
			expect(v3.ump_type).toContain('End');
		});
	});

	describe('Flex Data Address Fields (Table 10)', () => {
		it('should have 4 address values', () => {
			expect(result.flex_data_address_fields).toHaveLength(4);
		});

		it('should parse value 0 as Channel addressing', () => {
			const v0 = result.flex_data_address_fields.find(e => e.value === 0);
			expect(v0).toBeDefined();
			expect(v0.addressing).toContain('Channel');
		});

		it('should parse value 1 as Group addressing', () => {
			const v1 = result.flex_data_address_fields.find(e => e.value === 1);
			expect(v1).toBeDefined();
			expect(v1.addressing).toContain('Group');
		});
	});

	describe('Status Bank Classifications (Table 11)', () => {
		it('should have 4 classifications', () => {
			expect(result.status_bank_classifications).toHaveLength(4);
		});

		it('should parse 0x00 as Setup & Performance', () => {
			const sb0 = result.status_bank_classifications.find(e => e.status_bank === '0x00');
			expect(sb0).toBeDefined();
			expect(sb0.classification).toContain('Setup');
		});

		it('should parse 0x01 as Metadata Text', () => {
			const sb1 = result.status_bank_classifications.find(e => e.status_bank === '0x01');
			expect(sb1).toBeDefined();
			expect(sb1.classification).toContain('Metadata');
		});
	});

	describe('Sharps and Flats Examples (Table 12)', () => {
		it('should have 3 examples', () => {
			expect(result.sharps_flats_examples).toHaveLength(3);
		});

		it('should parse One Sharp example', () => {
			const one = result.sharps_flats_examples.find(e => e.sharps_flats_field === 'One Sharp');
			expect(one).toBeDefined();
			expect(one.tonic_note).toBe('D');
			expect(one.intended_tonic_note).toContain('Natural');
		});
	});

	describe('Tonic Sharps and Flats (Table 13)', () => {
		it('should have 5 values', () => {
			expect(result.tonic_sharps_flats).toHaveLength(5);
		});

		it('should parse 0x0 as Natural', () => {
			const natural = result.tonic_sharps_flats.find(e => e.twos_complement === '0x0');
			expect(natural).toBeDefined();
			expect(natural.decimal_value).toBe(0);
			expect(natural.applied_to_tonic).toBe('Natural');
		});

		it('should parse 0xF as Flat (-1)', () => {
			const flat = result.tonic_sharps_flats.find(e => e.twos_complement === '0xF');
			expect(flat).toBeDefined();
			expect(flat.decimal_value).toBe(-1);
			expect(flat.applied_to_tonic).toBe('Flat');
		});
	});

	describe('Chord Types (Table 14)', () => {
		it('should have 29 chord types', () => {
			expect(result.chord_types).toHaveLength(29);
		});

		it('should parse 0x00 as Clear Chord', () => {
			const clear = result.chord_types.find(e => e.value === '0x00');
			expect(clear).toBeDefined();
			expect(clear.chord_type).toContain('Clear Chord');
		});

		it('should parse 0x01 as Major', () => {
			const major = result.chord_types.find(e => e.value === '0x01');
			expect(major).toBeDefined();
			expect(major.chord_type).toBe('Major');
		});

		it('should parse 0x07 as Minor', () => {
			const minor = result.chord_types.find(e => e.value === '0x07');
			expect(minor).toBeDefined();
			expect(minor.chord_type).toBe('Minor');
		});

		it('should parse 0x13 as Diminished', () => {
			const dim = result.chord_types.find(e => e.value === '0x13');
			expect(dim).toBeDefined();
			expect(dim.chord_type).toBe('Diminished');
		});
	});

	describe('Bass Note Sharps and Flats (Table 15)', () => {
		it('should have 6 values', () => {
			expect(result.bass_note_sharps_flats).toHaveLength(6);
		});

		it('should parse 0x8 as Same Note as Chord Tonic (-8)', () => {
			const same = result.bass_note_sharps_flats.find(e => e.twos_complement === '0x8');
			expect(same).toBeDefined();
			expect(same.decimal_value).toBe(-8);
			expect(same.applied_to_bass_note).toContain('Same Note');
		});
	});

	describe('Text Messages (Table 16)', () => {
		it('should have 18 text messages', () => {
			expect(result.text_messages).toHaveLength(18);
		});

		it('should parse 0x01 0x00 as Unknown Metadata Text', () => {
			const unknown = result.text_messages.find(e => e.status_bank === '0x01' && e.status === '0x00');
			expect(unknown).toBeDefined();
			expect(unknown.message).toContain('Unknown');
		});

		it('should parse 0x01 0x04 as Copyright Notice', () => {
			const copyright = result.text_messages.find(e => e.status_bank === '0x01' && e.status === '0x04');
			expect(copyright).toBeDefined();
			expect(copyright.message).toContain('Copyright');
		});

		it('should parse 0x02 0x01 as Lyrics', () => {
			const lyrics = result.text_messages.find(e => e.status_bank === '0x02' && e.status === '0x01');
			expect(lyrics).toBeDefined();
			expect(lyrics.message).toContain('Lyrics');
		});
	});

	describe('System Message Formats (Table 17)', () => {
		it('should have 16 system messages', () => {
			expect(result.system_message_formats).toHaveLength(16);
		});

		it('should parse MIDI Time Code with status 0xF1', () => {
			const mtc = result.system_message_formats.find(e => e.status === '0xF1');
			expect(mtc).toBeDefined();
			expect(mtc.message).toBe('MIDI Time Code');
			expect(mtc.byte_2).toBe('0nnndddd');
		});

		it('should parse Tune Request with status 0xF6', () => {
			const tune = result.system_message_formats.find(e => e.status === '0xF6');
			expect(tune).toBeDefined();
			expect(tune.message).toBe('Tune Request');
		});

		it('should parse Reset with status 0xFF', () => {
			const reset = result.system_message_formats.find(e => e.status === '0xFF');
			expect(reset).toBeDefined();
			expect(reset.message).toBe('Reset');
		});
	});

	describe('SysEx 7-Bit Status Values (Table 18)', () => {
		it('should have 4 status values', () => {
			expect(result.sysex7_status_values).toHaveLength(4);
		});

		it('should parse 0x0 as Complete', () => {
			const complete = result.sysex7_status_values.find(e => e.status === '0x0');
			expect(complete).toBeDefined();
			expect(complete.ump_type).toContain('Complete');
		});

		it('should parse 0x3 as End', () => {
			const end = result.sysex7_status_values.find(e => e.status === '0x3');
			expect(end).toBeDefined();
			expect(end.ump_type).toContain('End');
		});
	});

	describe('SysEx 8-Bit Status Values (Table 19)', () => {
		it('should have 4 status values', () => {
			expect(result.sysex8_status_values).toHaveLength(4);
		});

		it('should parse 0x0 as Complete', () => {
			const complete = result.sysex8_status_values.find(e => e.status === '0x0');
			expect(complete).toBeDefined();
			expect(complete.ump_type).toContain('Complete');
		});
	});

	describe('Special ID Conversions (Table 20)', () => {
		it('should have 3 special IDs', () => {
			expect(result.special_id_conversions).toHaveLength(3);
		});

		it('should parse 0x7E as Universal Non-Real Time', () => {
			const nonrt = result.special_id_conversions.find(e => e.seven_bit_value === '0x7E');
			expect(nonrt).toBeDefined();
			expect(nonrt.sixteen_bit_value).toBe('0x007E');
			expect(nonrt.special_id).toContain('Non-Real Time');
		});

		it('should parse 0x7F as Universal Real Time', () => {
			const rt = result.special_id_conversions.find(e => e.seven_bit_value === '0x7F');
			expect(rt).toBeDefined();
			expect(rt.sixteen_bit_value).toBe('0x007F');
		});
	});

	describe('Manufacturer ID Conversions (Table 21)', () => {
		it('should have 9 manufacturer entries', () => {
			expect(result.manufacturer_id_conversions).toHaveLength(9);
		});

		it('should parse Moog', () => {
			const moog = result.manufacturer_id_conversions.find(e => e.manufacturer === 'Moog');
			expect(moog).toBeDefined();
			expect(moog.mfid_1).toBe('0x04');
			expect(moog.mfrid).toBe('0x0004');
		});

		it('should parse Yamaha', () => {
			const yamaha = result.manufacturer_id_conversions.find(e => e.manufacturer === 'Yamaha');
			expect(yamaha).toBeDefined();
			expect(yamaha.mfid_1).toBe('0x43');
		});

		it('should parse Mark of the Unicorn with 3-byte ID', () => {
			const motu = result.manufacturer_id_conversions.find(e => e.manufacturer === 'Mark of the Unicorn');
			expect(motu).toBeDefined();
			expect(motu.mfid_1).toBe('0x00');
			expect(motu.mfid_2).toBe('0x00');
			expect(motu.mfid_3).toBe('0x3b');
			expect(motu.mfrid).toBe('0x803b');
		});

		it('should parse Native Instruments', () => {
			const ni = result.manufacturer_id_conversions.find(e => e.manufacturer === 'Native Instruments');
			expect(ni).toBeDefined();
			expect(ni.mfrid).toBe('0xa109');
		});
	});

	describe('Registered Per-Note Controllers (Table 22)', () => {
		it('should have 27 controller entries', () => {
			expect(result.registered_per_note_controllers).toHaveLength(27);
		});

		it('should parse controller 0 as Reserved', () => {
			const c0 = result.registered_per_note_controllers.find(e => e.number === '0');
			expect(c0).toBeDefined();
			expect(c0.controller_name).toBe('Reserved');
		});

		it('should parse controller 3 as Pitch 7.25 with Section reference', () => {
			const c3 = result.registered_per_note_controllers.find(e => e.number === '3');
			expect(c3).toBeDefined();
			expect(c3.controller_name).toBe('Pitch 7.25');
			expect(c3.reference).toBe('Section 7.4.15.2');
		});

		it('should parse controller 75 with MMA RP-021 reference', () => {
			const c75 = result.registered_per_note_controllers.find(e => e.number === '75');
			expect(c75).toBeDefined();
			expect(c75.controller_name).toContain('Decay Time');
			expect(c75.reference).toBe('MMA RP-021');
		});

		it('should parse range 4–6 as Reserved', () => {
			const range = result.registered_per_note_controllers.find(e => e.number === '4–6');
			expect(range).toBeDefined();
			expect(range.controller_name).toBe('Reserved');
		});
	});

	describe('Center Value Examples (Table 23)', () => {
		it('should have 5 center value examples', () => {
			expect(result.center_value_examples).toHaveLength(5);
		});

		it('should parse 7-bit center as 0x40', () => {
			const seven = result.center_value_examples.find(e => e.value_size === '7 bits');
			expect(seven).toBeDefined();
			expect(seven.center_hex).toBe('0x40');
		});

		it('should parse 32-bit center as 0x80000000', () => {
			const thirtyTwo = result.center_value_examples.find(e => e.value_size === '32 bits');
			expect(thirtyTwo).toBeDefined();
			expect(thirtyTwo.center_hex).toBe('0x80000000');
		});
	});

	describe('UMP Formats (Tables 26-33)', () => {
		it('should have UMP format entries', () => {
			expect(result.ump_formats.length).toBeGreaterThan(20);
		});

		it('should parse NOOP as MT 0x0', () => {
			const noop = result.ump_formats.find(e => e.message === 'NOOP');
			expect(noop).toBeDefined();
			expect(noop.mt).toBe('0x0');
		});

		it('should parse Note On as MT 0x2', () => {
			const noteOn = result.ump_formats.find(e => e.message === 'Note On' && e.mt === '0x2');
			expect(noteOn).toBeDefined();
			expect(noteOn.group).toBe('gggg');
		});

		it('should parse Reset as MT 0x1', () => {
			const reset = result.ump_formats.find(e => e.message === 'Reset' && e.mt === '0x1');
			expect(reset).toBeDefined();
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.message_type_allocation_count).toBe(16);
			expect(result.summary.attribute_type_count).toBe(5);
			expect(result.summary.flex_data_format_field_count).toBe(4);
			expect(result.summary.flex_data_address_field_count).toBe(4);
			expect(result.summary.status_bank_classification_count).toBe(4);
			expect(result.summary.sharps_flats_example_count).toBe(3);
			expect(result.summary.tonic_sharps_flats_count).toBe(5);
			expect(result.summary.chord_type_count).toBe(29);
			expect(result.summary.bass_note_sharps_flats_count).toBe(6);
			expect(result.summary.text_message_count).toBe(18);
			expect(result.summary.system_message_format_count).toBe(16);
			expect(result.summary.sysex7_status_value_count).toBe(4);
			expect(result.summary.sysex8_status_value_count).toBe(4);
			expect(result.summary.special_id_conversion_count).toBe(3);
			expect(result.summary.manufacturer_id_conversion_count).toBe(9);
			expect(result.summary.registered_per_note_controller_count).toBe(27);
			expect(result.summary.center_value_example_count).toBe(5);
			expect(result.summary.ump_format_count).toBeGreaterThan(20);
		});
	});
});
