import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformStatusBytes } from '../../lib/transformers/statusBytesTransformer.js';

describe('Status Bytes Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../reference/status-bytes.md');
		result = await transformStatusBytes(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI 1.0 Status Byte Quick Reference');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('status-bytes.md');
	});

	it('should have 3 categories', () => {
		expect(result.categories).toHaveLength(3);
	});

	describe('Category: Channel Voice Messages', () => {
		const category = () => result.categories[0];

		it('should have correct name and description', () => {
			expect(category().name).toBe('channel_voice');
			expect(category().description).toBe('Channel Voice Messages');
		});

		it('should have 8 messages', () => {
			expect(category().messages).toHaveLength(8);
		});

		it('should parse 0x8n (Note Off) as first entry', () => {
			const msg = category().messages[0];
			expect(msg.status).toBe('0x8n');
			expect(msg.message).toBe('Note Off');
			expect(msg.total_bytes).toBe(3);
			expect(msg.data_byte_1).toBe('Note number (0–127)');
			expect(msg.data_byte_2).toBe('Release velocity');
		});

		it('should parse 0x9n (Note On)', () => {
			const msg = category().messages.find(m => m.status === '0x9n');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Note On');
			expect(msg.total_bytes).toBe(3);
			expect(msg.data_byte_2).toBe('Velocity (0 = Note Off)');
		});

		it('should parse 0xAn (Polyphonic Key Pressure)', () => {
			const msg = category().messages.find(m => m.status === '0xAn');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Polyphonic Key Pressure');
			expect(msg.total_bytes).toBe(3);
		});

		it('should parse 0xBn (Control Change) and 0xBn (Channel Mode) as separate entries', () => {
			const ccMsg = category().messages.find(m => m.status === '0xBn' && m.message === 'Control Change');
			const modeMsg = category().messages.find(m => m.status === '0xBn' && m.message === 'Channel Mode (CC 120–127)');
			expect(ccMsg).toBeDefined();
			expect(modeMsg).toBeDefined();
			expect(ccMsg.data_byte_1).toBe('Controller (0–119)');
			expect(modeMsg.data_byte_1).toBe('Controller (120–127)');
		});

		it('should parse 0xCn (Program Change) with 2 total bytes', () => {
			const msg = category().messages.find(m => m.status === '0xCn');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Program Change');
			expect(msg.total_bytes).toBe(2);
			expect(msg.data_byte_1).toBe('Program number');
			expect(msg.data_byte_2).toBe('—');
		});

		it('should parse 0xDn (Channel Pressure) with 2 total bytes', () => {
			const msg = category().messages.find(m => m.status === '0xDn');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Channel Pressure');
			expect(msg.total_bytes).toBe(2);
		});

		it('should parse 0xEn (Pitch Bend) with LSB/MSB data bytes', () => {
			const msg = category().messages.find(m => m.status === '0xEn');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Pitch Bend');
			expect(msg.total_bytes).toBe(3);
			expect(msg.data_byte_1).toBe('LSB');
			expect(msg.data_byte_2).toContain('MSB');
			expect(msg.data_byte_2).toContain('8192');
		});

		it('should have all entries with data_byte_1 and data_byte_2 fields', () => {
			for (const msg of category().messages) {
				expect(msg.status).toBeDefined();
				expect(msg.message).toBeDefined();
				expect(msg.data_byte_1).toBeDefined();
				expect(msg.data_byte_2).toBeDefined();
				expect(msg.notes).toBeUndefined();
				expect(msg.data).toBeUndefined();
			}
		});
	});

	describe('Category: System Common Messages', () => {
		const category = () => result.categories[1];

		it('should have correct name and description', () => {
			expect(category().name).toBe('system_common');
			expect(category().description).toBe('System Common Messages');
		});

		it('should have 8 messages', () => {
			expect(category().messages).toHaveLength(8);
		});

		it('should parse 0xF0 (System Exclusive start) with variable total_bytes', () => {
			const msg = category().messages.find(m => m.status === '0xF0');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('System Exclusive start');
			expect(msg.total_bytes).toBe('variable');
			expect(msg.data).toContain('Manufacturer ID');
			expect(msg.data).toContain('0xF7');
		});

		it('should parse 0xF1 (MTC Quarter Frame) with 2 total bytes', () => {
			const msg = category().messages.find(m => m.status === '0xF1');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('MTC Quarter Frame');
			expect(msg.total_bytes).toBe(2);
			expect(msg.data).toBe('Time code nibble');
		});

		it('should parse 0xF2 (Song Position Pointer) with 3 total bytes', () => {
			const msg = category().messages.find(m => m.status === '0xF2');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Song Position Pointer');
			expect(msg.total_bytes).toBe(3);
		});

		it('should parse 0xF4 and 0xF5 as undefined/reserved with null total_bytes', () => {
			const f4 = category().messages.find(m => m.status === '0xF4');
			const f5 = category().messages.find(m => m.status === '0xF5');
			expect(f4).toBeDefined();
			expect(f4.message).toBe('(undefined/reserved)');
			expect(f4.total_bytes).toBeNull();
			expect(f4.data).toBe('Invalid');
			expect(f5).toBeDefined();
			expect(f5.message).toBe('(undefined/reserved)');
			expect(f5.total_bytes).toBeNull();
		});

		it('should parse 0xF6 (Tune Request) with 1 total byte', () => {
			const msg = category().messages.find(m => m.status === '0xF6');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Tune Request');
			expect(msg.total_bytes).toBe(1);
		});

		it('should parse 0xF7 (End of Exclusive)', () => {
			const msg = category().messages.find(m => m.status === '0xF7');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('End of Exclusive (EOX)');
			expect(msg.total_bytes).toBe(1);
			expect(msg.data).toBe('Terminates SysEx');
		});

		it('should have all entries with data field and no data_byte fields', () => {
			for (const msg of category().messages) {
				expect(msg.status).toBeDefined();
				expect(msg.message).toBeDefined();
				expect(msg.data).toBeDefined();
				expect(msg.data_byte_1).toBeUndefined();
				expect(msg.data_byte_2).toBeUndefined();
				expect(msg.notes).toBeUndefined();
			}
		});
	});

	describe('Category: System Real-Time Messages', () => {
		const category = () => result.categories[2];

		it('should have correct name and description', () => {
			expect(category().name).toBe('system_real_time');
			expect(category().description).toBe('System Real-Time Messages');
		});

		it('should have 8 messages', () => {
			expect(category().messages).toHaveLength(8);
		});

		it('should parse 0xF8 (Timing Clock)', () => {
			const msg = category().messages[0];
			expect(msg.status).toBe('0xF8');
			expect(msg.message).toBe('Timing Clock');
			expect(msg.notes).toContain('24 pulses per quarter note');
		});

		it('should parse 0xFA (Start), 0xFB (Continue), 0xFC (Stop)', () => {
			const start = category().messages.find(m => m.status === '0xFA');
			const cont = category().messages.find(m => m.status === '0xFB');
			const stop = category().messages.find(m => m.status === '0xFC');
			expect(start).toBeDefined();
			expect(start.message).toBe('Start');
			expect(start.notes).toContain('Play from the beginning');
			expect(cont).toBeDefined();
			expect(cont.message).toBe('Continue');
			expect(cont.notes).toContain('Resume');
			expect(stop).toBeDefined();
			expect(stop.message).toBe('Stop');
			expect(stop.notes).toContain('Halt playback');
		});

		it('should parse 0xF9 and 0xFD as undefined/reserved', () => {
			const f9 = category().messages.find(m => m.status === '0xF9');
			const fd = category().messages.find(m => m.status === '0xFD');
			expect(f9).toBeDefined();
			expect(f9.message).toBe('(undefined/reserved)');
			expect(f9.notes).toBe('Invalid');
			expect(fd).toBeDefined();
			expect(fd.message).toBe('(undefined/reserved)');
			expect(fd.notes).toBe('Invalid');
		});

		it('should parse 0xFE (Active Sensing)', () => {
			const msg = category().messages.find(m => m.status === '0xFE');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Active Sensing');
			expect(msg.notes).toContain('300ms heartbeat');
		});

		it('should parse 0xFF (System Reset) as last entry', () => {
			const msg = category().messages[7];
			expect(msg.status).toBe('0xFF');
			expect(msg.message).toBe('System Reset');
			expect(msg.notes).toContain('power-up state');
		});

		it('should have all entries with notes field and no data_byte fields', () => {
			for (const msg of category().messages) {
				expect(msg.status).toBeDefined();
				expect(msg.message).toBeDefined();
				expect(msg.notes).toBeDefined();
				expect(msg.total_bytes).toBeUndefined();
				expect(msg.data_byte_1).toBeUndefined();
				expect(msg.data_byte_2).toBeUndefined();
				expect(msg.data).toBeUndefined();
			}
		});
	});

	describe('Parsing Rules', () => {
		it('should have 3 parsing rules', () => {
			expect(result.parsing_rules).toHaveLength(3);
		});

		it('should include running status rule', () => {
			expect(result.parsing_rules[0]).toContain('Running status');
			expect(result.parsing_rules[0]).toContain('channel-message status byte');
		});

		it('should include System Real-Time interruption rule', () => {
			expect(result.parsing_rules[1]).toContain('System Real-Time bytes');
			expect(result.parsing_rules[1]).toContain('0xF8');
		});

		it('should include orphan data bytes rule', () => {
			expect(result.parsing_rules[2]).toContain('Data bytes');
			expect(result.parsing_rules[2]).toContain('ignored');
		});
	});

	describe('Data integrity', () => {
		it('should not have any hallucinated or dropped data', () => {
			expect(result.categories).toHaveLength(3);
			expect(result.parsing_rules).toHaveLength(3);

			for (const category of result.categories) {
				expect(category.name).toBeTruthy();
				expect(category.description).toBeTruthy();
				expect(category.messages.length).toBeGreaterThan(0);

				for (const msg of category.messages) {
					expect(msg.status).toMatch(/^0x[0-9A-Fa-f]/);
					expect(msg.message).toBeTruthy();
				}
			}
		});

		it('should have 24 total messages across all categories', () => {
			const total = result.categories.reduce((sum, c) => sum + c.messages.length, 0);
			expect(total).toBe(24);
		});
	});
});
