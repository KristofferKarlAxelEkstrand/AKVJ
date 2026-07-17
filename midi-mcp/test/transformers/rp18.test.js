import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp18 } from '../../lib/transformers/rp18Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp18.md');

let result;

beforeAll(async () => {
	result = await transformRp18(MARKDOWN_PATH);
});

describe('RP-018 Response to Data Inc/Dec Controllers Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('RP-018');
			expect(result.metadata.title).toContain('Data Inc/Dec');
			expect(result.metadata.doc_id).toBe('RP-018');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Controllers', () => {
		it('should have 2 controllers (Data Increment and Data Decrement)', () => {
			expect(result.controllers).toHaveLength(2);
		});

		it('should parse Data Increment (CC#96, 0x60)', () => {
			const entry = result.controllers.find(e => e.cc_number === 96);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Data Increment');
			expect(entry.cc_hex).toBe('0x60');
		});

		it('should parse Data Decrement (CC#97, 0x61)', () => {
			const entry = result.controllers.find(e => e.cc_number === 97);
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Data Decrement');
			expect(entry.cc_hex).toBe('0x61');
		});
	});

	describe('Problems', () => {
		it('should have 2 problems', () => {
			expect(result.problems).toHaveLength(2);
		});

		it('should describe value byte problem', () => {
			const problem1 = result.problems.find(e => e.step === 1);
			expect(problem1).toBeDefined();
			expect(problem1.description).toContain('value');
		});

		it('should describe MSB/LSB problem', () => {
			const problem2 = result.problems.find(e => e.step === 2);
			expect(problem2).toBeDefined();
			expect(problem2.description).toContain('MSB');
			expect(problem2.description).toContain('LSB');
		});
	});

	describe('Recommendation', () => {
		it('should have recommendation text', () => {
			expect(result.recommendation).toContain('value byte');
			expect(result.recommendation).toContain('don\'t care');
		});
	});

	describe('RPN Behavior', () => {
		it('should have RPN behavior entries', () => {
			expect(result.rpn_behavior.length).toBeGreaterThanOrEqual(2);
		});

		it('should mention RPN 0 and 1 (LSB by 1)', () => {
			const rpn0 = result.rpn_behavior.find(e => e.includes('0, and 1'));
			expect(rpn0).toBeDefined();
			expect(rpn0).toContain('LSB');
		});

		it('should mention RPN 2, 3, 4 (MSB by 1)', () => {
			const rpn2 = result.rpn_behavior.find(e => e.includes('2, 3, and 4'));
			expect(rpn2).toBeDefined();
			expect(rpn2).toContain('MSB');
		});
	});

	describe('NRPN Behavior', () => {
		it('should mention manufacturer specification', () => {
			expect(result.nrpn_behavior).toContain('Non-Registered');
			expect(result.nrpn_behavior).toContain('manufacturer');
		});
	});

	describe('Receiving Device Rules', () => {
		it('should have receiving rules', () => {
			expect(result.receiving_device_rules.length).toBeGreaterThanOrEqual(2);
		});

		it('should mention LSB wrapping', () => {
			const allRules = result.receiving_device_rules.join(' ');
			expect(allRules).toContain('wraps');
		});
	});

	describe('Example', () => {
		it('should have description about pitch bend sensitivity', () => {
			expect(result.example.description).toContain('pitch bend sensitivity');
		});

		it('should have 6 example steps', () => {
			expect(result.example.steps).toHaveLength(6);
		});

		it('should have increment steps', () => {
			const incrementSteps = result.example.steps.filter(e => e.description.includes('increment'));
			expect(incrementSteps.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('9/97');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('10/97');
		});

		it('should have copyright', () => {
			expect(result.approval.copyright).toContain('1997');
		});
	});

	describe('Summary', () => {
		it('should have all counts', () => {
			expect(result.summary.controller_count).toBe(2);
			expect(result.summary.problem_count).toBe(2);
			expect(result.summary.example_step_count).toBe(6);
		});
	});
});
