import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformMidiTuning } from '../../lib/transformers/midiTuningTransformer.js';

describe('MIDI Tuning Updated Specification Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/midi-tuning-updated-specification.md');
		result = await transformMidiTuning(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI Tuning Messages Bank/Dump Extensions Scale/Octave Extensions');
		expect(result.metadata.doc_id).toBe('CA-020/CA-021');
		expect(result.metadata.version).toBe('1.0.0');
		expect(result.metadata.source).toBe('midi-tuning-updated-specification.md');
	});

	describe('Frequency data format', () => {
		it('should have 15 frequency examples', () => {
			expect(result.frequency_data_format.examples).toHaveLength(15);
			expect(result.summary.frequency_example_count).toBe(15);
		});

		it('should have 2 byte structure entries', () => {
			expect(result.frequency_data_format.byte_structure).toHaveLength(2);
			expect(result.summary.byte_structure_count).toBe(2);
		});

		it('should parse semitone byte structure', () => {
			const semitone = result.frequency_data_format.byte_structure.find(b => b.bits === 'xxxxxxx');
			expect(semitone).toBeDefined();
			expect(semitone.description).toContain('semitone');
		});

		it('should parse fraction byte structure', () => {
			const fraction = result.frequency_data_format.byte_structure.find(b => b.bits === 'abcdefghijklmn');
			expect(fraction).toBeDefined();
			expect(fraction.description).toContain('fraction of semitone');
		});

		it('should parse first frequency example (C 0)', () => {
			const example = result.frequency_data_format.examples.find(e => e.hex === '00 00 00');
			expect(example).toBeDefined();
			expect(example.description).toContain('8.1758 Hz');
		});

		it('should parse middle C frequency example', () => {
			const example = result.frequency_data_format.examples.find(e => e.hex === '3C 00 00');
			expect(example).toBeDefined();
			expect(example.description).toContain('261.6256 Hz');
			expect(example.description).toContain('middle C');
		});

		it('should parse A-440 frequency example', () => {
			const example = result.frequency_data_format.examples.find(e => e.hex === '45 00 00');
			expect(example).toBeDefined();
			expect(example.description).toContain('440.0000 Hz');
		});

		it('should parse no change reserved example', () => {
			const example = result.frequency_data_format.examples.find(e => e.hex === '7F 7F 7F');
			expect(example).toBeDefined();
			expect(example.description).toContain('no change');
			expect(example.description).toContain('reserved');
		});

		it('should parse top of range example', () => {
			const example = result.frequency_data_format.examples.find(e => e.hex === '7F 7F 7E');
			expect(example).toBeDefined();
			expect(example.description).toContain('13289.7300 Hz');
			expect(example.description).toContain('top of range');
		});
	});

	describe('Messages', () => {
		it('should have 13 messages', () => {
			expect(result.messages).toHaveLength(13);
			expect(result.summary.message_count).toBe(13);
		});

		it('should parse BULK TUNING DUMP REQUEST', () => {
			const msg = result.messages.find(m => m.name === 'BULK TUNING DUMP REQUEST');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
			expect(msg.fields.length).toBeGreaterThanOrEqual(4);
		});

		it('should parse BULK TUNING DUMP', () => {
			const msg = result.messages.find(m => m.name === 'BULK TUNING DUMP');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
			expect(msg.fields.length).toBeGreaterThanOrEqual(5);
		});

		it('should parse SINGLE NOTE TUNING CHANGE (REAL-TIME)', () => {
			const msg = result.messages.find(m => m.name === 'SINGLE NOTE TUNING CHANGE (REAL-TIME)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7F');
			expect(msg.fields.length).toBeGreaterThanOrEqual(7);
		});

		it('should parse BULK TUNING DUMP REQUEST (BANK)', () => {
			const msg = result.messages.find(m => m.name === 'BULK TUNING DUMP REQUEST (BANK)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
		});

		it('should parse KEY-BASED TUNING DUMP', () => {
			const msg = result.messages.find(m => m.name === 'KEY-BASED TUNING DUMP');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
			const bb = msg.fields.find(f => f.code === 'bb');
			expect(bb).toBeDefined();
			expect(bb.description).toContain('bank');
		});

		it('should parse SINGLE NOTE TUNING CHANGE (REAL-TIME) (BANK)', () => {
			const msg = result.messages.find(m => m.name === 'SINGLE NOTE TUNING CHANGE (REAL-TIME) (BANK)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7F');
		});

		it('should parse SINGLE NOTE TUNING CHANGE (NON REAL-TIME) (BANK)', () => {
			const msg = result.messages.find(m => m.name === 'SINGLE NOTE TUNING CHANGE (NON REAL-TIME) (BANK)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
		});

		it('should parse SCALE/OCTAVE TUNING DUMP, 1 byte format', () => {
			const msg = result.messages.find(m => m.name === 'SCALE/OCTAVE TUNING DUMP, 1 byte format');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
		});

		it('should parse SCALE/OCTAVE TUNING DUMP, 2 byte format', () => {
			const msg = result.messages.find(m => m.name === 'SCALE/OCTAVE TUNING DUMP, 2 byte format');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
		});

		it('should parse SCALE/OCTAVE TUNING 1-BYTE FORM (REAL-TIME)', () => {
			const msg = result.messages.find(m => m.name === 'SCALE/OCTAVE TUNING 1-BYTE FORM (REAL-TIME)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7F');
			const ff = msg.fields.find(f => f.code === 'ff');
			expect(ff).toBeDefined();
			expect(ff.description).toContain('channel');
		});

		it('should parse SCALE/OCTAVE TUNING 1-BYTE FORM (NON REAL-TIME)', () => {
			const msg = result.messages.find(m => m.name === 'SCALE/OCTAVE TUNING 1-BYTE FORM (NON REAL-TIME)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
		});

		it('should parse SCALE/OCTAVE TUNING 2-BYTE FORM (REAL-TIME)', () => {
			const msg = result.messages.find(m => m.name === 'SCALE/OCTAVE TUNING 2-BYTE FORM (REAL-TIME)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7F');
		});

		it('should parse SCALE/OCTAVE TUNING 2-BYTE FORM (NON REAL-TIME)', () => {
			const msg = result.messages.find(m => m.name === 'SCALE/OCTAVE TUNING 2-BYTE FORM (NON REAL-TIME)');
			expect(msg).toBeDefined();
			expect(msg.template).toContain('F0 7E');
		});

		it('should have all messages with template and fields', () => {
			for (const msg of result.messages) {
				expect(msg.name).toBeTruthy();
				expect(msg.template).toBeTruthy();
				expect(msg.fields.length).toBeGreaterThan(0);
			}
		});
	});

	describe('RPN messages', () => {
		it('should have 6 RPN messages', () => {
			expect(result.rpn_messages).toHaveLength(6);
			expect(result.summary.rpn_message_count).toBe(6);
		});

		it('should parse Tuning Program Select data entry', () => {
			const rpn = result.rpn_messages.find(r => r.type === 'data entry' && r.message.includes('03'));
			expect(rpn).toBeDefined();
		});

		it('should parse Tuning Program Select data increment', () => {
			const rpn = result.rpn_messages.find(r => r.type === 'data increment' && r.message.includes('03'));
			expect(rpn).toBeDefined();
		});

		it('should parse Tuning Bank Select data entry', () => {
			const rpn = result.rpn_messages.find(r => r.type === 'data entry' && r.message.includes('04'));
			expect(rpn).toBeDefined();
		});

		it('should parse Tuning Bank Select data decrement', () => {
			const rpn = result.rpn_messages.find(r => r.type === 'data decrement' && r.message.includes('04'));
			expect(rpn).toBeDefined();
		});
	});

	describe('Checksum calculation', () => {
		it('should have checksum calculation text', () => {
			expect(result.checksum_calculation).toBeTruthy();
			expect(result.checksum_calculation).toContain('XOR');
			expect(result.checksum_calculation).toContain('7F');
		});
	});

	describe('Notes', () => {
		it('should have notes', () => {
			expect(result.notes.length).toBeGreaterThan(0);
			expect(result.summary.note_count).toBe(result.notes.length);
		});

		it('should contain note about channel bitmap', () => {
			const note = result.notes.find(n => n.includes('channel bitmap'));
			expect(note).toBeDefined();
		});
	});

	describe('Data integrity', () => {
		it('should have all messages with name, template, and fields array', () => {
			for (const msg of result.messages) {
				expect(msg.name).toBeTruthy();
				expect(msg.template).toMatch(/^F0/);
				expect(Array.isArray(msg.fields)).toBe(true);
			}
		});

		it('should have all frequency examples with hex and description', () => {
			for (const example of result.frequency_data_format.examples) {
				expect(example.hex).toMatch(/^[0-9A-F]{2} [0-9A-F]{2} [0-9A-F]{2}$/);
				expect(example.description).toBeTruthy();
			}
		});

		it('should have all RPN messages with message and type', () => {
			for (const rpn of result.rpn_messages) {
				expect(rpn.message).toMatch(/^Bn/);
				expect(rpn.type).toBeTruthy();
			}
		});
	});
});
