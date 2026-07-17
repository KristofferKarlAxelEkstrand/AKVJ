import { describe, it, expect, beforeAll } from 'vitest';
import { transformMidiCi } from '../../lib/transformers/midiCiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/m2-101-um-midi-ci-specification.md');

let result;

beforeAll(async () => {
	result = await transformMidiCi(MARKDOWN_PATH);
});

describe('MIDI-CI Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toBe('MIDI Capability Inquiry (MIDI-CI) Specification');
			expect(result.metadata.doc_id).toBe('M2-101-UM');
			expect(result.metadata.protocol).toBe('midi2');
			expect(result.metadata.version).toBe('1.2');
		});
	});

	describe('Categories (Table 4)', () => {
		it('should have 8 categories', () => {
			expect(result.categories).toHaveLength(8);
		});

		it('should parse category 0 as Reserved', () => {
			const cat0 = result.categories.find(e => e.category === 0);
			expect(cat0).toBeDefined();
			expect(cat0.sub_id_2_range).toBe('0x00-0x0F');
			expect(cat0.description).toContain('Reserved');
		});

		it('should parse category 2 as Profile Configuration', () => {
			const cat2 = result.categories.find(e => e.category === 2);
			expect(cat2).toBeDefined();
			expect(cat2.sub_id_2_range).toBe('0x20-0x2F');
			expect(cat2.description).toContain('Profile Configuration');
		});

		it('should parse category 3 as Property Exchange', () => {
			const cat3 = result.categories.find(e => e.category === 3);
			expect(cat3).toBeDefined();
			expect(cat3.sub_id_2_range).toBe('0x30-0x3F');
			expect(cat3.description).toContain('Property Exchange');
		});

		it('should parse category 7 as Management Messages', () => {
			const cat7 = result.categories.find(e => e.category === 7);
			expect(cat7).toBeDefined();
			expect(cat7.sub_id_2_range).toBe('0x70-0x7F');
			expect(cat7.description).toContain('Management');
		});
	});

	describe('Standard Format (Table 5)', () => {
		it('should have format fields', () => {
			expect(result.standard_format.length).toBeGreaterThan(5);
		});

		it('should parse F0 as System Exclusive Start', () => {
			const f0 = result.standard_format.find(e => e.value === 'F0');
			expect(f0).toBeDefined();
			expect(f0.parameter).toContain('System Exclusive Start');
		});

		it('should parse 0D as MIDI-CI Sub-ID#1', () => {
			const od = result.standard_format.find(e => e.value === '0D');
			expect(od).toBeDefined();
			expect(od.parameter).toContain('MIDI-CI');
		});
	});

	describe('Bitmap Allocation (Table 7)', () => {
		it('should have 7 bitmap entries', () => {
			expect(result.bitmap_allocation).toHaveLength(7);
		});

		it('should parse D0 as category 0 Reserved', () => {
			const d0 = result.bitmap_allocation.find(e => e.bit === 'D0');
			expect(d0).toBeDefined();
			expect(d0.category).toBe(0);
			expect(d0.description).toContain('Reserved');
		});

		it('should parse D2 as Profile Configuration Supported', () => {
			const d2 = result.bitmap_allocation.find(e => e.bit === 'D2');
			expect(d2).toBeDefined();
			expect(d2.category).toBe(2);
			expect(d2.description).toContain('Profile Configuration');
		});
	});

	describe('Message Formats', () => {
		it('should have many message format entries', () => {
			expect(result.message_formats.length).toBeGreaterThan(300);
		});

		it('should parse Table 6 Discovery message with F0 start', () => {
			const discovery = result.message_formats.filter(e => e.table_number === 6);
			expect(discovery.length).toBeGreaterThan(5);
			expect(discovery[0].value).toBe('F0');
			expect(discovery[0].parameter).toContain('System Exclusive Start');
		});

		it('should parse Table 6 Discovery with Sub-ID#2 value 70', () => {
			const discovery = result.message_formats.filter(e => e.table_number === 6);
			const subId = discovery.find(e => e.value === '70');
			expect(subId).toBeDefined();
			expect(subId.parameter).toContain('Discovery');
		});

		it('should include table_number for each entry', () => {
			result.message_formats.forEach(e => {
				expect(e.table_number).toBeDefined();
				expect(typeof e.table_number).toBe('number');
			});
		});

		it('should parse Table 8 Reply to Discovery', () => {
			const reply = result.message_formats.filter(e => e.table_number === 8);
			expect(reply.length).toBeGreaterThan(5);
		});

		it('should parse Table 13 ACK message with Sub-ID#2 7D', () => {
			const ack = result.message_formats.filter(e => e.table_number === 13);
			const subId = ack.find(e => e.value === '7D');
			expect(subId).toBeDefined();
			expect(subId.parameter).toContain('ACK');
		});
	});

	describe('ACK Status Codes (Table 14)', () => {
		it('should have ACK status codes', () => {
			expect(result.ack_status_codes.length).toBeGreaterThan(1);
		});

		it('should parse 0x00 0x00 as ACK', () => {
			const ack = result.ack_status_codes.find(e => e.status_code === '0x00' && e.status_data === '0x00');
			expect(ack).toBeDefined();
			expect(ack.reason).toBe('ACK');
		});
	});

	describe('NAK Status Codes (Table 16)', () => {
		it('should have NAK status codes', () => {
			expect(result.nak_status_codes.length).toBeGreaterThan(5);
		});

		it('should parse 0x00 0x00 as NAK', () => {
			const nak = result.nak_status_codes.find(e => e.status_code === '0x00' && e.status_data === '0x00');
			expect(nak).toBeDefined();
			expect(nak.reason).toBe('NAK');
		});

		it('should parse 0x01 as MIDI-CI message not supported', () => {
			const notSupported = result.nak_status_codes.find(e => e.status_code === '0x01');
			expect(notSupported).toBeDefined();
			expect(notSupported.reason).toContain('not supported');
		});

		it('should parse 0x42 as Timeout', () => {
			const timeout = result.nak_status_codes.find(e => e.status_code === '0x42');
			expect(timeout).toBeDefined();
			expect(timeout.reason).toContain('Timeout');
		});
	});

	describe('Property Exchange Versions (Table 31)', () => {
		it('should have 1 version entry', () => {
			expect(result.property_exchange_versions).toHaveLength(1);
		});

		it('should parse version 1.0/1.1 with major 0x00 and minor 0x00', () => {
			const v = result.property_exchange_versions[0];
			expect(v.common_rules_version).toContain('1.0');
			expect(v.major_version).toBe('0x00');
			expect(v.minor_version).toBe('0x00');
		});
	});

	describe('Endpoint Info Status Values (Table 10)', () => {
		it('should have 2 status values', () => {
			expect(result.endpoint_info_status_values).toHaveLength(2);
		});

		it('should parse 0x00 as Product instance ID', () => {
			const pid = result.endpoint_info_status_values.find(e => e.status_value === '0x00');
			expect(pid).toBeDefined();
			expect(pid.target_property).toContain('Product instance ID');
		});
	});

	describe('Profile ID Formats (Table 19)', () => {
		it('should have 5 profile ID byte entries', () => {
			expect(result.profile_id_formats).toHaveLength(5);
		});

		it('should parse Byte 1 with 0x7E Standard Defined', () => {
			const byte1 = result.profile_id_formats.find(e => e.byte_name === 'Profile ID Byte 1');
			expect(byte1).toBeDefined();
			expect(byte1.standard_defined).toContain('0x7E');
			expect(byte1.manufacturer_specific).toContain('Manufacturer');
		});

		it('should parse Byte 2 as Profile Bank', () => {
			const byte2 = result.profile_id_formats.find(e => e.byte_name === 'Profile ID Byte 2');
			expect(byte2).toBeDefined();
			expect(byte2.standard_defined).toContain('Profile Bank');
		});
	});

	describe('Message Data Control Values (Table 44)', () => {
		it('should have 4 control values', () => {
			expect(result.message_data_control_values).toHaveLength(4);
		});

		it('should parse 0x00 as do not report', () => {
			const noReport = result.message_data_control_values.find(e => e.value === '0x00');
			expect(noReport).toBeDefined();
			expect(noReport.description).toContain('Do not report');
		});

		it('should parse 0x7F as full report', () => {
			const full = result.message_data_control_values.find(e => e.value === '0x7F');
			expect(full).toBeDefined();
			expect(full.description).toContain('Full report');
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.category_count).toBe(8);
			expect(result.summary.bitmap_allocation_count).toBe(7);
			expect(result.summary.ack_status_code_count).toBeGreaterThan(1);
			expect(result.summary.nak_status_code_count).toBeGreaterThan(5);
			expect(result.summary.property_exchange_version_count).toBe(1);
			expect(result.summary.endpoint_info_status_value_count).toBe(2);
			expect(result.summary.profile_id_format_count).toBe(5);
			expect(result.summary.message_data_control_value_count).toBe(4);
			expect(result.summary.message_format_count).toBeGreaterThan(300);
		});
	});
});
