import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp36 } from '../../lib/transformers/rp36Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp36.md');

let result;

beforeAll(async () => {
	result = await transformRp36(MARKDOWN_PATH);
});

describe('RP-036 Default Pan Formula Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('RP-036');
			expect(result.metadata.title).toContain('Default Pan Formula');
			expect(result.metadata.doc_id).toBe('RP-036');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Pan Formula', () => {
		it('should have CC#10 as the pan controller', () => {
			expect(result.pan_formula.cc_number).toBe(10);
			expect(result.pan_formula.cc_name).toBe('Pan');
		});

		it('should have default value 64 (0x40)', () => {
			expect(result.pan_formula.default_value).toBe(64);
			expect(result.pan_formula.default_value_hex).toBe('0x40');
		});

		it('should have center note', () => {
			expect(result.pan_formula.center_note).toContain('Center');
		});

		it('should have range 0-127 with hard left values 0 and 1', () => {
			expect(result.pan_formula.range_min).toBe(0);
			expect(result.pan_formula.range_max).toBe(127);
			expect(result.pan_formula.hard_left_values).toEqual([0, 1]);
		});

		it('should have left channel gain formula', () => {
			expect(result.pan_formula.formulas.left_channel_gain_db).toContain('20*log');
			expect(result.pan_formula.formulas.left_channel_gain_db).toContain('cos');
		});

		it('should have right channel gain formula', () => {
			expect(result.pan_formula.formulas.right_channel_gain_db).toContain('20*log');
			expect(result.pan_formula.formulas.right_channel_gain_db).toContain('sin');
		});

		it('should have description about stereo position', () => {
			expect(result.pan_formula.description).toContain('stereo position');
		});

		it('should have notes about center and range', () => {
			expect(result.pan_formula.notes).toBeDefined();
			expect(result.pan_formula.notes.length).toBeGreaterThanOrEqual(2);
		});

		it('should mention amending GM2 (RP-024)', () => {
			expect(result.pan_formula.amends).toContain('General MIDI 2');
			expect(result.pan_formula.amends).toContain('RP-024');
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('08/02');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('11/02');
		});

		it('should have copyright', () => {
			expect(result.approval.copyright).toContain('2002');
		});
	});

	describe('Summary', () => {
		it('should have formula and note counts', () => {
			expect(result.summary.formula_count).toBe(2);
			expect(result.summary.note_count).toBeGreaterThanOrEqual(2);
		});
	});
});
