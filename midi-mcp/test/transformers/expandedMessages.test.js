import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformExpandedMessages } from '../../lib/transformers/expandedMessagesTransformer.js';

describe('Expanded MIDI 1.0 Messages List Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/expanded-midi-1-0-messages-list-midi-org.md');
		result = await transformExpandedMessages(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('EXPANDED MIDI 1.0 MESSAGES LIST');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('expanded-midi-1-0-messages-list-midi-org.md');
	});

	it('should have 128 total messages', () => {
		expect(result.messages).toHaveLength(128);
		expect(result.summary.total_messages).toBe(128);
	});

	it('should have 112 channel voice messages', () => {
		expect(result.summary.channel_voice_count).toBe(112);
	});

	it('should have 16 system messages', () => {
		expect(result.summary.system_count).toBe(16);
	});

	it('should include the SysEx note', () => {
		expect(result.sysex_note).toContain('System Exclusive');
		expect(result.sysex_note).toContain('Vendor ID');
		expect(result.sysex_note).toContain('EOX');
	});

	describe('Channel voice messages — Note Off (80-8F)', () => {
		it('should parse 80 (Chan 1 Note Off)', () => {
			const msg = result.messages.find(m => m.hex === '80');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('10000000');
			expect(msg.decimal).toBe(128);
			expect(msg.function).toBe('Chan 1 Note off');
			expect(msg.category).toBe('channel_voice');
			expect(msg.message_type).toBe('Note off');
			expect(msg.channel).toBe(1);
			expect(msg.data_byte_1).toBe('Note Number (0-127)');
			expect(msg.data_byte_2).toBe('Note Velocity (0-127)');
		});

		it('should parse 8F (Chan 16 Note Off)', () => {
			const msg = result.messages.find(m => m.hex === '8F');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(143);
			expect(msg.channel).toBe(16);
			expect(msg.message_type).toBe('Note off');
		});

		it('should have all 16 Note Off entries', () => {
			const noteOff = result.messages.filter(m => m.message_type === 'Note off');
			expect(noteOff).toHaveLength(16);
		});
	});

	describe('Channel voice messages — Note On (90-9F)', () => {
		it('should parse 90 (Chan 1 Note On)', () => {
			const msg = result.messages.find(m => m.hex === '90');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('10010000');
			expect(msg.decimal).toBe(144);
			expect(msg.function).toBe('Chan 1 Note on');
			expect(msg.message_type).toBe('Note on');
			expect(msg.channel).toBe(1);
		});

		it('should parse 9F (Chan 16 Note On)', () => {
			const msg = result.messages.find(m => m.hex === '9F');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(159);
			expect(msg.channel).toBe(16);
		});

		it('should have all 16 Note On entries', () => {
			const noteOn = result.messages.filter(m => m.message_type === 'Note on');
			expect(noteOn).toHaveLength(16);
		});
	});

	describe('Channel voice messages — Polyphonic Aftertouch (A0-AF)', () => {
		it('should parse A0 (Chan 1 Poly Aftertouch)', () => {
			const msg = result.messages.find(m => m.hex === 'A0');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('10100000');
			expect(msg.decimal).toBe(160);
			expect(msg.message_type).toBe('Polyphonic Aftertouch');
			expect(msg.channel).toBe(1);
		});

		it('should have all 16 Poly Aftertouch entries', () => {
			const poly = result.messages.filter(m => m.message_type === 'Polyphonic Aftertouch');
			expect(poly).toHaveLength(16);
		});
	});

	describe('Channel voice messages — Control/Mode Change (B0-BF)', () => {
		it('should parse B0 (Chan 1 CC)', () => {
			const msg = result.messages.find(m => m.hex === 'B0');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('10110000');
			expect(msg.decimal).toBe(176);
			expect(msg.message_type).toBe('Control/Mode Change');
			expect(msg.data_byte_1).toBe('see Table 3');
			expect(msg.data_byte_2).toBe('see Table 3');
		});

		it('should have all 16 CC entries', () => {
			const cc = result.messages.filter(m => m.message_type === 'Control/Mode Change');
			expect(cc).toHaveLength(16);
		});
	});

	describe('Channel voice messages — Program Change (C0-CF)', () => {
		it('should parse C0 (Chan 1 Program Change)', () => {
			const msg = result.messages.find(m => m.hex === 'C0');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('11000000');
			expect(msg.decimal).toBe(192);
			expect(msg.message_type).toBe('Program Change');
			expect(msg.data_byte_1).toBe('Program # (0-127)');
			expect(msg.data_byte_2).toBe('none');
		});

		it('should have all 16 Program Change entries', () => {
			const pc = result.messages.filter(m => m.message_type === 'Program Change');
			expect(pc).toHaveLength(16);
		});
	});

	describe('Channel voice messages — Channel Aftertouch (D0-DF)', () => {
		it('should parse D0 (Chan 1 Channel Aftertouch)', () => {
			const msg = result.messages.find(m => m.hex === 'D0');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('11010000');
			expect(msg.decimal).toBe(208);
			expect(msg.message_type).toBe('Channel Aftertouch');
			expect(msg.data_byte_1).toBe('Pressure (0-127)');
			expect(msg.data_byte_2).toBe('none');
		});

		it('should have all 16 Channel Aftertouch entries', () => {
			const ca = result.messages.filter(m => m.message_type === 'Channel Aftertouch');
			expect(ca).toHaveLength(16);
		});
	});

	describe('Channel voice messages — Pitch Bend (E0-EF)', () => {
		it('should parse E0 (Chan 1 Pitch Bend)', () => {
			const msg = result.messages.find(m => m.hex === 'E0');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('11100000');
			expect(msg.decimal).toBe(224);
			expect(msg.message_type).toBe('Pitch Bend Change');
			expect(msg.data_byte_1).toBe('Pitch Bender LSB (0-127)');
			expect(msg.data_byte_2).toBe('Pitch Bender MSB (0-127)');
		});

		it('should parse EF (Chan 16 Pitch Bend)', () => {
			const msg = result.messages.find(m => m.hex === 'EF');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(239);
			expect(msg.channel).toBe(16);
		});

		it('should have all 16 Pitch Bend entries', () => {
			const pb = result.messages.filter(m => m.message_type === 'Pitch Bend Change');
			expect(pb).toHaveLength(16);
		});
	});

	describe('System messages (F0-FF)', () => {
		it('should parse F0 (System Exclusive)', () => {
			const msg = result.messages.find(m => m.hex === 'F0');
			expect(msg).toBeDefined();
			expect(msg.binary).toBe('11110000');
			expect(msg.decimal).toBe(240);
			expect(msg.category).toBe('system');
			expect(msg.message_type).toBe('System Exclusive');
			expect(msg.data_byte_1).toBe('**');
			expect(msg.data_byte_2).toBe('**');
			expect(msg.channel).toBeUndefined();
		});

		it('should parse F1 (MIDI Time Code Qtr Frame)', () => {
			const msg = result.messages.find(m => m.hex === 'F1');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(241);
			expect(msg.message_type).toBe('MIDI Time Code Qtr. Frame');
			expect(msg.data_byte_1).toBe('-see spec-');
		});

		it('should parse F2 (Song Position Pointer)', () => {
			const msg = result.messages.find(m => m.hex === 'F2');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(242);
			expect(msg.message_type).toBe('Song Position Pointer');
			expect(msg.data_byte_1).toBe('LSB');
			expect(msg.data_byte_2).toBe('MSB');
		});

		it('should parse F3 (Song Select)', () => {
			const msg = result.messages.find(m => m.hex === 'F3');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(243);
			expect(msg.message_type).toBe('Song Select (Song #)');
		});

		it('should parse F4 and F5 as Undefined (Reserved)', () => {
			const f4 = result.messages.find(m => m.hex === 'F4');
			const f5 = result.messages.find(m => m.hex === 'F5');
			expect(f4).toBeDefined();
			expect(f4.message_type).toBe('Undefined (Reserved)');
			expect(f4.data_byte_1).toBe('—');
			expect(f5).toBeDefined();
			expect(f5.message_type).toBe('Undefined (Reserved)');
		});

		it('should parse F6 (Tune Request)', () => {
			const msg = result.messages.find(m => m.hex === 'F6');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(246);
			expect(msg.message_type).toBe('Tune request');
			expect(msg.data_byte_1).toBe('none');
			expect(msg.data_byte_2).toBe('none');
		});

		it('should parse F7 (End of SysEx)', () => {
			const msg = result.messages.find(m => m.hex === 'F7');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(247);
			expect(msg.message_type).toBe('End of SysEx (EOX)');
		});

		it('should parse F8 (Timing Clock)', () => {
			const msg = result.messages.find(m => m.hex === 'F8');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(248);
			expect(msg.message_type).toBe('Timing clock');
		});

		it('should parse F9 as Undefined (Reserved)', () => {
			const msg = result.messages.find(m => m.hex === 'F9');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Undefined (Reserved)');
		});

		it('should parse FA (Start)', () => {
			const msg = result.messages.find(m => m.hex === 'FA');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(250);
			expect(msg.message_type).toBe('Start');
		});

		it('should parse FB (Continue)', () => {
			const msg = result.messages.find(m => m.hex === 'FB');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(251);
			expect(msg.message_type).toBe('Continue');
		});

		it('should parse FC (Stop)', () => {
			const msg = result.messages.find(m => m.hex === 'FC');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(252);
			expect(msg.message_type).toBe('Stop');
		});

		it('should parse FD as Undefined (Reserved)', () => {
			const msg = result.messages.find(m => m.hex === 'FD');
			expect(msg).toBeDefined();
			expect(msg.message_type).toBe('Undefined (Reserved)');
		});

		it('should parse FE (Active Sensing)', () => {
			const msg = result.messages.find(m => m.hex === 'FE');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(254);
			expect(msg.message_type).toBe('Active Sensing');
		});

		it('should parse FF (System Reset) as last entry', () => {
			const msg = result.messages.find(m => m.hex === 'FF');
			expect(msg).toBeDefined();
			expect(msg.decimal).toBe(255);
			expect(msg.message_type).toBe('System Reset');
			expect(msg.data_byte_1).toBe('none');
			expect(msg.data_byte_2).toBe('none');
		});

		it('should have exactly 16 system messages', () => {
			const system = result.messages.filter(m => m.category === 'system');
			expect(system).toHaveLength(16);
		});
	});

	describe('Data integrity', () => {
		it('should have all messages with binary, hex, decimal, and function', () => {
			for (const msg of result.messages) {
				expect(msg.binary).toMatch(/^[01]{8}$/);
				expect(msg.hex).toMatch(/^[0-9A-F]{2}$/);
				expect(msg.decimal).toBeGreaterThanOrEqual(128);
				expect(msg.decimal).toBeLessThanOrEqual(255);
				expect(msg.function).toBeTruthy();
			}
		});

		it('should have channel numbers 1-16 for all channel voice messages', () => {
			const channelVoice = result.messages.filter(m => m.category === 'channel_voice');
			for (const msg of channelVoice) {
				expect(msg.channel).toBeGreaterThanOrEqual(1);
				expect(msg.channel).toBeLessThanOrEqual(16);
			}
		});

		it('should have no channel field for system messages', () => {
			const system = result.messages.filter(m => m.category === 'system');
			for (const msg of system) {
				expect(msg.channel).toBeUndefined();
			}
		});

		it('should have contiguous hex values from 80 to FF', () => {
			for (let i = 0; i < result.messages.length; i++) {
				const expected = (128 + i).toString(16).toUpperCase().padStart(2, '0');
				expect(result.messages[i].hex).toBe(expected);
			}
		});
	});
});
