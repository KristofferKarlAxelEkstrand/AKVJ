import { describe, it, expect, beforeAll } from 'vitest';
import { transformMsc } from '../../lib/transformers/mscTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp-002-014-v1-1-1-midi-show-control-specification-96-1-4.md');

let result;

beforeAll(async () => {
	result = await transformMsc(MARKDOWN_PATH);
});

describe('MSC Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata', () => {
			expect(result.metadata.title).toContain('MIDI Show Control');
			expect(result.metadata.doc_id).toBe('RP-002-014');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.version).toBe('1.1.1');
		});
	});

	describe('Device IDs', () => {
		it('should have 3 device IDs', () => {
			expect(result.device_ids).toHaveLength(3);
		});

		it('should parse 00-6F as Individual IDs', () => {
			const entry = result.device_ids.find(e => e.range === '00-6F');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('Individual IDs');
		});

		it('should parse 7F as All-call', () => {
			const entry = result.device_ids.find(e => e.range === '7F');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('All-call');
		});
	});

	describe('Command Formats', () => {
		it('should have 57 command formats', () => {
			expect(result.command_formats).toHaveLength(57);
		});

		it('should parse 01 as Lighting', () => {
			const entry = result.command_formats.find(e => e.hex === '01');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Lighting');
		});

		it('should parse 10 as Sound', () => {
			const entry = result.command_formats.find(e => e.hex === '10');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('Sound');
		});

		it('should parse 7F as All-types', () => {
			const entry = result.command_formats.find(e => e.hex === '7F');
			expect(entry).toBeDefined();
			expect(entry.name).toContain('All-types');
		});

		it('should not include page header entries', () => {
			result.command_formats.forEach(e => {
				expect(e.name).not.toContain('MIDI Show Control 1.1.1');
			});
		});
	});

	describe('General Commands', () => {
		it('should have 12 general commands', () => {
			expect(result.general_commands).toHaveLength(12);
		});

		it('should parse 01 as GO', () => {
			const entry = result.general_commands.find(e => e.hex === '01');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('GO');
			expect(entry.data_bytes).toBe('variable');
		});

		it('should parse 0A as RESET', () => {
			const entry = result.general_commands.find(e => e.hex === '0A');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('RESET');
		});
	});

	describe('Sound Commands', () => {
		it('should have 15 sound commands', () => {
			expect(result.sound_commands).toHaveLength(15);
		});

		it('should parse 10 as GO/JAM_CLOCK', () => {
			const entry = result.sound_commands.find(e => e.hex === '10');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('GO/JAM_CLOCK');
		});

		it('should parse 1E as CLOSE_CUE_PATH', () => {
			const entry = result.sound_commands.find(e => e.hex === '1E');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('CLOSE_CUE_PATH');
		});
	});

	describe('Two-Phase Commit Commands', () => {
		it('should have 7 two-phase commands', () => {
			expect(result.two_phase_commands).toHaveLength(7);
		});

		it('should parse 20 as STANDBY', () => {
			const entry = result.two_phase_commands.find(e => e.hex === '20');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('STANDBY');
		});

		it('should parse 26 as ABORT', () => {
			const entry = result.two_phase_commands.find(e => e.hex === '26');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('ABORT');
		});
	});

	describe('Command Descriptions', () => {
		it('should have command descriptions', () => {
			expect(result.command_descriptions.length).toBeGreaterThan(10);
		});

		it('should parse 01 GO with description', () => {
			const entry = result.command_descriptions.find(e => e.hex === '01' && e.name === 'GO');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('transition');
		});

		it('should parse 0A RESET with description', () => {
			const entry = result.command_descriptions.find(e => e.hex === '0A' && e.name === 'RESET');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('running cues');
		});
	});

	describe('Two-Phase Normal Sequence', () => {
		it('should have 4 messages', () => {
			expect(result.two_phase_normal_sequence).toHaveLength(4);
		});

		it('should parse 1st as STANDBY from controller', () => {
			const entry = result.two_phase_normal_sequence.find(e => e.order === '1st');
			expect(entry).toBeDefined();
			expect(entry.message).toBe('STANDBY');
			expect(entry.sender).toBe('controller');
		});

		it('should parse 4th as COMPLETE from controlled device', () => {
			const entry = result.two_phase_normal_sequence.find(e => e.order === '4th');
			expect(entry).toBeDefined();
			expect(entry.message).toBe('COMPLETE');
			expect(entry.sender).toBe('controlled device');
		});
	});

	describe('Two-Phase Exception Sequence', () => {
		it('should have 3 messages', () => {
			expect(result.two_phase_exception_sequence).toHaveLength(3);
		});

		it('should include ABORT, CANCEL, and CANCELLED', () => {
			const messages = result.two_phase_exception_sequence.map(e => e.message);
			expect(messages).toContain('ABORT');
			expect(messages).toContain('CANCEL');
			expect(messages).toContain('CANCELLED');
		});
	});

	describe('Status Code Ranges', () => {
		it('should have 4 ranges', () => {
			expect(result.status_code_ranges).toHaveLength(4);
		});

		it('should parse 00 00 as undefined status code', () => {
			const entry = result.status_code_ranges.find(e => e.hex_range === '00 00');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('undefined');
		});
	});

	describe('CANCELLED Status Codes', () => {
		it('should have 6 status codes', () => {
			expect(result.cancelled_status_codes).toHaveLength(6);
		});

		it('should parse 80 04 as completing', () => {
			const entry = result.cancelled_status_codes.find(e => e.hex === '80 04');
			expect(entry).toBeDefined();
			expect(entry.description).toBe('completing');
		});
	});

	describe('ABORT Status Codes', () => {
		it('should have 20 status codes', () => {
			expect(result.abort_status_codes).toHaveLength(20);
		});

		it('should parse 00 00 as unknown/undefined error', () => {
			const entry = result.abort_status_codes.find(e => e.hex === '00 00');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('unknown');
		});

		it('should parse 80 60 as cue out of sequence', () => {
			const entry = result.abort_status_codes.find(e => e.hex === '80 60');
			expect(entry).toBeDefined();
			expect(entry.description).toContain('cue out of sequence');
		});
	});

	describe('Command Format Status Codes', () => {
		it('should have 7 command format groups', () => {
			expect(result.command_format_status_codes).toHaveLength(7);
		});

		it('should have lighting group with codes', () => {
			const lighting = result.command_format_status_codes.find(g => g.command_format_range.includes('lighting'));
			expect(lighting).toBeDefined();
			expect(lighting.codes.length).toBeGreaterThan(0);
		});

		it('should have pyrotechnics group with codes', () => {
			const pyro = result.command_format_status_codes.find(g => g.command_format_range.includes('pyrotechnics'));
			expect(pyro).toBeDefined();
			expect(pyro.codes.length).toBeGreaterThan(0);
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.device_id_count).toBe(3);
			expect(result.summary.command_format_count).toBe(57);
			expect(result.summary.general_command_count).toBe(12);
			expect(result.summary.sound_command_count).toBe(15);
			expect(result.summary.two_phase_command_count).toBe(7);
			expect(result.summary.command_description_count).toBeGreaterThan(10);
			expect(result.summary.two_phase_normal_sequence_count).toBe(4);
			expect(result.summary.two_phase_exception_sequence_count).toBe(3);
			expect(result.summary.status_code_range_count).toBe(4);
			expect(result.summary.cancelled_status_code_count).toBe(6);
			expect(result.summary.abort_status_code_count).toBe(20);
			expect(result.summary.command_format_status_code_count).toBe(7);
		});
	});
});
