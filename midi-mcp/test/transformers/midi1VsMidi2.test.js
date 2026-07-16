import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMidi1VsMidi2 } from '../../lib/transformers/midi1VsMidi2Transformer.js';

describe('MIDI 1.0 vs MIDI 2.0 Comparison Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../reference/midi1-vs-midi2.md');
		result = await transformMidi1VsMidi2(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI 1.0 vs MIDI 2.0 Comparison');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('midi1-vs-midi2.md');
	});

	describe('Comparison table', () => {
		it('should have 16 comparison rows', () => {
			expect(result.comparisons).toHaveLength(16);
		});

		it('should parse Packet format as first entry', () => {
			const first = result.comparisons[0];
			expect(first.capability).toBe('Packet format');
			expect(first.midi_1_0).toContain('Variable-length byte stream');
			expect(first.midi_1_0).toContain('running status');
			expect(first.midi_2_0).toContain('Universal MIDI Packet');
			expect(first.midi_2_0).toContain('32/64/96/128-bit');
		});

		it('should parse Direction', () => {
			const entry = result.comparisons.find(c => c.capability === 'Direction');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toBe('Unidirectional');
			expect(entry.midi_2_0).toContain('Bidirectional');
			expect(entry.midi_2_0).toContain('MIDI-CI');
		});

		it('should parse Channels', () => {
			const entry = result.comparisons.find(c => c.capability === 'Channels');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toBe('16');
			expect(entry.midi_2_0).toContain('256');
			expect(entry.midi_2_0).toContain('16 groups × 16 channels');
		});

		it('should parse Velocity', () => {
			const entry = result.comparisons.find(c => c.capability === 'Velocity');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('7-bit');
			expect(entry.midi_1_0).toContain('0–127');
			expect(entry.midi_2_0).toContain('16-bit');
			expect(entry.midi_2_0).toContain('0–65535');
		});

		it('should parse CC / controller values', () => {
			const entry = result.comparisons.find(c => c.capability === 'CC / controller values');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('7-bit');
			expect(entry.midi_1_0).toContain('14-bit via paired CCs');
			expect(entry.midi_2_0).toBe('32-bit');
		});

		it('should parse Pitch bend', () => {
			const entry = result.comparisons.find(c => c.capability === 'Pitch bend');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toBe('14-bit');
			expect(entry.midi_2_0).toContain('32-bit');
			expect(entry.midi_2_0).toContain('per-note pitch bend');
		});

		it('should parse RPN/NRPN', () => {
			const entry = result.comparisons.find(c => c.capability === 'RPN/NRPN');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('CC 101/100/98/99');
			expect(entry.midi_1_0).toContain('CC 6/38');
			expect(entry.midi_2_0).toContain('Direct');
			expect(entry.midi_2_0).toContain('16384 banks');
		});

		it('should parse Per-note expression', () => {
			const entry = result.comparisons.find(c => c.capability === 'Per-note expression');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('MPE');
			expect(entry.midi_2_0).toContain('Native');
			expect(entry.midi_2_0).toContain('per-note controllers');
		});

		it('should parse Note attributes', () => {
			const entry = result.comparisons.find(c => c.capability === 'Note attributes');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toBe('None');
			expect(entry.midi_2_0).toContain('16-bit attribute');
			expect(entry.midi_2_0).toContain('Note On/Off');
		});

		it('should parse Note On velocity 0', () => {
			const entry = result.comparisons.find(c => c.capability === 'Note On velocity 0');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toBe('Means Note Off');
			expect(entry.midi_2_0).toContain('real Note On');
			expect(entry.midi_2_0).toContain('translation must convert');
		});

		it('should parse Timing/jitter', () => {
			const entry = result.comparisons.find(c => c.capability === 'Timing/jitter');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('MIDI Clock');
			expect(entry.midi_2_0).toContain('JR Timestamps');
			expect(entry.midi_2_0).toContain('1/31250');
		});

		it('should parse Device discovery', () => {
			const entry = result.comparisons.find(c => c.capability === 'Device discovery');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('Identity Request SysEx');
			expect(entry.midi_2_0).toContain('MIDI-CI');
			expect(entry.midi_2_0).toContain('MUIDs');
			expect(entry.midi_2_0).toContain('Property Exchange');
		});

		it('should parse Files', () => {
			const entry = result.comparisons.find(c => c.capability === 'Files');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('SMF 0/1');
			expect(entry.midi_2_0).toContain('SMF2CLIP');
		});

		it('should parse Transports', () => {
			const entry = result.comparisons.find(c => c.capability === 'Transports');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toContain('5-pin DIN');
			expect(entry.midi_1_0).toContain('BLE-MIDI');
			expect(entry.midi_1_0).toContain('RTP-MIDI');
			expect(entry.midi_2_0).toContain('USB-MIDI 2.0');
			expect(entry.midi_2_0).toContain('transport-agnostic');
		});

		it('should parse Browser (Web MIDI API)', () => {
			const entry = result.comparisons.find(c => c.capability === 'Browser (Web MIDI API)');
			expect(entry).toBeDefined();
			expect(entry.midi_1_0).toBe('Supported (Chrome/Chromium)');
			expect(entry.midi_2_0).toBe('Not yet supported');
		});

		it('should parse Backward compatibility as last entry', () => {
			const last = result.comparisons[15];
			expect(last.capability).toBe('Backward compatibility');
			expect(last.midi_1_0).toBe('—');
			expect(last.midi_2_0).toContain('UMP');
			expect(last.midi_2_0).toContain('MT 0x2');
			expect(last.midi_2_0).toContain('translation rules');
		});

		it('should have all entries with capability, midi_1_0, and midi_2_0', () => {
			for (const entry of result.comparisons) {
				expect(entry.capability).toBeTruthy();
				expect(entry.midi_1_0).toBeDefined();
				expect(entry.midi_2_0).toBeDefined();
			}
		});
	});

	describe('Translation gotchas', () => {
		it('should have 4 gotchas', () => {
			expect(result.translation_gotchas).toHaveLength(4);
		});

		it('should parse gotcha 1 (Velocity 0)', () => {
			const g = result.translation_gotchas[0];
			expect(g.number).toBe(1);
			expect(g.topic).toBe('Velocity 0');
			expect(g.description).toContain('Note On velocity 0');
			expect(g.description).toContain('Note Off');
			expect(g.description).toContain('velocity 1');
		});

		it('should parse gotcha 2 (Value scaling)', () => {
			const g = result.translation_gotchas[1];
			expect(g.number).toBe(2);
			expect(g.topic).toBe('Value scaling');
			expect(g.description).toContain('bit-repeat');
			expect(g.description).toContain('truncation');
			expect(g.description).toContain('center');
		});

		it('should parse gotcha 3 (RPN/NRPN)', () => {
			const g = result.translation_gotchas[2];
			expect(g.number).toBe(3);
			expect(g.topic).toBe('RPN/NRPN');
			expect(g.description).toContain('CC sequences');
			expect(g.description).toContain('101/100');
			expect(g.description).toContain('state machines');
		});

		it('should parse gotcha 4 (Groups)', () => {
			const g = result.translation_gotchas[3];
			expect(g.number).toBe(4);
			expect(g.topic).toBe('Groups');
			expect(g.description).toContain('UMP group');
			expect(g.description).toContain('lost');
			expect(g.description).toContain('one group per stream');
		});

		it('should have all gotchas with number, topic, and description', () => {
			for (const g of result.translation_gotchas) {
				expect(g.number).toBeGreaterThan(0);
				expect(g.topic).toBeTruthy();
				expect(g.description).toBeTruthy();
			}
		});
	});

	describe('Practical guidance', () => {
		it('should include guidance about Web MIDI API and MIDI 1.0', () => {
			expect(result.practical_guidance).toBeDefined();
			expect(result.practical_guidance).toContain('Web MIDI API');
			expect(result.practical_guidance).toContain('MIDI 1.0');
		});

		it('should mention MIDI 2.0 relevance for OS stacks and future-proofing', () => {
			expect(result.practical_guidance).toContain('MIDI 2.0');
			expect(result.practical_guidance).toContain('UMP-native');
			expect(result.practical_guidance).toContain('future-proof');
		});
	});

	describe('Data integrity', () => {
		it('should not have any hallucinated or dropped data', () => {
			expect(result.comparisons).toHaveLength(16);
			expect(result.translation_gotchas).toHaveLength(4);
			expect(result.practical_guidance).toBeTruthy();
		});
	});
});
