import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformUsbMidi2 } from '../../lib/transformers/usbMidi2Transformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('USB-MIDI 2.0 Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/usb-midi-2-0-device-class.md');
		result = await transformUsbMidi2(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('USB Device Class Definition for MIDI Devices, Version 2.0');
		expect(result.metadata.doc_id).toBe('USB-MIDI-2.0');
		expect(result.metadata.protocol).toBe('midi2');
		expect(result.metadata.version).toBe('2.0');
		expect(result.metadata.date).toBe('2020-05-05');
	});

	describe('UMP Message Types', () => {
		it('should have 16 entries', () => {
			expect(result.ump_message_types).toHaveLength(16);
			expect(result.summary.ump_message_type_count).toBe(16);
		});

		it('should parse 0x0 as Utility Messages', () => {
			const mt = result.ump_message_types.find(m => m.message_type === '0x0');
			expect(mt.packet_size).toBe('32 bits');
			expect(mt.description).toBe('Utility Messages');
		});

		it('should parse 0x2 as MIDI 1.0 Channel Voice Messages', () => {
			const mt = result.ump_message_types.find(m => m.message_type === '0x2');
			expect(mt.packet_size).toBe('32 bits');
			expect(mt.description).toBe('MIDI 1.0 Channel Voice Messages');
		});

		it('should parse 0x4 as MIDI 2.0 Channel Voice Messages', () => {
			const mt = result.ump_message_types.find(m => m.message_type === '0x4');
			expect(mt.packet_size).toBe('64 bits');
			expect(mt.description).toBe('MIDI 2.0 Channel Voice Messages');
		});

		it('should parse 0x5 as 128 bits Data Messages', () => {
			const mt = result.ump_message_types.find(m => m.message_type === '0x5');
			expect(mt.packet_size).toBe('128 bits');
			expect(mt.description).toBe('Data Messages');
		});

		it('should parse 0xF as 128 bits Reserved', () => {
			const mt = result.ump_message_types.find(m => m.message_type === '0xF');
			expect(mt.packet_size).toBe('128 bits');
			expect(mt.description).toBe('Reserved');
		});
	});

	describe('Conformance Words', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words).toHaveLength(3);
			expect(result.summary.conformance_word_count).toBe(3);
		});

		it('should parse shall', () => {
			const w = result.conformance_words.find(w => w.word === 'shall');
			expect(w.reserved_for).toContain('Statements of');
		});

		it('should parse should', () => {
			const w = result.conformance_words.find(w => w.word === 'should');
			expect(w.reserved_for).toContain('Statements of');
		});

		it('should parse may', () => {
			const w = result.conformance_words.find(w => w.word === 'may');
			expect(w.reserved_for).toContain('Statements of');
		});
	});

	describe('Non-Conformance Words', () => {
		it('should have 4 entries', () => {
			expect(result.non_conformance_words).toHaveLength(4);
			expect(result.summary.non_conformance_word_count).toBe(4);
		});

		it('should parse must, will, can, might', () => {
			const words = result.non_conformance_words.map(w => w.word);
			expect(words).toEqual(['must', 'will', 'can', 'might']);
		});
	});

	describe('Version 2.0 Changes', () => {
		it('should have 9 entries', () => {
			expect(result.version2_changes).toHaveLength(9);
			expect(result.summary.version2_change_count).toBe(9);
		});

		it('should include UMP replacement change', () => {
			const change = result.version2_changes.find(c => c.includes('Replaced the 32-bit'));
			expect(change).toBeDefined();
		});

		it('should include Group Terminals change', () => {
			const change = result.version2_changes.find(c => c.includes('MIDI IN/OUT Jacks replaced'));
			expect(change).toBeDefined();
		});

		it('should include Element removal change', () => {
			const change = result.version2_changes.find(c => c.includes('Removed the Element'));
			expect(change).toBeDefined();
		});

		it('should include Transfer Endpoints removal', () => {
			const change = result.version2_changes.find(c => c.includes('Removed the Transfer Endpoints'));
			expect(change).toBeDefined();
		});
	});

	describe('Descriptor Types', () => {
		it('should have 7 entries', () => {
			expect(result.descriptor_types).toHaveLength(7);
			expect(result.summary.descriptor_type_count).toBe(7);
		});

		it('should parse CS_INTERFACE as 0x24', () => {
			const dt = result.descriptor_types.find(d => d.name === 'CS_INTERFACE');
			expect(dt.value).toBe('0x24');
		});

		it('should parse CS_ENDPOINT as 0x25', () => {
			const dt = result.descriptor_types.find(d => d.name === 'CS_ENDPOINT');
			expect(dt.value).toBe('0x25');
		});

		it('should parse CS_GR_TRM_BLOCK as 0x26', () => {
			const dt = result.descriptor_types.find(d => d.name === 'CS_GR_TRM_BLOCK');
			expect(dt.value).toBe('0x26');
		});
	});

	describe('Interface Descriptor Subtypes', () => {
		it('should have 5 entries', () => {
			expect(result.interface_descriptor_subtypes).toHaveLength(5);
			expect(result.summary.interface_descriptor_subtype_count).toBe(5);
		});

		it('should parse MS_HEADER as 0x01', () => {
			const sub = result.interface_descriptor_subtypes.find(s => s.name === 'MS_HEADER');
			expect(sub.value).toBe('0x01');
		});
	});

	describe('Endpoint Descriptor Subtypes', () => {
		it('should have 3 entries', () => {
			expect(result.endpoint_descriptor_subtypes).toHaveLength(3);
			expect(result.summary.endpoint_descriptor_subtype_count).toBe(3);
		});

		it('should parse MS_GENERAL as 0x01', () => {
			const sub = result.endpoint_descriptor_subtypes.find(s => s.name === 'MS_GENERAL');
			expect(sub.value).toBe('0x01');
		});

		it('should parse MS_GENERAL_2_0 as 0x02', () => {
			const sub = result.endpoint_descriptor_subtypes.find(s => s.name === 'MS_GENERAL_2_0');
			expect(sub.value).toBe('0x02');
		});
	});

	describe('Group Terminal Block Subtypes', () => {
		it('should have 3 entries', () => {
			expect(result.group_terminal_block_subtypes).toHaveLength(3);
			expect(result.summary.group_terminal_block_subtype_count).toBe(3);
		});

		it('should parse GR_TRM_BLOCK_HEADER as 0x01', () => {
			const sub = result.group_terminal_block_subtypes.find(s => s.name === 'GR_TRM_BLOCK_HEADER');
			expect(sub.value).toBe('0x01');
		});

		it('should parse GR_TRM_BLOCK as 0x02', () => {
			const sub = result.group_terminal_block_subtypes.find(s => s.name === 'GR_TRM_BLOCK');
			expect(sub.value).toBe('0x02');
		});
	});

	describe('MS Class Revisions', () => {
		it('should have 2 entries', () => {
			expect(result.ms_class_revisions).toHaveLength(2);
			expect(result.summary.ms_class_revision_count).toBe(2);
		});

		it('should parse MS_MIDI_1_0 as 0x0100', () => {
			const rev = result.ms_class_revisions.find(r => r.name === 'MS_MIDI_1_0');
			expect(rev.value).toBe('0x0100');
		});

		it('should parse MS_MIDI_2_0 as 0x0200', () => {
			const rev = result.ms_class_revisions.find(r => r.name === 'MS_MIDI_2_0');
			expect(rev.value).toBe('0x0200');
		});
	});

	describe('Jack Types', () => {
		it('should have 3 entries', () => {
			expect(result.jack_types).toHaveLength(3);
			expect(result.summary.jack_type_count).toBe(3);
		});

		it('should parse EMBEDDED as 0x01', () => {
			const jack = result.jack_types.find(j => j.name === 'EMBEDDED');
			expect(jack.value).toBe('0x01');
		});
	});

	describe('Group Terminal Block Types', () => {
		it('should have 3 entries', () => {
			expect(result.group_terminal_block_types).toHaveLength(3);
			expect(result.summary.group_terminal_block_type_count).toBe(3);
		});

		it('should parse BIDIRECTIONAL as 0x00', () => {
			const gtb = result.group_terminal_block_types.find(g => g.name === 'BIDIRECTIONAL');
			expect(gtb.value).toBe('0x00');
		});

		it('should parse INPUT_ONLY as 0x01', () => {
			const gtb = result.group_terminal_block_types.find(g => g.name === 'INPUT_ONLY');
			expect(gtb.value).toBe('0x01');
		});

		it('should parse OUTPUT_ONLY as 0x02', () => {
			const gtb = result.group_terminal_block_types.find(g => g.name === 'OUTPUT_ONLY');
			expect(gtb.value).toBe('0x02');
		});
	});

	describe('Default MIDI Protocols', () => {
		it('should have 7 entries', () => {
			expect(result.default_midi_protocols).toHaveLength(7);
			expect(result.summary.default_midi_protocol_count).toBe(7);
		});

		it('should parse USE_MIDI_CI as 0x00', () => {
			const proto = result.default_midi_protocols.find(p => p.name === 'USE_MIDI_CI');
			expect(proto.value).toBe('0x00');
		});

		it('should parse MIDI_1_0_UP_TO_64_BITS as 0x01', () => {
			const proto = result.default_midi_protocols.find(p => p.name === 'MIDI_1_0_UP_TO_64_BITS');
			expect(proto.value).toBe('0x01');
		});

		it('should parse MIDI_2_0 as 0x11', () => {
			const proto = result.default_midi_protocols.find(p => p.name === 'MIDI_2_0');
			expect(proto.value).toBe('0x11');
		});

		it('should parse MIDI_2_0_AND_JRTS as 0x12', () => {
			const proto = result.default_midi_protocols.find(p => p.name === 'MIDI_2_0_AND_JRTS');
			expect(proto.value).toBe('0x12');
		});
	});

	describe('Group Terminal Numbers', () => {
		it('should have 16 entries', () => {
			expect(result.group_terminal_numbers).toHaveLength(16);
			expect(result.summary.group_terminal_number_count).toBe(16);
		});

		it('should parse GROUP_1 as 0x00', () => {
			const gtn = result.group_terminal_numbers.find(g => g.name === 'GROUP_1');
			expect(gtn.value).toBe('0x00');
		});

		it('should parse GROUP_16 as 0x0F', () => {
			const gtn = result.group_terminal_numbers.find(g => g.name === 'GROUP_16');
			expect(gtn.value).toBe('0x0F');
		});
	});

	describe('Revision History', () => {
		it('should have 2 entries', () => {
			expect(result.revision_history).toHaveLength(2);
			expect(result.summary.revision_history_count).toBe(2);
		});

		it('should parse revision 1.0', () => {
			const rev = result.revision_history.find(r => r.revision === '1.0');
			expect(rev.info).toContain('Nov. 1, 1999');
		});

		it('should parse revision 2.0', () => {
			const rev = result.revision_history.find(r => r.revision === '2.0');
			expect(rev.info).toContain('May 5, 2020');
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.ump_message_type_count).toBe(16);
			expect(s.conformance_word_count).toBe(3);
			expect(s.non_conformance_word_count).toBe(4);
			expect(s.version2_change_count).toBe(9);
			expect(s.descriptor_type_count).toBe(7);
			expect(s.interface_descriptor_subtype_count).toBe(5);
			expect(s.endpoint_descriptor_subtype_count).toBe(3);
			expect(s.group_terminal_block_subtype_count).toBe(3);
			expect(s.ms_class_revision_count).toBe(2);
			expect(s.jack_type_count).toBe(3);
			expect(s.group_terminal_block_type_count).toBe(3);
			expect(s.default_midi_protocol_count).toBe(7);
			expect(s.group_terminal_number_count).toBe(16);
			expect(s.revision_history_count).toBe(2);
		});
	});
});
