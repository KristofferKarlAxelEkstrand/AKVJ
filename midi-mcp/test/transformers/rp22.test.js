import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp22 } from '../../lib/transformers/rp22Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp22.md');

let result;

beforeAll(async () => {
	result = await transformRp22(MARKDOWN_PATH);
});

describe('RP-022 Redefinition of RPN 01/02 Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('RP-022');
			expect(result.metadata.title).toContain('RPN 01/02');
			expect(result.metadata.doc_id).toBe('RP-022');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('RPN Changes', () => {
		it('should have 2 RPN change steps', () => {
			expect(result.rpn_changes).toHaveLength(2);
		});

		it('should parse step 1 — rename RPN 01/02', () => {
			const step1 = result.rpn_changes.find(e => e.step === 1);
			expect(step1).toBeDefined();
			expect(step1.description).toContain('Channel Fine Tuning');
			expect(step1.description).toContain('Channel Coarse Tuning');
		});

		it('should parse step 2 — update Table IIIa', () => {
			const step2 = result.rpn_changes.find(e => e.step === 2);
			expect(step2).toBeDefined();
			expect(step2.description).toContain('Table IIIa');
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('02/99');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('05/99');
		});

		it('should have copyright', () => {
			expect(result.approval.copyright).toContain('1999');
		});
	});

	describe('Summary', () => {
		it('should have RPN change count', () => {
			expect(result.summary.rpn_change_count).toBe(2);
		});
	});
});
