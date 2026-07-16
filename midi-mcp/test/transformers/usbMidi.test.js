import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformUsbMidi } from '../../lib/transformers/usbMidiTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('USB-MIDI 1.0 Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/usb-midi-1-0-device-class.md');
		result = await transformUsbMidi(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('USB Device Class Definition for MIDI Devices');
		expect(result.metadata.doc_id).toBe('USB-MIDI-1.0');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('1.0');
		expect(result.metadata.date).toBe('1999-11-01');
	});

	describe('CIN Classifications', () => {
		it('should have 16 entries', () => {
			expect(result.cin_classifications).toHaveLength(16);
			expect(result.summary.cin_classification_count).toBe(16);
		});

		it('should parse 0x0 as Miscellaneous function codes', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0x0');
			expect(cin.midi_x_size).toBe('1, 2 or 3');
			expect(cin.description).toContain('Miscellaneous');
		});

		it('should parse 0x4 as SysEx starts or continues', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0x4');
			expect(cin.midi_x_size).toBe('3');
			expect(cin.description).toBe('SysEx starts or continues');
		});

		it('should parse 0x8 as Note-off', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0x8');
			expect(cin.midi_x_size).toBe('3');
			expect(cin.description).toBe('Note-off');
		});

		it('should parse 0x9 as Note-on', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0x9');
			expect(cin.description).toBe('Note-on');
		});

		it('should parse 0xB as Control Change', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0xB');
			expect(cin.description).toBe('Control Change');
		});

		it('should parse 0xC as Program Change', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0xC');
			expect(cin.midi_x_size).toBe('2');
			expect(cin.description).toBe('Program Change');
		});

		it('should parse 0xE as PitchBend Change', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0xE');
			expect(cin.description).toBe('PitchBend Change');
		});

		it('should parse 0xF as Single Byte', () => {
			const cin = result.cin_classifications.find(c => c.cin === '0xF');
			expect(cin.midi_x_size).toBe('1');
			expect(cin.description).toBe('Single Byte');
		});
	});

	describe('Parsed Event Examples', () => {
		it('should have 8 entries', () => {
			expect(result.parsed_event_examples).toHaveLength(8);
			expect(result.summary.parsed_event_example_count).toBe(8);
		});

		it('should parse Note-on example', () => {
			const evt = result.parsed_event_examples.find(e => e.description.includes('Note-on'));
			expect(evt.midi_event).toBe('9n kk vv');
			expect(evt.event_packet).toBe('19 9n kk vv');
		});

		it('should parse Control change example', () => {
			const evt = result.parsed_event_examples.find(e => e.description.includes('Control change'));
			expect(evt.midi_event).toBe('Bn pp vv');
			expect(evt.event_packet).toBe('AB Bn pp vv');
		});

		it('should parse Real-time example', () => {
			const evt = result.parsed_event_examples.find(e => e.description.includes('Real-time'));
			expect(evt.midi_event).toBe('F8 xx xx');
			expect(evt.event_packet).toBe('3F F8 xx xx');
		});

		it('should parse SysEx 5-byte example', () => {
			const evt = result.parsed_event_examples.find(e => e.midi_event === 'F0 00 01 F7');
			expect(evt.description).toContain('End of SysEx: CIN=0x5');
			expect(evt.event_packet).toContain('p4 F0 00 01');
			expect(evt.event_packet).toContain('p5 F7 00 00');
		});

		it('should parse two-byte SysEx special case', () => {
			const evt = result.parsed_event_examples.find(e => e.description.includes('two-byte'));
			expect(evt.midi_event).toBe('F0 F7');
			expect(evt.event_packet).toBe('p6 F0 F7 00');
		});

		it('should parse three-byte SysEx special case', () => {
			const evt = result.parsed_event_examples.find(e => e.description.includes('three-byte'));
			expect(evt.midi_event).toBe('F0 mm F7');
			expect(evt.event_packet).toBe('p7 F0 mm F7');
		});
	});

	describe('Element Capabilities', () => {
		it('should have 12 entries', () => {
			expect(result.element_capabilities).toHaveLength(12);
			expect(result.summary.element_capability_count).toBe(12);
		});

		it('should parse D0 as CUSTOM UNDEFINED', () => {
			const cap = result.element_capabilities.find(c => c.bit === 0);
			expect(cap.name).toContain('CUSTOM UNDEFINED');
		});

		it('should parse D1 as MIDI CLOCK', () => {
			const cap = result.element_capabilities.find(c => c.bit === 1);
			expect(cap.name).toContain('MIDI CLOCK');
		});

		it('should parse D4 as GM1', () => {
			const cap = result.element_capabilities.find(c => c.bit === 4);
			expect(cap.name).toContain('GM1');
		});

		it('should parse D7 as XG', () => {
			const cap = result.element_capabilities.find(c => c.bit === 7);
			expect(cap.name).toContain('XG');
		});

		it('should parse D10 as DLS1', () => {
			const cap = result.element_capabilities.find(c => c.bit === 10);
			expect(cap.name).toContain('DLS1');
		});

		it('should parse D11 as DLS2', () => {
			const cap = result.element_capabilities.find(c => c.bit === 11);
			expect(cap.name).toContain('DLS2');
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

		it('should parse MIDI_IN_JACK as 0x02', () => {
			const sub = result.interface_descriptor_subtypes.find(s => s.name === 'MIDI_IN_JACK');
			expect(sub.value).toBe('0x02');
		});

		it('should parse MIDI_OUT_JACK as 0x03', () => {
			const sub = result.interface_descriptor_subtypes.find(s => s.name === 'MIDI_OUT_JACK');
			expect(sub.value).toBe('0x03');
		});

		it('should parse ELEMENT as 0x04', () => {
			const sub = result.interface_descriptor_subtypes.find(s => s.name === 'ELEMENT');
			expect(sub.value).toBe('0x04');
		});
	});

	describe('Endpoint Descriptor Subtypes', () => {
		it('should have 2 entries', () => {
			expect(result.endpoint_descriptor_subtypes).toHaveLength(2);
			expect(result.summary.endpoint_descriptor_subtype_count).toBe(2);
		});

		it('should parse MS_GENERAL as 0x01', () => {
			const sub = result.endpoint_descriptor_subtypes.find(s => s.name === 'MS_GENERAL');
			expect(sub.value).toBe('0x01');
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

		it('should parse EXTERNAL as 0x02', () => {
			const jack = result.jack_types.find(j => j.name === 'EXTERNAL');
			expect(jack.value).toBe('0x02');
		});
	});

	describe('Control Selectors', () => {
		it('should have 2 entries', () => {
			expect(result.control_selectors).toHaveLength(2);
			expect(result.summary.control_selector_count).toBe(2);
		});

		it('should parse ASSOCIATION_CONTROL as 0x01', () => {
			const ctrl = result.control_selectors.find(c => c.name === 'ASSOCIATION_CONTROL');
			expect(ctrl.value).toBe('0x01');
		});
	});

	describe('Glossary', () => {
		it('should have 4 entries', () => {
			expect(result.glossary).toHaveLength(4);
			expect(result.summary.glossary_count).toBe(4);
		});

		it('should parse MIDI glossary entry', () => {
			const entry = result.glossary.find(g => g.section === 1);
			expect(entry.term).toBe('MIDI: Musical Instrument Digital Interface');
		});

		it('should parse GM glossary entry', () => {
			const entry = result.glossary.find(g => g.section === 2);
			expect(entry.term).toBe('GM: General MIDI');
		});

		it('should parse Roland GS glossary entry', () => {
			const entry = result.glossary.find(g => g.section === 3);
			expect(entry.term).toBe('Roland GS');
		});

		it('should parse Yamaha XG glossary entry', () => {
			const entry = result.glossary.find(g => g.section === 4);
			expect(entry.term).toBe('Yamaha XG');
		});
	});

	describe('Revision History', () => {
		it('should have 9 entries', () => {
			expect(result.revision_history).toHaveLength(9);
			expect(result.summary.revision_history_count).toBe(9);
		});

		it('should parse first revision 0.6', () => {
			expect(result.revision_history[0].revision).toBe('0.6');
			expect(result.revision_history[0].info).toContain('Jun. 1, 97');
		});

		it('should parse final revision 1.0', () => {
			const last = result.revision_history[8];
			expect(last.revision).toBe('1.0');
			expect(last.info).toContain('Nov. 1, 99');
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.cin_classification_count).toBe(16);
			expect(s.parsed_event_example_count).toBe(8);
			expect(s.element_capability_count).toBe(12);
			expect(s.interface_descriptor_subtype_count).toBe(5);
			expect(s.endpoint_descriptor_subtype_count).toBe(2);
			expect(s.jack_type_count).toBe(3);
			expect(s.control_selector_count).toBe(2);
			expect(s.glossary_count).toBe(4);
			expect(s.revision_history_count).toBe(9);
		});
	});
});
