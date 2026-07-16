import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformBitScalingAndResolution } from '../../lib/transformers/bitScalingAndResolutionTransformer.js';

describe('MIDI 2.0 Bit Scaling and Resolution Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/m2-115-u-midi-2-0-bit-scaling-and-resolution.md');
		result = await transformBitScalingAndResolution(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('MIDI 2.0 Bit Scaling and Resolution');
		expect(result.metadata.doc_id).toBe('M2-115-U');
		expect(result.metadata.version).toBe('1.0.2');
		expect(result.metadata.source).toBe('m2-115-u-midi-2-0-bit-scaling-and-resolution.md');
	});

	describe('Version History', () => {
		it('should have 2 entries', () => {
			expect(result.version_history).toHaveLength(2);
			expect(result.summary.version_history_count).toBe(2);
		});

		it('should parse v1.0.1 Initial release', () => {
			const entry = result.version_history.find(v => v.version === '1.0.1');
			expect(entry).toBeDefined();
			expect(entry.date).toContain('June 15, 2023');
			expect(entry.changes).toBe('Initial release');
		});

		it('should parse v1.0.2 Minor Update', () => {
			const entry = result.version_history.find(v => v.version === '1.0.2');
			expect(entry).toBeDefined();
			expect(entry.date).toContain('December 15, 2023');
			expect(entry.changes).toContain('Minor Update');
			expect(entry.changes).toContain('Table 9');
		});
	});

	describe('Conformance Words', () => {
		it('should have 3 entries', () => {
			expect(result.conformance_words).toHaveLength(3);
			expect(result.summary.conformance_word_count).toBe(3);
		});

		it('should parse shall as Statements of requirement', () => {
			const word = result.conformance_words.find(w => w.word === 'shall');
			expect(word.reserved_for).toBe('Statements of requirement');
			expect(word.description).toContain('conformant implementation');
		});

		it('should parse should as Statements of recommendation', () => {
			const word = result.conformance_words.find(w => w.word === 'should');
			expect(word.reserved_for).toBe('Statements of recommendation');
			expect(word.description).toContain('still conformant');
		});

		it('should parse may as Statements of permission', () => {
			const word = result.conformance_words.find(w => w.word === 'may');
			expect(word.reserved_for).toBe('Statements of permission');
			expect(word.description).toContain('still conformant');
		});
	});

	describe('Non-Conformance Words', () => {
		it('should have 4 entries', () => {
			expect(result.non_conformance_words).toHaveLength(4);
			expect(result.summary.non_conformance_word_count).toBe(4);
		});

		it('should parse must as Statements of unavoidability', () => {
			const word = result.non_conformance_words.find(w => w.word === 'must');
			expect(word.reserved_for).toBe('Statements of unavoidability');
			expect(word.relation).toContain('Describes an action');
			expect(word.not_used_for).toContain('Not used for statements of conformance');
		});

		it('should parse will as Statements of fact', () => {
			const word = result.non_conformance_words.find(w => w.word === 'will');
			expect(word.reserved_for).toBe('Statements of fact');
			expect(word.relation).toContain('necessarily going to be true');
		});

		it('should parse can as Statements of capability', () => {
			const word = result.non_conformance_words.find(w => w.word === 'can');
			expect(word.reserved_for).toBe('Statements of capability');
			expect(word.relation).toContain('capable of possessing');
		});

		it('should parse might as Statements of possibility', () => {
			const word = result.non_conformance_words.find(w => w.word === 'might');
			expect(word.reserved_for).toBe('Statements of possibility');
			expect(word.relation).toContain('capable of electing');
		});
	});

	describe('Center Value Examples', () => {
		it('should have 5 entries', () => {
			expect(result.center_value_examples).toHaveLength(5);
			expect(result.summary.center_value_example_count).toBe(5);
		});

		it('should parse 7 bits center as 0X40', () => {
			const entry = result.center_value_examples.find(e => e.value_size === '7 bits');
			expect(entry.center_value_hex).toBe('0X40');
			expect(entry.center_value_binary).toContain('01000000');
		});

		it('should parse 14 bits center as 0X2000', () => {
			const entry = result.center_value_examples.find(e => e.value_size === '14 bits');
			expect(entry.center_value_hex).toBe('0X2000');
		});

		it('should parse 8 bits center as 0X80', () => {
			const entry = result.center_value_examples.find(e => e.value_size === '8 bits');
			expect(entry.center_value_hex).toBe('0X80');
		});

		it('should parse 16 bits center as 0X8000', () => {
			const entry = result.center_value_examples.find(e => e.value_size === '16 bits');
			expect(entry.center_value_hex).toBe('0X8000');
		});

		it('should parse 32 bits center as 0X80000000', () => {
			const entry = result.center_value_examples.find(e => e.value_size === '32 bits');
			expect(entry.center_value_hex).toBe('0X80000000');
		});
	});

	describe('Scaling Tables', () => {
		it('should have 6 tables', () => {
			expect(result.scaling_tables).toHaveLength(6);
			expect(result.summary.scaling_table_count).toBe(6);
		});

		it('should have 43 total entries', () => {
			expect(result.summary.scaling_table_entry_total).toBe(43);
		});

		it('should parse Table 5: Upscale 7 to 16 bits with 9 entries', () => {
			const table = result.scaling_tables.find(t => t.table_number === 5);
			expect(table).toBeDefined();
			expect(table.title).toContain('Upscale 7 to 16 bits');
			expect(table.entries).toHaveLength(9);
		});

		it('should parse Table 5 entry 0 -> 0x0000', () => {
			const table = result.scaling_tables.find(t => t.table_number === 5);
			const entry = table.entries.find(e => e.src_decimal === 0);
			expect(entry.dst_decimal).toBe(0);
			expect(entry.dst_hex).toBe('0X0000');
		});

		it('should parse Table 5 entry 127 -> 0xFFFF', () => {
			const table = result.scaling_tables.find(t => t.table_number === 5);
			const entry = table.entries.find(e => e.src_decimal === 127);
			expect(entry.dst_decimal).toBe(65535);
			expect(entry.dst_hex).toBe('0XFFFF');
		});

		it('should parse Table 5 entry 64 -> 0x8000 (center)', () => {
			const table = result.scaling_tables.find(t => t.table_number === 5);
			const entry = table.entries.find(e => e.src_decimal === 64);
			expect(entry.dst_decimal).toBe(32768);
			expect(entry.dst_hex).toBe('0X8000');
		});

		it('should parse Table 6: Upscale 7 to 32 bits with 9 entries', () => {
			const table = result.scaling_tables.find(t => t.table_number === 6);
			expect(table).toBeDefined();
			expect(table.entries).toHaveLength(9);
		});

		it('should parse Table 6 entry 127 -> 0xFFFFFFFF', () => {
			const table = result.scaling_tables.find(t => t.table_number === 6);
			const entry = table.entries.find(e => e.src_decimal === 127);
			expect(entry.dst_hex).toBe('0XFFFFFFFF');
		});

		it('should parse Table 7: Upscale 16 to 32 bits with 9 entries', () => {
			const table = result.scaling_tables.find(t => t.table_number === 7);
			expect(table).toBeDefined();
			expect(table.entries).toHaveLength(9);
		});

		it('should parse Table 8: Downscale 16 to 7 bits with 4 entries', () => {
			const table = result.scaling_tables.find(t => t.table_number === 8);
			expect(table).toBeDefined();
			expect(table.entries).toHaveLength(4);
		});

		it('should parse Table 9: Zero-Extension Upscale 7 to 16 bits with 4 entries', () => {
			const table = result.scaling_tables.find(t => t.table_number === 9);
			expect(table).toBeDefined();
			expect(table.entries).toHaveLength(4);
		});

		it('should parse Table 9 entry 127 -> 0xFE00 (not 0xFFFF)', () => {
			const table = result.scaling_tables.find(t => t.table_number === 9);
			const entry = table.entries.find(e => e.src_decimal === 127);
			expect(entry.dst_decimal).toBe(65024);
			expect(entry.dst_hex).toBe('0XFE00');
		});

		it('should parse Table 10: Zero-Extension Downscale 16 to 7 bits with 8 entries', () => {
			const table = result.scaling_tables.find(t => t.table_number === 10);
			expect(table).toBeDefined();
			expect(table.entries).toHaveLength(8);
		});
	});

	describe('Pseudo Code Blocks', () => {
		it('should have 4 blocks', () => {
			expect(result.pseudo_code_blocks).toHaveLength(4);
			expect(result.summary.pseudo_code_block_count).toBe(4);
		});

		it('should parse Upscaling block with scaleUp function', () => {
			const block = result.pseudo_code_blocks.find(p => p.name === 'Upscaling');
			expect(block).toBeDefined();
			expect(block.code).toContain('scaleUp');
			expect(block.code).toContain('srcBits');
			expect(block.code).toContain('dstBits');
		});

		it('should parse Downscaling block with scaleDown function', () => {
			const block = result.pseudo_code_blocks.find(p => p.name === 'Downscaling');
			expect(block).toBeDefined();
			expect(block.code).toContain('scaleDown');
		});

		it('should parse Zero-Extension Upscaling block', () => {
			const block = result.pseudo_code_blocks.find(p => p.name === 'Zero-Extension Upscaling');
			expect(block).toBeDefined();
			expect(block.code).toContain('scaleUp');
		});

		it('should parse Zero-Extension Downscaling block with rounding', () => {
			const block = result.pseudo_code_blocks.find(p => p.name === 'Zero-Extension Downscaling');
			expect(block).toBeDefined();
			expect(block.code).toContain('scaleDownRounding');
			expect(block.code).toContain('halfScaleRange');
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.version_history_count).toBe(2);
			expect(result.summary.conformance_word_count).toBe(3);
			expect(result.summary.non_conformance_word_count).toBe(4);
			expect(result.summary.center_value_example_count).toBe(5);
			expect(result.summary.scaling_table_count).toBe(6);
			expect(result.summary.scaling_table_entry_total).toBe(43);
			expect(result.summary.pseudo_code_block_count).toBe(4);
		});
	});
});
