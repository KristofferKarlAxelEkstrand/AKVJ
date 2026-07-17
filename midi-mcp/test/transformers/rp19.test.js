import { describe, it, expect, beforeAll } from 'vitest';
import { transformRp19 } from '../../lib/transformers/rp19Transformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/rp19-smf-device-program-name-meta-events.md');

let result;

beforeAll(async () => {
	result = await transformRp19(MARKDOWN_PATH);
});

describe('RP-019 SMF Device/Program Name Meta Events Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('RP-019');
			expect(result.metadata.title).toContain('Device Name');
			expect(result.metadata.title).toContain('Program Name');
			expect(result.metadata.doc_id).toBe('RP-019');
			expect(result.metadata.protocol).toBe('midi1');
			expect(result.metadata.pages).toBe(1);
		});
	});

	describe('Meta Events', () => {
		it('should have 2 meta events', () => {
			expect(result.meta_events).toHaveLength(2);
		});

		it('should parse Device Name Meta Event (0x09)', () => {
			const entry = result.meta_events.find(e => e.meta_event_type === '0x09');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Device Name Meta Event');
			expect(entry.format).toBe('FF 09 len text');
			expect(entry.label).toBe('DEVICE NAME');
			expect(entry.description).toContain('name of the device');
		});

		it('should parse Program Name Meta Event (0x08)', () => {
			const entry = result.meta_events.find(e => e.meta_event_type === '0x08');
			expect(entry).toBeDefined();
			expect(entry.name).toBe('Program Name Meta Event');
			expect(entry.format).toBe('FF 08 len text');
			expect(entry.label).toBe('PROGRAM NAME');
			expect(entry.description).toContain('reorchestration');
		});
	});

	describe('Usage Rules', () => {
		it('should have usage rules', () => {
			expect(result.usage_rules.length).toBeGreaterThanOrEqual(5);
		});

		it('should mention Type 0 and Type 1 SMF', () => {
			const allRules = result.usage_rules.join(' ');
			expect(allRules).toContain('Type 0');
			expect(allRules).toContain('Type 1');
		});

		it('should mention 16 channels', () => {
			const allRules = result.usage_rules.join(' ');
			expect(allRules).toContain('16 channels');
		});
	});

	describe('Device Naming Recommendations', () => {
		it('should have recommendations', () => {
			expect(result.device_naming_recommendations.length).toBeGreaterThanOrEqual(10);
		});

		it('should mention widespread distribution', () => {
			const allRecs = result.device_naming_recommendations.join(' ');
			expect(allRecs).toContain('widespread distribution');
		});
	});

	describe('Approval', () => {
		it('should have MMA approval date', () => {
			expect(result.approval.mma_date).toBe('4/10/98');
		});

		it('should have AMEI approval date', () => {
			expect(result.approval.amei_date).toBe('5/7/99');
		});

		it('should have copyright year', () => {
			expect(result.approval.copyright).toBe('1999');
		});
	});

	describe('Summary', () => {
		it('should have all summary counts', () => {
			expect(result.summary.meta_event_count).toBe(2);
			expect(result.summary.usage_rule_count).toBeGreaterThanOrEqual(5);
			expect(result.summary.device_naming_recommendation_count).toBeGreaterThanOrEqual(10);
		});
	});
});
