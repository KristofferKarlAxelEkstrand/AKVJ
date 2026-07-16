import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa18 } from '../../lib/transformers/ca18Transformer.js';

describe('CA-018 File Reference SysEx Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca18.md');
		result = await transformCa18(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('File Reference System Exclusive Message');
		expect(result.metadata.doc_id).toBe('CA-018');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('ca18.md');
	});

	it('should extract the general message format', () => {
		expect(result.general_format).toBe('F0 7E <device ID> 0B <sub-ID#2> <ctx> <len> <data> F7');
	});

	describe('Command codes', () => {
		it('should have 6 command codes', () => {
			expect(result.command_codes).toHaveLength(6);
		});

		it('should parse 00 as reserved', () => {
			const cc = result.command_codes.find(c => c.code === '00');
			expect(cc).toBeDefined();
			expect(cc.description).toBe('reserved');
			expect(cc.code_range_end).toBeUndefined();
		});

		it('should parse 01 as Open file', () => {
			const cc = result.command_codes.find(c => c.code === '01');
			expect(cc).toBeDefined();
			expect(cc.description).toBe('Open file');
		});

		it('should parse 02 as Select or reselect contents', () => {
			const cc = result.command_codes.find(c => c.code === '02');
			expect(cc).toBeDefined();
			expect(cc.description).toBe('Select or reselect contents');
		});

		it('should parse 03 as Open file and select contents', () => {
			const cc = result.command_codes.find(c => c.code === '03');
			expect(cc).toBeDefined();
			expect(cc.description).toBe('Open file and select contents');
		});

		it('should parse 04 as Close file', () => {
			const cc = result.command_codes.find(c => c.code === '04');
			expect(cc).toBeDefined();
			expect(cc.description).toBe('Close file');
		});

		it('should parse 05 to 7F as reserved range', () => {
			const cc = result.command_codes.find(c => c.code === '05');
			expect(cc).toBeDefined();
			expect(cc.description).toBe('reserved');
			expect(cc.code_range_end).toBe('7F');
		});
	});

	describe('File types', () => {
		it('should have 3 file types', () => {
			expect(result.file_types).toHaveLength(3);
		});

		it('should parse DLS file type with uppercase and lowercase variants', () => {
			const dls = result.file_types.find(f => f.type === 'DLS');
			expect(dls).toBeDefined();
			expect(dls.ascii_uppercase).toBe('"DLS "');
			expect(dls.hex_uppercase).toBe('44 4C 53 20');
			expect(dls.ascii_lowercase).toBe('"dls "');
			expect(dls.hex_lowercase).toBe('64 6C 73 20');
			expect(dls.description).toContain('DLS format files');
			expect(dls.description).toContain('DLS Level 1');
		});

		it('should parse SF2 file type with uppercase and lowercase variants', () => {
			const sf2 = result.file_types.find(f => f.type === 'SF2');
			expect(sf2).toBeDefined();
			expect(sf2.ascii_uppercase).toBe('"SF2 "');
			expect(sf2.hex_uppercase).toBe('53 46 32 20');
			expect(sf2.ascii_lowercase).toBe('"sf2 "');
			expect(sf2.hex_lowercase).toBe('73 66 32 20');
			expect(sf2.description).toContain('SoundFont format files');
			expect(sf2.description).toContain('SoundFont 2');
		});

		it('should parse WAV file type with uppercase and lowercase variants', () => {
			const wav = result.file_types.find(f => f.type === 'WAV');
			expect(wav).toBeDefined();
			expect(wav.ascii_uppercase).toBe('"WAV "');
			expect(wav.hex_uppercase).toBe('57 41 56 20');
			expect(wav.ascii_lowercase).toBe('"wav "');
			expect(wav.hex_lowercase).toBe('77 61 76 20');
			expect(wav.description).toContain('Microsoft Wave');
			expect(wav.description).toContain('WAV');
		});
	});

	describe('Messages', () => {
		it('should have 4 messages', () => {
			expect(result.messages).toHaveLength(4);
		});

		it('should parse OPEN FILE message with format', () => {
			const msg = result.messages.find(m => m.name === 'OPEN FILE');
			expect(msg).toBeDefined();
			expect(msg.format).toBe('F0 7E <device ID> 0B 01 <ctx> <len> <type> <url> F7');
		});

		it('should parse SELECT CONTENTS message with format', () => {
			const msg = result.messages.find(m => m.name === 'SELECT CONTENTS');
			expect(msg).toBeDefined();
			expect(msg.format).toContain('F0 7E <device ID> 0B 02');
			expect(msg.format).toContain('<ctx>');
			expect(msg.format).toContain('<count>');
			expect(msg.format).toContain('F7');
		});

		it('should parse OPEN FILE AND SELECT CONTENTS message with format', () => {
			const msg = result.messages.find(m => m.name === 'OPEN FILE AND SELECT CONTENTS');
			expect(msg).toBeDefined();
			expect(msg.format).toBe('F0 7E <device ID> 0B 03 <ctx> <len> <type> <url> <select data> F7');
		});

		it('should parse CLOSE FILE message with format', () => {
			const msg = result.messages.find(m => m.name === 'CLOSE FILE');
			expect(msg).toBeDefined();
			expect(msg.format).toBe('F0 7E <device ID> 0B 04 <ctx> 00 00 F7');
		});

		it('should have all messages with name and format', () => {
			for (const msg of result.messages) {
				expect(msg.name).toBeTruthy();
				expect(msg.format).toBeTruthy();
				expect(msg.format).toMatch(/^F0.*F7$/);
			}
		});
	});

	describe('Flag bits', () => {
		it('should have 3 flag bit entries', () => {
			expect(result.flag_bits).toHaveLength(3);
		});

		it('should parse bit 0 as Source Drum flag', () => {
			const bit0 = result.flag_bits.find(f => f.bit === 0);
			expect(bit0).toBeDefined();
			expect(bit0.description).toContain('Source Drum flag');
			expect(bit0.bit_range_end).toBeUndefined();
		});

		it('should parse bit 1 as Destination Drum flag', () => {
			const bit1 = result.flag_bits.find(f => f.bit === 1);
			expect(bit1).toBeDefined();
			expect(bit1.description).toContain('Destination Drum flag');
			expect(bit1.bit_range_end).toBeUndefined();
		});

		it('should parse bits 2-6 as Reserved', () => {
			const bit2 = result.flag_bits.find(f => f.bit === 2);
			expect(bit2).toBeDefined();
			expect(bit2.bit_range_end).toBe(6);
			expect(bit2.description).toContain('Reserved');
			expect(bit2.description).toContain('zero');
		});
	});

	describe('Fine tuning table', () => {
		it('should have 3 fine tuning entries', () => {
			expect(result.fine_tuning_table).toHaveLength(3);
		});

		it('should parse 00 00 as -100.0 cents', () => {
			const entry = result.fine_tuning_table[0];
			expect(entry.lsb).toBe('00');
			expect(entry.msb).toBe('00');
			expect(entry.tuning_offset).toBe('-100.0 cents');
		});

		it('should parse 00 40 as 0.0 cents (center)', () => {
			const entry = result.fine_tuning_table[1];
			expect(entry.lsb).toBe('00');
			expect(entry.msb).toBe('40');
			expect(entry.tuning_offset).toBe('0.0 cents');
		});

		it('should parse 7F 7F as +100.0 cents (maximum)', () => {
			const entry = result.fine_tuning_table[2];
			expect(entry.lsb).toBe('7F');
			expect(entry.msb).toBe('7F');
			expect(entry.tuning_offset).toBe('+100.0 cents');
		});
	});

	describe('Data integrity', () => {
		it('should not have any hallucinated or dropped data', () => {
			expect(result.command_codes).toHaveLength(6);
			expect(result.file_types).toHaveLength(3);
			expect(result.messages).toHaveLength(4);
			expect(result.flag_bits).toHaveLength(3);
			expect(result.fine_tuning_table).toHaveLength(3);
			expect(result.general_format).toBeTruthy();
		});
	});
});
