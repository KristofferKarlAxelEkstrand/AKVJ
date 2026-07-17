import { describe, it, expect, beforeAll } from 'vitest';
import { transformPropertyExchange } from '../../lib/transformers/propertyExchangeTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/m2-103-um-common-rules-for-midi-ci-property-exchange.md');

let result;

beforeAll(async () => {
	result = await transformPropertyExchange(MARKDOWN_PATH);
});

describe('Property Exchange Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toBe('Common Rules for MIDI-CI Property Exchange');
			expect(result.metadata.doc_id).toBe('M2-103-UM');
			expect(result.metadata.protocol).toBe('midi2');
			expect(result.metadata.version).toBe('1.2');
		});
	});

	describe('PE Message Format (Table 4)', () => {
		it('should have format fields', () => {
			expect(result.pe_message_format.length).toBeGreaterThan(10);
		});

		it('should parse F0 as System Exclusive Start', () => {
			const f0 = result.pe_message_format.find(e => e.value === 'F0');
			expect(f0).toBeDefined();
			expect(f0.parameter).toContain('System Exclusive Start');
		});

		it('should parse 0D as MIDI-CI Sub-ID#1', () => {
			const od = result.pe_message_format.find(e => e.value === '0D');
			expect(od).toBeDefined();
			expect(od.parameter).toContain('MIDI-CI');
		});

		it('should parse F7 as End Universal System Exclusive', () => {
			const f7 = result.pe_message_format.find(e => e.value === 'F7');
			expect(f7).toBeDefined();
			expect(f7.parameter).toContain('End');
		});
	});

	describe('PE Messages (Table 11)', () => {
		it('should have 11 PE messages', () => {
			expect(result.pe_messages).toHaveLength(11);
		});

		it('should parse 0x30 as Inquiry: Property Exchange Capabilities', () => {
			const msg = result.pe_messages.find(e => e.sub_id_2 === '0x30');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Inquiry: Property Exchange Capabilities');
		});

		it('should parse 0x34 as Inquiry: Get Property Data', () => {
			const msg = result.pe_messages.find(e => e.sub_id_2 === '0x34');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Inquiry: Get Property Data');
		});

		it('should parse 0x36 as Inquiry: Set Property Data', () => {
			const msg = result.pe_messages.find(e => e.sub_id_2 === '0x36');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Inquiry: Set Property Data');
		});

		it('should parse 0x38 as Subscription', () => {
			const msg = result.pe_messages.find(e => e.sub_id_2 === '0x38');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Subscription');
		});

		it('should parse 0x3F as Notify Message', () => {
			const msg = result.pe_messages.find(e => e.sub_id_2 === '0x3F');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Notify Message');
		});
	});

	describe('Encoding Types (Table 12)', () => {
		it('should have 3 encoding types', () => {
			expect(result.encoding_types).toHaveLength(3);
		});

		it('should parse ASCII as uncompressed', () => {
			const ascii = result.encoding_types.find(e => e.property_value === 'ASCII');
			expect(ascii).toBeDefined();
			expect(ascii.description).toContain('Uncompressed');
		});

		it('should parse Mcoded7', () => {
			const mcoded = result.encoding_types.find(e => e.property_value === 'Mcoded7');
			expect(mcoded).toBeDefined();
			expect(mcoded.description).toContain('Mcoded7');
		});

		it('should parse zlib+Mcoded7', () => {
			const zlib = result.encoding_types.find(e => e.property_value === 'zlib+Mcoded7');
			expect(zlib).toBeDefined();
			expect(zlib.description).toContain('zlib');
		});
	});

	describe('Property Definitions', () => {
		it('should have property definitions from multiple tables', () => {
			expect(result.property_definitions.length).toBeGreaterThan(15);
		});

		it('should include table_number for each entry', () => {
			result.property_definitions.forEach(e => {
				expect(e.table_number).toBeDefined();
				expect(typeof e.table_number).toBe('number');
			});
		});

		it('should parse resource from Table 13', () => {
			const resource = result.property_definitions.find(e => e.property_key === 'resource' && e.table_number === 13);
			expect(resource).toBeDefined();
			expect(resource.value_type).toContain('string');
			expect(resource.description).toContain('targeted Resource');
		});

		it('should parse status from Table 14', () => {
			const status = result.property_definitions.find(e => e.property_key === 'status' && e.table_number === 14);
			expect(status).toBeDefined();
			expect(status.value_type).toContain('number');
		});

		it('should parse mediaType from Table 16', () => {
			const mediaType = result.property_definitions.find(e => e.property_key === 'mediaType' && e.table_number === 16);
			expect(mediaType).toBeDefined();
			expect(mediaType.value_type).toContain('string');
		});

		it('should parse subscribeId from Table 39', () => {
			const subId = result.property_definitions.find(e => e.property_key === 'subscribeId' && e.table_number === 39);
			expect(subId).toBeDefined();
			expect(subId.value_type).toContain('string');
		});

		it('should parse properties from Table 64 (Link Properties)', () => {
			const linkProps = result.property_definitions.filter(e => e.table_number === 64);
			expect(linkProps.length).toBeGreaterThan(2);
		});
	});

	describe('Reply Status Codes (Table 15)', () => {
		it('should have 19 status codes', () => {
			expect(result.reply_status_codes).toHaveLength(19);
		});

		it('should parse 200 as Success/Ok', () => {
			const ok = result.reply_status_codes.find(e => e.value === '200');
			expect(ok).toBeDefined();
			expect(ok.description).toContain('Success');
		});

		it('should parse 404 as Resource Not Supported', () => {
			const notFound = result.reply_status_codes.find(e => e.value === '404');
			expect(notFound).toBeDefined();
			expect(notFound.description).toContain('Resource Not Supported');
		});

		it('should parse 500 as Internal Device Error', () => {
			const serverError = result.reply_status_codes.find(e => e.value === '500');
			expect(serverError).toBeDefined();
			expect(serverError.description).toContain('Internal Device Error');
		});

		it('should parse range 200-299 as Success Messages', () => {
			const range = result.reply_status_codes.find(e => e.value === '200-299');
			expect(range).toBeDefined();
			expect(range.description).toContain('Success');
		});
	});

	describe('Transaction Examples', () => {
		it('should have transaction examples', () => {
			expect(result.transaction_examples.length).toBeGreaterThan(50);
		});

		it('should include table_number for each entry', () => {
			result.transaction_examples.forEach(e => {
				expect(e.table_number).toBeDefined();
			});
		});

		it('should have Header Data and Property Data fields', () => {
			const fields = new Set(result.transaction_examples.map(e => e.field));
			expect(fields.has('Header Data')).toBe(true);
			expect(fields.has('Property Data')).toBe(true);
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.pe_message_format_field_count).toBeGreaterThan(10);
			expect(result.summary.pe_message_count).toBe(11);
			expect(result.summary.encoding_type_count).toBe(3);
			expect(result.summary.property_definition_count).toBeGreaterThan(15);
			expect(result.summary.reply_status_code_count).toBe(19);
			expect(result.summary.transaction_example_count).toBeGreaterThan(50);
		});
	});
});
