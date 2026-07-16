import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformRotarySpeakerProfile } from '../../lib/transformers/rotarySpeakerProfileTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Rotary Speaker Profile (M2-122-UM) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-122-um-rotary-speaker-profile.md');
		result = await transformRotarySpeakerProfile(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Rotary Speaker Profile');
		expect(result.metadata.doc_id).toBe('M2-122-UM');
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

		it('should parse MA03 (MIDI-CI)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA03');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MIDI Capability Inquiry');
		});

		it('should parse MA07 (Bit Scaling)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA07');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Bit Scaling');
		});

		it('should parse MA08 (Drawbar Organs)', () => {
			const entry = result.normative_references.find(r => r.ref_id === 'MA08');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Drawbar Organs');
		});
	});

	describe('Definitions', () => {
		it('should have 21 entries', () => {
			expect(result.definitions).toHaveLength(21);
			expect(result.summary.definition_count).toBe(21);
		});

		it('should parse AMEI', () => {
			const entry = result.definitions.find(d => d.term === 'AMEI');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Association of Musical Electronics Industry');
		});

		it('should parse Device', () => {
			const entry = result.definitions.find(d => d.term === 'Device');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('hardware or software');
		});

		it('should parse UMP', () => {
			const entry = result.definitions.find(d => d.term === 'UMP');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Universal MIDI Packet.');
		});

		it('should parse Profile', () => {
			const entry = result.definitions.find(d => d.term === 'Profile');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('MA/AMEI specification');
		});

		it('should parse RPN', () => {
			const entry = result.definitions.find(d => d.term === 'RPN');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Registered Parameter Number');
		});
	});

	describe('Conformance Words (Relating)', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words.relating_to_conformance).toHaveLength(3);
			expect(result.summary.conformance_relating_count).toBe(3);
		});

		it('should parse shall', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'shall');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of requirement');
		});

		it('should parse should', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'should');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of recommendation');
		});

		it('should parse may', () => {
			const entry = result.conformance_words.relating_to_conformance.find(w => w.word === 'may');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of permission');
		});
	});

	describe('Conformance Words (Not Relating)', () => {
		it('should have 4 entries', () => {
			expect(result.conformance_words.not_relating_to_conformance).toHaveLength(4);
			expect(result.summary.conformance_not_relating_count).toBe(4);
		});

		it('should parse must', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'must');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of unavoidability');
		});

		it('should parse will', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'will');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of fact');
		});

		it('should parse can', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'can');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of capability');
		});

		it('should parse might', () => {
			const entry = result.conformance_words.not_relating_to_conformance.find(w => w.word === 'might');
			expect(entry).toBeDefined();
			expect(entry.reserved_for).toBe('Statements of possibility');
		});
	});

	describe('Profile ID', () => {
		it('should have 5 bytes', () => {
			expect(result.profile_id).toHaveLength(5);
			expect(result.summary.profile_id_byte_count).toBe(5);
		});

		it('should parse Byte 1 as Standard Defined Profile', () => {
			const byte1 = result.profile_id.find(b => b.byte === 1);
			expect(byte1).toBeDefined();
			expect(byte1.value).toBe('0x7E');
			expect(byte1.description).toContain('Standard Defined Profile');
		});

		it('should parse Byte 2 as Profile Number MSB', () => {
			const byte2 = result.profile_id.find(b => b.byte === 2);
			expect(byte2).toBeDefined();
			expect(byte2.value).toBe('0x22');
			expect(byte2.description).toContain('Rotary Speaker Profile Number MSB');
		});

		it('should parse Byte 3 as Profile Number LSB', () => {
			const byte3 = result.profile_id.find(b => b.byte === 3);
			expect(byte3).toBeDefined();
			expect(byte3.value).toBe('0x00');
		});

		it('should parse Byte 4 as Profile Version', () => {
			const byte4 = result.profile_id.find(b => b.byte === 4);
			expect(byte4).toBeDefined();
			expect(byte4.value).toBe('0x01');
		});

		it('should parse Byte 5 as Profile Level', () => {
			const byte5 = result.profile_id.find(b => b.byte === 5);
			expect(byte5).toBeDefined();
			expect(byte5.value).toBe('0x01');
			expect(byte5.description).toContain('Level');
		});
	});

	describe('Required Registered Controllers', () => {
		it('should have 1 entry', () => {
			expect(result.required_registered_controllers).toHaveLength(1);
			expect(result.summary.required_rc_count).toBe(1);
		});

		it('should parse 0x60 0x20 as Rotary Speed', () => {
			const entry = result.required_registered_controllers[0];
			expect(entry.controller_msb).toBe('0x60');
			expect(entry.controller_lsb).toBe('0x20');
			expect(entry.description).toContain('Rotary Speed');
			expect(entry.default_value).toBe('0x00000000');
		});

		it('should have 2 value ranges for Rotary Speed', () => {
			const entry = result.required_registered_controllers[0];
			expect(entry.value_ranges).toHaveLength(2);
			expect(entry.value_ranges[0].range_start).toBe('0x00000000');
			expect(entry.value_ranges[0].range_end).toBe('0x7FFFFFFF');
			expect(entry.value_ranges[0].label).toBe('Slow');
			expect(entry.value_ranges[1].range_start).toBe('0x80000000');
			expect(entry.value_ranges[1].range_end).toBe('0xFFFFFFFF');
			expect(entry.value_ranges[1].label).toBe('Fast');
		});
	});

	describe('Optional Registered Controllers', () => {
		it('should have 13 entries', () => {
			expect(result.optional_registered_controllers).toHaveLength(13);
			expect(result.summary.optional_rc_count).toBe(13);
		});

		it('should parse 0x60 0x21 as Rotary Effect', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x21');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Rotary Effect');
			expect(entry.default_value).toBe('0xFFFFFFFF');
			expect(entry.value_ranges).toHaveLength(2);
			expect(entry.value_ranges[0].label).toBe('Off');
			expect(entry.value_ranges[1].label).toBe('On');
		});

		it('should parse 0x60 0x22 as Rotary Brake', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x22');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Rotary Brake');
			expect(entry.default_value).toBe('0x00000000');
		});

		it('should parse 0x60 0x23 as Horn Slow Speed', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x23');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Horn Slow Speed');
			expect(entry.default_value).toBe('0x80000000');
			expect(entry.value_ranges).toHaveLength(1);
			expect(entry.value_ranges[0].label).toContain('Slowest to Fastest');
		});

		it('should parse 0x60 0x24 as Horn Fast Speed', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x24');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Horn Fast Speed');
			expect(entry.default_value).toBe('0x80000000');
		});

		it('should parse 0x60 0x25 as Woofer Slow Speed', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x25');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Woofer Slow Speed');
		});

		it('should parse 0x60 0x26 as Woofer Fast Speed', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x26');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Woofer Fast Speed');
		});

		it('should parse 0x60 0x27 as Horn Accelerate Time', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x27');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Horn Accelerate Time');
		});

		it('should parse 0x60 0x28 as Horn Decelerate Time', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x28');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Horn Decelerate Time');
		});

		it('should parse 0x60 0x29 as Woofer Accelerate Time', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x29');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Woofer Accelerate Time');
		});

		it('should parse 0x60 0x2A as Woofer Decelerate Time', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x2A');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Woofer Decelerate Time');
		});

		it('should parse 0x60 0x2B as Horn Level', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x2B');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Horn Level');
			expect(entry.default_value).toBe('0xC8000000');
		});

		it('should parse 0x60 0x2C as Woofer Level', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x2C');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Woofer Level');
			expect(entry.default_value).toBe('0xC8000000');
		});

		it('should parse 0x60 0x2D as Rotary Overdrive Amount', () => {
			const entry = result.optional_registered_controllers.find(rc => rc.controller_lsb === '0x2D');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('Rotary Overdrive Amount');
			expect(entry.default_value).toBe('0x00000000');
		});

		it('should have all optional RCs with 0x60 MSB', () => {
			result.optional_registered_controllers.forEach(rc => {
				expect(rc.controller_msb).toBe('0x60');
			});
		});
	});

	describe('Mode Messages', () => {
		it('should have 1 entry', () => {
			expect(result.mode_messages).toHaveLength(1);
			expect(result.summary.mode_message_count).toBe(1);
		});

		it('should parse CC#121 Reset All Controllers', () => {
			const entry = result.mode_messages[0];
			expect(entry.cc_number).toBe(121);
			expect(entry.name).toBe('Reset All Controllers');
			expect(entry.default_value).toBe('0x00000000');
			expect(entry.description).toContain('Reset All Controllers');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.version_history_count).toBe(1);
			expect(result.summary.normative_reference_count).toBe(8);
			expect(result.summary.definition_count).toBe(21);
			expect(result.summary.conformance_relating_count).toBe(3);
			expect(result.summary.conformance_not_relating_count).toBe(4);
			expect(result.summary.profile_id_byte_count).toBe(5);
			expect(result.summary.required_rc_count).toBe(1);
			expect(result.summary.optional_rc_count).toBe(13);
			expect(result.summary.mode_message_count).toBe(1);
		});
	});
});
