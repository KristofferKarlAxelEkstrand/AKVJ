import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp17 } from '../../lib/transformers/rp17Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp17-smf-lyric-events-definition.md');

let result;

beforeAll(async () => {
	result = await transformRp17(MARKDOWN_PATH);
});

describe('RP-017 SMF Lyric Meta Event Definition Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.doc_id).toBe('RP-017');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(2);
		});
	});

	describe('Description', () => {
		it('should mention Lyric Meta Events', () => {
			expect(result.description).toContain('Lyric Meta Events');
		});

		it('should mention Standard MIDI File', () => {
			expect(result.description).toContain('Standard MIDI File');
		});

		it('should mention incompatible implementations', () => {
			expect(result.description).toContain('incompatible');
		});
	});

	describe('Rules', () => {
		it('should have 7 rules', () => {
			expect(result.rules).toHaveLength(7);
		});

		it('should have syllable rule as rule 1', () => {
			const r1 = result.rules.find(r => r.step === 1);
			expect(r1).toBeDefined();
			expect(r1.title).toContain('syllable');
		});

		it('should have space delimiter as rule 2', () => {
			const r2 = result.rules.find(r => r.step === 2);
			expect(r2).toBeDefined();
			expect(r2.title).toContain('Space');
			expect(r2.title).toContain('Delimiter');
		});

		it('should have punctuation as rule 3', () => {
			const r3 = result.rules.find(r => r.step === 3);
			expect(r3).toBeDefined();
			expect(r3.title).toContain('Punctuation');
		});

		it('should have Carriage Return as rule 4', () => {
			const r4 = result.rules.find(r => r.step === 4);
			expect(r4).toBeDefined();
			expect(r4.title).toContain('Carriage Return');
		});

		it('should have Line Feed as rule 5', () => {
			const r5 = result.rules.find(r => r.step === 5);
			expect(r5).toBeDefined();
			expect(r5.title).toContain('Line Feed');
		});

		it('should have Hyphenation as rule 6', () => {
			const r6 = result.rules.find(r => r.step === 6);
			expect(r6).toBeDefined();
			expect(r6.title).toContain('Hyphenation');
		});

		it('should have Melisma Event as rule 7', () => {
			const r7 = result.rules.find(r => r.step === 7);
			expect(r7).toBeDefined();
			expect(r7.title).toContain('Melisma');
		});
	});

	describe('Example', () => {
		it('should have example lines', () => {
			expect(result.example.length).toBeGreaterThanOrEqual(10);
		});

		it('should include Meta Lyric entries', () => {
			const allExamples = result.example.join('\n');
			expect(allExamples).toContain('Meta');
			expect(allExamples).toContain('Lyric');
		});

		it('should include CR and LF', () => {
			const allExamples = result.example.join('\n');
			expect(allExamples).toContain('[CR]');
			expect(allExamples).toContain('[LF]');
		});
	});

	describe('Additional Recommendations', () => {
		it('should have 3 additional recommendations', () => {
			expect(result.additional_recommendations).toHaveLength(3);
		});

		it('should include First Lyric Meta Event placement', () => {
			const r1 = result.additional_recommendations.find(r => r.title.includes('First Lyric'));
			expect(r1).toBeDefined();
		});

		it('should include Number of Characters before Line Return', () => {
			const r2 = result.additional_recommendations.find(r => r.title.includes('Number of Characters'));
			expect(r2).toBeDefined();
		});

		it('should include Reserved ASCII Characters', () => {
			const r3 = result.additional_recommendations.find(r => r.title.includes('Reserved ASCII'));
			expect(r3).toBeDefined();
		});
	});

	describe('Accepted Characters', () => {
		it('should mention letters and digits', () => {
			expect(result.accepted_characters).toContain('A B C D');
			expect(result.accepted_characters).toContain('0 1 2 3');
		});

		it('should mention SPACE, CR, LF', () => {
			expect(result.accepted_characters).toContain('SPACE');
			expect(result.accepted_characters).toContain('CR');
			expect(result.accepted_characters).toContain('LF');
		});
	});

	describe('Reserved Characters', () => {
		it('should mention backslash and brackets', () => {
			expect(result.reserved_characters).toContain('\\');
			expect(result.reserved_characters).toContain('[');
			expect(result.reserved_characters).toContain(']');
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('11/14/97');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('10/3/97');
		});
	});

	describe('Summary', () => {
		it('should have counts', () => {
			expect(result.summary.rule_count).toBe(7);
			expect(result.summary.additional_recommendation_count).toBe(3);
		});
	});
});
