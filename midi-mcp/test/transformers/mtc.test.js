import { describe, it, expect, beforeAll } from 'vitest';
import { transformMtc } from '../../lib/transformers/mtcTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp-004-008-v4-2-1-midi-time-code-specification-96-1-4.md');

let result;

beforeAll(async () => {
	result = await transformMtc(MARKDOWN_PATH);
});

describe('MTC Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toBe('MIDI Time Code');
			expect(result.metadata.doc_id).toBe('RP-004-008');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.version).toBe('4.2.1');
		});
	});

	describe('Quarter Frame Types', () => {
		it('should have 8 quarter frame types', () => {
			expect(result.quarter_frame_types).toHaveLength(8);
		});

		it('should parse type 0 as Frame count LS nibble', () => {
			const entry = result.quarter_frame_types.find(e => e.type === 0);
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Frame count LS nibble');
		});

		it('should parse type 7 as Hours count MS nibble and SMPTE Type', () => {
			const entry = result.quarter_frame_types.find(e => e.type === 7);
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Hours count MS nibble');
			expect(entry.description).toContain('SMPTE Type');
		});
	});

	describe('Bit Field Assignments', () => {
		it('should have 4 bit field assignments', () => {
			expect(result.bit_field_assignments).toHaveLength(4);
		});

		it('should parse FRAME COUNT', () => {
			const entry = result.bit_field_assignments.find(e => e.field === 'FRAME COUNT');
			expect(entry).toBeDefined();
			expect(entry.bit_pattern).toContain('yyyyy');
			expect(entry.bit_descriptions.length).toBeGreaterThan(0);
		});

		it('should parse HOURS COUNT', () => {
			const entry = result.bit_field_assignments.find(e => e.field === 'HOURS COUNT');
			expect(entry).toBeDefined();
			expect(entry.bit_pattern).toContain('zzzzz');
			expect(entry.bit_descriptions.length).toBeGreaterThan(0);
		});
	});

	describe('SMPTE Types', () => {
		it('should have 4 SMPTE types', () => {
			expect(result.smpte_types).toHaveLength(4);
		});

		it('should parse 24 Frames/Second', () => {
			const entry = result.smpte_types.find(e => e.description.includes('24 Frames'));
			expect(entry).toBeDefined();
		});

		it('should parse 25 Frames/Second', () => {
			const entry = result.smpte_types.find(e => e.description.includes('25 Frames'));
			expect(entry).toBeDefined();
		});

		it('should parse 30 Frames/Second Drop-Frame', () => {
			const entry = result.smpte_types.find(e => e.description.includes('30 Frames') && e.description.includes('Drop'));
			expect(entry).toBeDefined();
		});

		it('should parse 30 Frames/Second Non-Drop', () => {
			const entry = result.smpte_types.find(e => e.description.includes('30 Frames') && e.description.includes('Non-Drop'));
			expect(entry).toBeDefined();
		});
	});

	describe('Full Message', () => {
		it('should have a full message with format and byte count', () => {
			expect(result.full_message.format).toBeDefined();
			expect(result.full_message.byte_count).toBe(10);
		});

		it('should have 11 fields', () => {
			expect(result.full_message.fields).toHaveLength(11);
		});

		it('should include F0 7F header', () => {
			const entry = result.full_message.fields.find(e => e.byte === 'F0 7F');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Real Time Universal');
		});

		it('should include F7 EOX', () => {
			const entry = result.full_message.fields.find(e => e.byte === 'F7');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('EOX');
		});
	});

	describe('User Bits Message', () => {
		it('should have a user bits message with format and byte count', () => {
			expect(result.user_bits_message.format).toBeDefined();
			expect(result.user_bits_message.byte_count).toBe(15);
		});

		it('should have fields', () => {
			expect(result.user_bits_message.fields.length).toBeGreaterThan(5);
		});
	});

	describe('MTC Cueing Setup Types', () => {
		it('should have 15 setup types', () => {
			expect(result.mtc_cueing_setup_types).toHaveLength(15);
		});

		it('should parse 00 as Special', () => {
			const entry = result.mtc_cueing_setup_types.find(e => e.hex === '00');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Special');
		});

		it('should parse 01 as Punch In points', () => {
			const entry = result.mtc_cueing_setup_types.find(e => e.hex === '01');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Punch In');
		});

		it('should parse 0E as Event Name', () => {
			const entry = result.mtc_cueing_setup_types.find(e => e.hex === '0E');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Event Name');
		});
	});

	describe('Special Subtypes', () => {
		it('should have 16 special subtypes', () => {
			expect(result.special_subtypes).toHaveLength(16);
		});

		it('should parse 00 00 as Time Code Offset', () => {
			const entry = result.special_subtypes.find(e => e.hex === '00 00');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Time Code Offset');
			expect(entry.description.length).toBeGreaterThan(10);
		});

		it('should parse 01/02 as Punch In and Punch Out', () => {
			const entry = result.special_subtypes.find(e => e.hex === '01/02');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Punch In');
		});

		it('should parse 0E as Event Name in Additional Information', () => {
			const entry = result.special_subtypes.find(e => e.hex === '0E');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Event Name');
		});
	});

	describe('Realtime Cueing Setup Types', () => {
		it('should have 15 realtime setup types', () => {
			expect(result.realtime_cueing_setup_types).toHaveLength(15);
		});

		it('should parse 00 as Special', () => {
			const entry = result.realtime_cueing_setup_types.find(e => e.hex === '00');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Special');
		});

		it('should parse 03 as (Reserved)', () => {
			const entry = result.realtime_cueing_setup_types.find(e => e.hex === '03');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Reserved');
		});

		it('should parse 0E as Event Name', () => {
			const entry = result.realtime_cueing_setup_types.find(e => e.hex === '0E');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Event Name');
		});
	});

	describe('Signal Path Modes', () => {
		it('should have 4 modes', () => {
			expect(result.signal_path_modes).toHaveLength(4);
		});

		it('should parse PLAY MODE', () => {
			const entry = result.signal_path_modes.find(e => e.mode === 'PLAY MODE');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Master Time Code Source');
		});

		it('should parse FAST FORWARD/REWIND MODE', () => {
			const entry = result.signal_path_modes.find(e => e.mode === 'FAST FORWARD/REWIND MODE');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('high-speed wind');
		});

		it('should parse SHUTTLE MODE', () => {
			const entry = result.signal_path_modes.find(e => e.mode === 'SHUTTLE MODE');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Fast-Forward');
		});
	});

	describe('Quarter Frame Example', () => {
		it('should have 8 example messages', () => {
			expect(result.quarter_frame_example).toHaveLength(8);
		});

		it('should parse F1 00 as first message', () => {
			const entry = result.quarter_frame_example[0];
			expect(entry.message).toBe('F1 00');
		});

		it('should parse F1 76 with note', () => {
			const entry = result.quarter_frame_example.find(e => e.message === 'F1 76');
			expect(entry).toBeDefined();
			expect(entry.note).toContain('01H');
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.quarter_frame_type_count).toBe(8);
			expect(result.summary.bit_field_assignment_count).toBe(4);
			expect(result.summary.smpte_type_count).toBe(4);
			expect(result.summary.mtc_cueing_setup_type_count).toBe(15);
			expect(result.summary.special_subtype_count).toBe(16);
			expect(result.summary.realtime_cueing_setup_type_count).toBe(15);
			expect(result.summary.signal_path_mode_count).toBe(4);
			expect(result.summary.quarter_frame_example_count).toBe(8);
		});
	});
});
