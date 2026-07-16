import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMidi2Ump } from '../../lib/transformers/midi2UmpTransformer.js';

describe('MIDI 2.0 UMP Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../reference/midi2-ump-quick-reference.md');
		result = await transformMidi2Ump(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI 2.0 / UMP Quick Reference');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('midi2-ump-quick-reference.md');
	});

	describe('UMP Message Types', () => {
		it('should have 8 message types', () => {
			expect(result.ump_message_types).toHaveLength(8);
		});

		it('should parse 0x0 (Utility) with 32 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0x0');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(32);
			expect(mt.contents).toContain('Utility');
			expect(mt.contents).toContain('NOOP');
			expect(mt.contents).toContain('JR Timestamp');
		});

		it('should parse 0x1 (System Real-Time and Common) with 32 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0x1');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(32);
			expect(mt.contents).toContain('System Real-Time');
		});

		it('should parse 0x2 (MIDI 1.0 Channel Voice) with 32 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0x2');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(32);
			expect(mt.contents).toContain('MIDI 1.0 Channel Voice');
			expect(mt.contents).toContain('7-bit data');
		});

		it('should parse 0x3 (Data messages / SysEx7) with 64 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0x3');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(64);
			expect(mt.contents).toContain('SysEx7');
		});

		it('should parse 0x4 (MIDI 2.0 Channel Voice) with 64 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0x4');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(64);
			expect(mt.contents).toContain('MIDI 2.0 Channel Voice');
			expect(mt.contents).toContain('high resolution');
		});

		it('should parse 0x5 (SysEx8 / Mixed Data Set) with 128 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0x5');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(128);
			expect(mt.contents).toContain('SysEx8');
			expect(mt.contents).toContain('Mixed Data Set');
		});

		it('should parse 0xD (Flex Data) with 128 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0xD');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(128);
			expect(mt.contents).toContain('Flex Data');
			expect(mt.contents).toContain('lyrics');
		});

		it('should parse 0xF (UMP Stream) with 128 bits', () => {
			const mt = result.ump_message_types.find(m => m.mt === '0xF');
			expect(mt).toBeDefined();
			expect(mt.size_bits).toBe(128);
			expect(mt.contents).toContain('UMP Stream');
			expect(mt.contents).toContain('endpoint discovery');
		});

		it('should have all entries with mt, size_bits, and contents', () => {
			for (const mt of result.ump_message_types) {
				expect(mt.mt).toMatch(/^0x[0-9A-Fa-f]$/);
				expect(mt.size_bits).toBeGreaterThan(0);
				expect(mt.contents).toBeTruthy();
			}
		});
	});

	describe('MIDI 2.0 Channel Voice Messages', () => {
		it('should have 15 messages', () => {
			expect(result.midi2_channel_voice_messages).toHaveLength(15);
		});

		it('should parse 0x8 (Note Off) with 16-bit velocity', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x8');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Note Off');
			expect(msg.resolution).toContain('16-bit velocity');
			expect(msg.resolution).toContain('attribute');
		});

		it('should parse 0x9 (Note On) with 16-bit velocity and attribute', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x9');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Note On');
			expect(msg.resolution).toContain('16-bit velocity');
			expect(msg.resolution).toContain('16-bit attribute');
		});

		it('should parse 0xA (Poly Pressure) with 32-bit data', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0xA');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Poly Pressure');
			expect(msg.resolution).toContain('32-bit data');
		});

		it('should parse 0x0 (Registered Per-Note Controller) as new', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x0');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Registered Per-Note Controller');
			expect(msg.resolution).toContain('new');
			expect(msg.resolution).toContain('per-note');
			expect(msg.resolution).toContain('32-bit');
		});

		it('should parse 0x1 (Assignable Per-Note Controller) as new', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x1');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Assignable Per-Note Controller');
			expect(msg.resolution).toContain('new');
		});

		it('should parse 0xF (Per-Note Management) as new', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0xF');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Per-Note Management');
			expect(msg.resolution).toContain('detach');
			expect(msg.resolution).toContain('reset');
		});

		it('should parse 0xB (Control Change) with 32-bit value', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0xB');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Control Change');
			expect(msg.resolution).toContain('32-bit value');
		});

		it('should parse 0x2 (Registered Controller / RPN) as direct message', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x2');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Registered Controller (RPN)');
			expect(msg.resolution).toContain('direct message');
			expect(msg.resolution).toContain('32-bit');
		});

		it('should parse 0x3 (Assignable Controller / NRPN)', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x3');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Assignable Controller (NRPN)');
			expect(msg.resolution).toContain('direct message');
		});

		it('should parse 0x4 and 0x5 (Relative Controllers) as new', () => {
			const r4 = result.midi2_channel_voice_messages.find(m => m.opcode === '0x4');
			const r5 = result.midi2_channel_voice_messages.find(m => m.opcode === '0x5');
			expect(r4).toBeDefined();
			expect(r4.message).toBe('Relative Registered Controller');
			expect(r4.resolution).toContain('new');
			expect(r5).toBeDefined();
			expect(r5.message).toBe('Relative Assignable Controller');
			expect(r5.resolution).toContain('new');
		});

		it('should parse 0xC (Program Change) with bank option', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0xC');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Program Change');
			expect(msg.resolution).toContain('bank');
		});

		it('should parse 0xD (Channel Pressure) with 32-bit data', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0xD');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Channel Pressure');
			expect(msg.resolution).toContain('32-bit data');
		});

		it('should parse 0xE (Pitch Bend) with 32-bit value', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0xE');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Pitch Bend');
			expect(msg.resolution).toContain('32-bit value');
		});

		it('should parse 0x6 (Per-Note Pitch Bend) as new', () => {
			const msg = result.midi2_channel_voice_messages.find(m => m.opcode === '0x6');
			expect(msg).toBeDefined();
			expect(msg.message).toBe('Per-Note Pitch Bend');
			expect(msg.resolution).toContain('new');
			expect(msg.resolution).toContain('per-note');
		});

		it('should have all entries with opcode, message, and resolution', () => {
			for (const msg of result.midi2_channel_voice_messages) {
				expect(msg.opcode).toMatch(/^0x[0-9A-Fa-f]$/);
				expect(msg.message).toBeTruthy();
				expect(msg.resolution).toBeTruthy();
			}
		});
	});

	describe('Notes sections', () => {
		it('should have 4 note sections', () => {
			expect(Object.keys(result.notes)).toHaveLength(4);
		});

		it('should include value_scaling notes with bit-repeat info', () => {
			expect(result.notes.value_scaling).toBeDefined();
			expect(result.notes.value_scaling).toContain('bit-repeat');
			expect(result.notes.value_scaling).toContain('Upscaling');
			expect(result.notes.value_scaling).toContain('Downscaling');
		});

		it('should include timing notes with JR Timestamp', () => {
			expect(result.notes.timing).toBeDefined();
			expect(result.notes.timing).toContain('JR Timestamp');
			expect(result.notes.timing).toContain('1/31250');
		});

		it('should include midi_ci notes with discovery and profiles', () => {
			expect(result.notes.midi_ci).toBeDefined();
			expect(result.notes.midi_ci).toContain('Discovery');
			expect(result.notes.midi_ci).toContain('Profile');
			expect(result.notes.midi_ci).toContain('Property Exchange');
		});

		it('should include web_midi_status notes about Chrome/Chromium', () => {
			expect(result.notes.web_midi_status).toBeDefined();
			expect(result.notes.web_midi_status).toContain('Web MIDI API');
			expect(result.notes.web_midi_status).toContain('MIDI 1.0');
			expect(result.notes.web_midi_status).toContain('support yet');
		});
	});

	describe('Data integrity', () => {
		it('should not have any hallucinated or dropped data', () => {
			expect(result.ump_message_types).toHaveLength(8);
			expect(result.midi2_channel_voice_messages).toHaveLength(15);
			expect(Object.keys(result.notes)).toHaveLength(4);
		});
	});
});
