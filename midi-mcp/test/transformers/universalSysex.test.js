import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformUniversalSysex } from '../../lib/transformers/universalSysexTransformer.js';

describe('Universal SysEx Transformer', () => {
	it('should produce correct metadata and two categories', async () => {
		const docPath = path.resolve(__dirname, '../../data/universal-system-exclusive-messages.md');
		const result = await transformUniversalSysex(docPath);

		expect(result.metadata.title).toBe('Universal System Exclusive Messages');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('universal-system-exclusive-messages.md');
		expect(result.categories).toHaveLength(2);
		expect(result.categories[0].type).toBe('non_real_time');
		expect(result.categories[0].sysex_id).toBe('7E');
		expect(result.categories[1].type).toBe('real_time');
		expect(result.categories[1].sysex_id).toBe('7F');
	});

	describe('Non-Real Time category', () => {
		let result;

		beforeAll(async () => {
			const docPath = path.resolve(__dirname, '../../data/universal-system-exclusive-messages.md');
			result = await transformUniversalSysex(docPath);
		});

		const nonRt = () => result.categories[0];

		it('should have 19 parent messages', () => {
			expect(nonRt().messages).toHaveLength(19);
		});

		it('should have 51 children total', () => {
			const totalChildren = nonRt().messages.reduce((sum, m) => sum + m.children.length, 0);
			expect(totalChildren).toBe(51);
		});

		it('should parse sub-ID #1 = 00 (Unused) as standalone with no children', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '00');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBeNull();
			expect(msg.description).toBe('Unused');
			expect(msg.children).toHaveLength(0);
		});

		it('should parse sub-ID #1 = 01 (Sample Dump Header) as standalone', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '01');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBeNull();
			expect(msg.description).toBe('Sample Dump Header');
			expect(msg.children).toHaveLength(0);
		});

		it('should parse sub-ID #1 = 04 (MIDI Time Code) with nn and 15 children', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '04');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.description).toBe('MIDI Time Code');
			expect(msg.children).toHaveLength(15);

			expect(msg.children[0].sub_id_2).toBe('00');
			expect(msg.children[0].description).toBe('Special');

			expect(msg.children[1].sub_id_2).toBe('01');
			expect(msg.children[1].description).toBe('Punch In Points');

			expect(msg.children[14].sub_id_2).toBe('0E');
			expect(msg.children[14].description).toBe('Event Name in additional info.');
		});

		it('should parse sub-ID #1 = 05 (Sample Dump Extensions) with 7 children', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '05');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(7);
			expect(msg.children[0].sub_id_2).toBe('01');
			expect(msg.children[0].description).toBe('Loop Points Transmission');
		});

		it('should parse sub-ID #1 = 06 (General Information) with 2 children', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '06');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(2);
			expect(msg.children[0].description).toBe('Identity Request');
			expect(msg.children[1].description).toBe('Identity Reply');
		});

		it('should parse sub-ID #1 = 08 (MIDI Tuning Standard Non-RT) with 9 children', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '08');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(9);
			expect(msg.children[0].sub_id_2).toBe('00');
			expect(msg.children[0].description).toBe('Bulk Dump Request');
		});

		it('should parse sub-ID #1 = 0B (File Reference Message) with 6 children including range', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '0B');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(6);
			expect(msg.children[5].sub_id_2).toBe('05-7F');
			expect(msg.children[5].description).toBe('reserved (do not use)');
		});

		it('should parse sub-ID #1 = 0C (MIDI Visual Control) with range child', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '0C');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(1);
			expect(msg.children[0].sub_id_2).toBe('00-7F');
			expect(msg.children[0].description).toBe('MVC Commands');
		});

		it('should parse sub-ID #1 = 0D (MIDI Capability Inquiry) with range child', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '0D');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(1);
			expect(msg.children[0].sub_id_2).toBe('00-7F');
		});

		it('should parse sub-ID #1 = 7B (End of File) as standalone with null sub_id_2', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '7B');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBeNull();
			expect(msg.description).toBe('End of File');
			expect(msg.children).toHaveLength(0);
		});

		it('should parse sub-ID #1 = 7F (ACK) as standalone with null sub_id_2', () => {
			const msg = nonRt().messages.find(m => m.sub_id_1 === '7F');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBeNull();
			expect(msg.description).toBe('ACK');
			expect(msg.children).toHaveLength(0);
		});

		it('should have all sub_id_1 values in the expected set', () => {
			const expected = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '7B', '7C', '7D', '7E', '7F'];
			const actual = nonRt().messages.map(m => m.sub_id_1);
			expect(actual).toEqual(expected);
		});
	});

	describe('Real Time category', () => {
		let result;

		beforeAll(async () => {
			const docPath = path.resolve(__dirname, '../../data/universal-system-exclusive-messages.md');
			result = await transformUniversalSysex(docPath);
		});

		const rt = () => result.categories[1];

		it('should have 13 parent messages', () => {
			expect(rt().messages).toHaveLength(13);
		});

		it('should have 36 children total', () => {
			const totalChildren = rt().messages.reduce((sum, m) => sum + m.children.length, 0);
			expect(totalChildren).toBe(36);
		});

		it('should parse sub-ID #1 = 00 (Unused) as standalone with null sub_id_2', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '00');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBeNull();
			expect(msg.description).toBe('Unused');
			expect(msg.children).toHaveLength(0);
		});

		it('should parse sub-ID #1 = 01 (MIDI Time Code) with nn and 2 children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '01');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.description).toBe('MIDI Time Code');
			expect(msg.children).toHaveLength(2);
			expect(msg.children[0].sub_id_2).toBe('01');
			expect(msg.children[0].description).toBe('Full Message');
			expect(msg.children[1].sub_id_2).toBe('02');
			expect(msg.children[1].description).toBe('User Bits');
		});

		it('should parse sub-ID #1 = 02 (MIDI Show Control) with 2 children including range', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '02');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(2);
			expect(msg.children[0].sub_id_2).toBe('00');
			expect(msg.children[0].description).toBe('MSC Extensions');
			expect(msg.children[1].sub_id_2).toBe('01-7F');
			expect(msg.children[1].description).toBe('MSC Commands');
		});

		it('should parse sub-ID #1 = 03 (Notation Information) with 3 children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '03');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(3);
			expect(msg.children[0].description).toBe('Bar Number');
			expect(msg.children[1].description).toBe('Time Signature (Immediate)');
			expect(msg.children[2].sub_id_2).toBe('42');
			expect(msg.children[2].description).toBe('Time Signature (Delayed)');
		});

		it('should parse sub-ID #1 = 04 (Device Control) with 5 children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '04');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(5);
			expect(msg.children[0].description).toBe('Master Volume');
			expect(msg.children[4].description).toBe('Global Parameter Control');
		});

		it('should parse sub-ID #1 = 05 (Real Time MTC Cueing) with 15 children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '05');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(15);
			expect(msg.children[0].description).toBe('Special');
			expect(msg.children[14].sub_id_2).toBe('0E');
			expect(msg.children[14].description).toBe('Event Name in additional info.');
		});

		it('should parse sub-ID #1 = 06 (MMC Commands) with 1 range child', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '06');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(1);
			expect(msg.children[0].sub_id_2).toBe('00-7F');
			expect(msg.children[0].description).toBe('MMC Commands');
		});

		it('should parse sub-ID #1 = 08 (MIDI Tuning Standard RT) with 4 children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '08');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(4);
			expect(msg.children[0].sub_id_2).toBe('02');
			expect(msg.children[0].description).toBe('Single Note Tuning Change');
		});

		it('should parse sub-ID #1 = 09 (Controller Destination Setting) with 3 children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '09');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('nn');
			expect(msg.children).toHaveLength(3);
			expect(msg.children[0].description).toBe('Channel Pressure (Aftertouch)');
		});

		it('should parse sub-ID #1 = 0A with fixed sub_id_2=01 and no children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '0A');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('01');
			expect(msg.description).toBe('Key-based Instrument Control');
			expect(msg.children).toHaveLength(0);
		});

		it('should parse sub-ID #1 = 0B with fixed sub_id_2=01 and no children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '0B');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('01');
			expect(msg.description).toBe('Scalable Polyphony MIDI MIP Message');
			expect(msg.children).toHaveLength(0);
		});

		it('should parse sub-ID #1 = 0C with fixed sub_id_2=00 and no children', () => {
			const msg = rt().messages.find(m => m.sub_id_1 === '0C');
			expect(msg).toBeDefined();
			expect(msg.sub_id_2).toBe('00');
			expect(msg.description).toBe('Mobile Phone Control Message');
			expect(msg.children).toHaveLength(0);
		});

		it('should have all sub_id_1 values in the expected set', () => {
			const expected = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C'];
			const actual = rt().messages.map(m => m.sub_id_1);
			expect(actual).toEqual(expected);
		});
	});

	it('should not have any hallucinated or dropped data', async () => {
		const docPath = path.resolve(__dirname, '../../data/universal-system-exclusive-messages.md');
		const result = await transformUniversalSysex(docPath);

		for (const category of result.categories) {
			expect(category.type).toMatch(/^(non_real_time|real_time)$/);
			expect(category.sysex_id).toMatch(/^[0-9A-F]{2}$/);

			for (const msg of category.messages) {
				expect(msg.sub_id_1).toMatch(/^[0-9A-F]{2}$/);
				expect(msg.description).toBeTruthy();
				expect(Array.isArray(msg.children)).toBe(true);

				if (msg.sub_id_2 !== null) {
					expect(msg.sub_id_2).toMatch(/^(nn|[0-9A-F]{2}|[0-9A-F]{2}-[0-9A-F]{2})$/);
				}

				for (const child of msg.children) {
					expect(child.sub_id_2).toMatch(/^[0-9A-F]{2}(-[0-9A-F]{2})?$/);
					expect(child.description).toBeTruthy();
				}
			}
		}
	});
});
