import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformSummaryMessages } from '../../lib/transformers/summaryMessagesTransformer.js';

describe('Summary of MIDI 1.0 Messages Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/summary-of-midi-1-0-messages-midi-org.md');
		result = await transformSummaryMessages(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('Summary of MIDI 1.0 Messages');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('summary-of-midi-1-0-messages-midi-org.md');
	});

	it('should have 24 total entries', () => {
		expect(result.messages).toHaveLength(24);
		expect(result.summary.total_entries).toBe(24);
	});

	it('should have 7 channel voice entries', () => {
		expect(result.summary.channel_voice_count).toBe(7);
	});

	it('should have 1 channel mode entry', () => {
		expect(result.summary.channel_mode_count).toBe(1);
	});

	it('should have 8 system common entries', () => {
		expect(result.summary.system_common_count).toBe(8);
	});

	it('should have 8 system real-time entries', () => {
		expect(result.summary.system_real_time_count).toBe(8);
	});

	describe('Channel Voice Messages', () => {
		const cv = () => result.messages.filter(m => m.category === 'channel_voice');

		it('should parse Note Off (1000nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1000nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0kkkkkkk 0vvvvvvv');
			expect(msg.description).toContain('Note Off event');
			expect(msg.message_type).toBe('Note Off event');
		});

		it('should parse Note On (1001nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1001nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0kkkkkkk 0vvvvvvv');
			expect(msg.description).toContain('Note On event');
		});

		it('should parse Polyphonic Key Pressure (1010nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1010nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0kkkkkkk 0vvvvvvv');
			expect(msg.description).toContain('Polyphonic Key Pressure');
		});

		it('should parse Control Change (1011nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1011nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0ccccccc 0vvvvvvv');
			expect(msg.description).toContain('Control Change');
			expect(msg.description).toContain('pedals and levers');
		});

		it('should parse Program Change (1100nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1100nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0ppppppp');
			expect(msg.description).toContain('Program Change');
		});

		it('should parse Channel Pressure (1101nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1101nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0vvvvvvv');
			expect(msg.description).toContain('Channel Pressure');
		});

		it('should parse Pitch Bend Change (1110nnnn)', () => {
			const msg = cv().find(m => m.status_byte === '1110nnnn');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0lllllll 0mmmmmmm');
			expect(msg.description).toContain('Pitch Bend Change');
			expect(msg.description).toContain('2000H');
		});

		it('should not have sub_entries on channel voice messages', () => {
			for (const msg of cv()) {
				expect(msg.sub_entries).toBeUndefined();
			}
		});
	});

	describe('Channel Mode Messages', () => {
		const cm = () => result.messages.find(m => m.category === 'channel_mode');

		it('should have status byte 1011nnnn', () => {
			expect(cm().status_byte).toBe('1011nnnn');
		});

		it('should have data bytes 0ccccccc 0vvvvvvv', () => {
			expect(cm().data_bytes).toBe('0ccccccc 0vvvvvvv');
		});

		it('should mention Channel Mode Messages in description', () => {
			expect(cm().description).toContain('Channel Mode Messages');
			expect(cm().description).toContain('120-127');
		});

		it('should have 4 sub-entries', () => {
			expect(cm().sub_entries).toHaveLength(4);
		});

		it('should have All Sound Off as first sub-entry', () => {
			expect(cm().sub_entries[0].description).toContain('All Sound Off');
			expect(cm().sub_entries[0].description).toContain('c = 120');
		});

		it('should have Reset All Controllers as second sub-entry', () => {
			expect(cm().sub_entries[1].description).toContain('Reset All Controllers');
			expect(cm().sub_entries[1].description).toContain('c = 121');
		});

		it('should have Local Control as third sub-entry', () => {
			expect(cm().sub_entries[2].description).toContain('Local Control');
			expect(cm().sub_entries[2].description).toContain('c = 122');
		});

		it('should have All Notes Off as fourth sub-entry', () => {
			expect(cm().sub_entries[3].description).toContain('All Notes Off');
			expect(cm().sub_entries[3].description).toContain('c = 123');
		});
	});

	describe('System Common Messages', () => {
		const sc = () => result.messages.filter(m => m.category === 'system_common');

		it('should parse System Exclusive (11110000)', () => {
			const msg = sc().find(m => m.status_byte === '11110000');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('System Exclusive');
			expect(msg.description).toContain('Manufacturer');
		});

		it('should parse MIDI Time Code Quarter Frame (11110001)', () => {
			const msg = sc().find(m => m.status_byte === '11110001');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0nnndddd');
			expect(msg.description).toContain('MIDI Time Code Quarter Frame');
		});

		it('should parse Song Position Pointer (11110010)', () => {
			const msg = sc().find(m => m.status_byte === '11110010');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0lllllll 0mmmmmmm');
			expect(msg.description).toContain('Song Position Pointer');
		});

		it('should parse Song Select (11110011)', () => {
			const msg = sc().find(m => m.status_byte === '11110011');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('0sssssss');
			expect(msg.description).toContain('Song Select');
		});

		it('should parse Undefined F4 (11110100)', () => {
			const msg = sc().find(m => m.status_byte === '11110100');
			expect(msg).toBeDefined();
			expect(msg.data_bytes).toBe('');
			expect(msg.description).toContain('Undefined');
		});

		it('should parse Undefined F5 (11110101)', () => {
			const msg = sc().find(m => m.status_byte === '11110101');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Undefined');
		});

		it('should parse Tune Request (11110110)', () => {
			const msg = sc().find(m => m.status_byte === '11110110');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Tune Request');
		});

		it('should parse End of Exclusive (11110111)', () => {
			const msg = sc().find(m => m.status_byte === '11110111');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('End of Exclusive');
		});
	});

	describe('System Real-Time Messages', () => {
		const srt = () => result.messages.filter(m => m.category === 'system_real_time');

		it('should parse Timing Clock (11111000)', () => {
			const msg = srt().find(m => m.status_byte === '11111000');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Timing Clock');
			expect(msg.description).toContain('24 times per quarter note');
		});

		it('should parse Undefined F9 (11111001)', () => {
			const msg = srt().find(m => m.status_byte === '11111001');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Undefined');
		});

		it('should parse Start (11111010)', () => {
			const msg = srt().find(m => m.status_byte === '11111010');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Start');
		});

		it('should parse Continue (11111011)', () => {
			const msg = srt().find(m => m.status_byte === '11111011');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Continue');
		});

		it('should parse Stop (11111100)', () => {
			const msg = srt().find(m => m.status_byte === '11111100');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Stop');
		});

		it('should parse Undefined FD (11111101)', () => {
			const msg = srt().find(m => m.status_byte === '11111101');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Undefined');
		});

		it('should parse Active Sensing (11111110)', () => {
			const msg = srt().find(m => m.status_byte === '11111110');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Active Sensing');
			expect(msg.description).toContain('300ms');
		});

		it('should parse Reset (11111111)', () => {
			const msg = srt().find(m => m.status_byte === '11111111');
			expect(msg).toBeDefined();
			expect(msg.description).toContain('Reset');
			expect(msg.description).toContain('power-up');
		});
	});

	describe('Data integrity', () => {
		it('should have all messages with status_byte, data_bytes, description, and category', () => {
			for (const msg of result.messages) {
				expect(msg.status_byte).toBeTruthy();
				expect(msg.data_bytes).toBeDefined();
				expect(msg.description).toBeTruthy();
				expect(msg.category).toBeTruthy();
				expect(msg.message_type).toBeTruthy();
			}
		});

		it('should have valid binary status byte patterns', () => {
			for (const msg of result.messages) {
				expect(msg.status_byte).toMatch(/^[01n]+$/);
			}
		});

		it('should not have sub_entries on non-channel-mode messages', () => {
			for (const msg of result.messages) {
				if (msg.category !== 'channel_mode') {
					expect(msg.sub_entries).toBeUndefined();
				}
			}
		});

		it('should have exactly 4 sub_entries on the channel mode message', () => {
			const cm = result.messages.find(m => m.category === 'channel_mode');
			expect(cm.sub_entries).toHaveLength(4);
		});
	});
});
