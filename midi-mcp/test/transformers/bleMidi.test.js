import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformBleMidi } from '../../lib/transformers/bleMidiTransformer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('BLE-MIDI (RP-052) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ble-midi-specification.md');
		result = await transformBleMidi(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Specification for MIDI over Bluetooth Low Energy (BLE-MIDI)');
		expect(result.metadata.doc_id).toBe('RP-052');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.version).toBe('1.0');
		expect(result.metadata.date).toBe('2015-11-01');
	});

	describe('BLE Services', () => {
		it('should have 1 service', () => {
			expect(result.ble_services).toHaveLength(1);
			expect(result.summary.ble_service_count).toBe(1);
		});

		it('should parse MIDI Service UUID', () => {
			expect(result.ble_services[0].name).toBe('MIDI Service');
			expect(result.ble_services[0].uuid).toBe('03B80E5A-EDE8-4B33-A751-6CE34EC4C700');
		});
	});

	describe('BLE Characteristics', () => {
		it('should have 1 characteristic', () => {
			expect(result.ble_characteristics).toHaveLength(1);
			expect(result.summary.ble_characteristic_count).toBe(1);
		});

		it('should parse MIDI Data I/O Characteristic UUID', () => {
			expect(result.ble_characteristics[0].name).toBe('MIDI Data I/O Characteristic');
			expect(result.ble_characteristics[0].uuid).toBe('7772E5DB-3868-4112-A1A9-F2669D106BF3');
		});

		it('should have 3 properties', () => {
			expect(result.ble_characteristics[0].properties).toHaveLength(3);
		});

		it('should parse write property', () => {
			const write = result.ble_characteristics[0].properties.find(p => p.startsWith('write'));
			expect(write).toBeDefined();
			expect(write).toContain('write without response is required');
		});

		it('should parse read property', () => {
			const read = result.ble_characteristics[0].properties.find(p => p.startsWith('read'));
			expect(read).toBeDefined();
			expect(read).toContain('respond with no payload');
		});

		it('should parse notify property', () => {
			const notify = result.ble_characteristics[0].properties.find(p => p.startsWith('notify'));
			expect(notify).toBeDefined();
		});
	});

	describe('Header Byte Fields', () => {
		it('should have 3 fields', () => {
			expect(result.header_byte_fields).toHaveLength(3);
			expect(result.summary.header_byte_field_count).toBe(3);
		});

		it('should parse bit 7 as Set to 1', () => {
			const field = result.header_byte_fields.find(f => f.bits === 'bit 7');
			expect(field.description).toBe('Set to 1.');
		});

		it('should parse bit 6 as Reserved', () => {
			const field = result.header_byte_fields.find(f => f.bits === 'bit 6');
			expect(field.description).toContain('Set to 0');
			expect(field.description).toContain('Reserved');
		});

		it('should parse bits 5-0 as timestampHigh', () => {
			const field = result.header_byte_fields.find(f => f.bits === 'bits 5-0');
			expect(field.description).toContain('timestampHigh');
			expect(field.description).toContain('6 bits');
		});
	});

	describe('Timestamp Byte Fields', () => {
		it('should have 2 fields', () => {
			expect(result.timestamp_byte_fields).toHaveLength(2);
			expect(result.summary.timestamp_byte_field_count).toBe(2);
		});

		it('should parse bit 7 as Set to 1', () => {
			const field = result.timestamp_byte_fields.find(f => f.bits === 'bit 7');
			expect(field.description).toBe('Set to 1.');
		});

		it('should parse bits 6-0 as timestampLow', () => {
			const field = result.timestamp_byte_fields.find(f => f.bits === 'bits 6-0');
			expect(field.description).toContain('timestampLow');
			expect(field.description).toContain('7 bits');
		});
	});

	describe('MIDI Message Format', () => {
		it('should have 2 entries', () => {
			expect(result.midi_message_format).toHaveLength(2);
			expect(result.summary.midi_message_format_count).toBe(2);
		});

		it('should parse Byte 0 as Status byte', () => {
			const entry = result.midi_message_format.find(m => m.byte === 'Byte 0');
			expect(entry.description).toContain('Status byte');
			expect(entry.description).toContain('Bit 7');
		});

		it('should parse Bytes 1 to n-1 as Data bytes', () => {
			const entry = result.midi_message_format.find(m => m.byte.startsWith('Bytes 1'));
			expect(entry.description).toContain('Data bytes');
		});
	});

	describe('Running Status Rules', () => {
		it('should have 6 rules', () => {
			expect(result.running_status_rules).toHaveLength(6);
			expect(result.summary.running_status_rule_count).toBe(6);
		});

		it('should parse rule about 2 bytes or greater', () => {
			const rule = result.running_status_rules.find(r => r.includes('2 bytes or greater'));
			expect(rule).toBeDefined();
			expect(rule).toContain('System Common');
		});

		it('should parse rule about omitted Status byte', () => {
			const rule = result.running_status_rules.find(r => r.includes('omitted Status byte'));
			expect(rule).toBeDefined();
		});

		it('should parse rule about end of BLE packet', () => {
			const rule = result.running_status_rules.find(r => r.includes('end of a BLE packet'));
			expect(rule).toBeDefined();
			expect(rule).toContain('cancel Running Status');
		});
	});

	describe('SysEx Encoding Rules', () => {
		it('should have 7 rules', () => {
			expect(result.sysex_encoding_rules).toHaveLength(7);
			expect(result.summary.sysex_encoding_rule_count).toBe(7);
		});

		it('should parse rule about SysEx start byte', () => {
			const rule = result.sysex_encoding_rules.find(r => r.includes('SysEx start byte'));
			expect(rule).toBeDefined();
			expect(rule).toContain('timestamp byte');
		});

		it('should parse rule about continuation packets', () => {
			const rule = result.sysex_encoding_rules.find(r => r.includes('continuation packets'));
			expect(rule).toBeDefined();
		});

		it('should parse rule about EOX message', () => {
			const rule = result.sysex_encoding_rules.find(r => r.includes('EOX'));
			expect(rule).toBeDefined();
		});
	});

	describe('SysEx Interruption Rules', () => {
		it('should have 2 rules', () => {
			expect(result.sysex_interruption_rules).toHaveLength(2);
			expect(result.summary.sysex_interruption_rule_count).toBe(2);
		});

		it('should parse rule about System Real-Time interrupting SysEx', () => {
			const rule = result.sysex_interruption_rules.find(r => r.includes('System Real-Time'));
			expect(rule).toBeDefined();
			expect(rule).toContain('timestamp byte');
		});

		it('should parse rule about SysEx continuations following header/real-time', () => {
			const rule = result.sysex_interruption_rules.find(r => r.includes('continuations'));
			expect(rule).toBeDefined();
		});
	});

	describe('Timestamp Specs', () => {
		it('should have 7 specs', () => {
			expect(result.timestamp_specs).toHaveLength(7);
			expect(result.summary.timestamp_spec_count).toBe(7);
		});

		it('should include 13-bit millisecond spec', () => {
			const spec = result.timestamp_specs.find(s => s.includes('13-bit'));
			expect(spec).toBeDefined();
			expect(spec).toContain('8191 ms');
		});

		it('should include monotonically increasing spec', () => {
			const spec = result.timestamp_specs.find(s => s.includes('Monotonically'));
			expect(spec).toBeDefined();
		});

		it('should include timestampHigh/timestampLow composition', () => {
			const spec = result.timestamp_specs.find(s => s.includes('timestampHigh') && s.includes('timestampLow'));
			expect(spec).toBeDefined();
		});

		it('should include overflow tracking spec', () => {
			const spec = result.timestamp_specs.find(s => s.includes('overflow'));
			expect(spec).toBeDefined();
		});

		it('should include sender clock domain spec', () => {
			const spec = result.timestamp_specs.find(s => s.includes('sender clock'));
			expect(spec).toBeDefined();
		});
	});

	describe('Summary Counts', () => {
		it('should have all correct counts', () => {
			const s = result.summary;
			expect(s.ble_service_count).toBe(1);
			expect(s.ble_characteristic_count).toBe(1);
			expect(s.header_byte_field_count).toBe(3);
			expect(s.timestamp_byte_field_count).toBe(2);
			expect(s.midi_message_format_count).toBe(2);
			expect(s.running_status_rule_count).toBe(6);
			expect(s.sysex_encoding_rule_count).toBe(7);
			expect(s.sysex_interruption_rule_count).toBe(2);
			expect(s.timestamp_spec_count).toBe(7);
		});
	});
});
