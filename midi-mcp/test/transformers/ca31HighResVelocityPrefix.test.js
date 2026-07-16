import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformCa31HighResVelocityPrefix } from '../../lib/transformers/ca31HighResVelocityPrefixTransformer.js';

describe('CC#88 High Resolution Velocity Prefix (CA-031) Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/ca31.md');
		result = await transformCa31HighResVelocityPrefix(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('CC #88 High Resolution Velocity Prefix');
		expect(result.metadata.doc_id).toBe('CA-031');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('ca31.md');
		expect(result.metadata.source_committee).toBe('AMEI MIDI 1.0 Board');
	});

	it('should have a non-empty abstract', () => {
		expect(result.abstract).toContain('Continuous Controller 88');
		expect(result.abstract).toContain('58H');
		expect(result.abstract).toContain('High Resolution Velocity Prefix');
	});

	it('should have a non-empty background', () => {
		expect(result.background).toContain('14-bit resolution');
		expect(result.background).toContain('compatibility');
	});

	describe('Message Format', () => {
		it('should have correct message format', () => {
			expect(result.message_format).not.toBeNull();
			expect(result.message_format.status_byte).toBe('Bn');
			expect(result.message_format.controller_number).toBe(88);
			expect(result.message_format.controller_hex).toBe('0x58');
			expect(result.message_format.data_byte).toBe('vv');
			expect(result.message_format.raw).toBe('Bn 58 vv');
		});

		it('should have data byte description', () => {
			expect(result.data_byte_description).toContain('lower 7 bits');
			expect(result.data_byte_description).toContain('Note On');
			expect(result.data_byte_description).toContain('velocity');
		});
	});

	describe('Velocity Range', () => {
		it('should have min 14-bit velocity as 0080H', () => {
			expect(result.velocity_range.min_14bit_hex).toBe('0080H');
		});

		it('should have max 14-bit velocity as 3FFFH', () => {
			expect(result.velocity_range.max_14bit_hex).toBe('3FFFH');
		});

		it('should have step count of 16256', () => {
			expect(result.velocity_range.step_count).toBe(16256);
		});
	});

	describe('Behavior Rules', () => {
		it('should have 12 rules', () => {
			expect(result.behavior_rules).toHaveLength(12);
			expect(result.summary.behavior_rule_count).toBe(12);
		});

		it('should contain rule about higher 7 bits', () => {
			const rule = result.behavior_rules.find(r => r.includes('higher 7 bits'));
			expect(rule).toBeDefined();
		});

		it('should contain rule about single message affecting next Note On/Off', () => {
			const rule = result.behavior_rules.find(r => r.includes('only affects the next'));
			expect(rule).toBeDefined();
		});

		it('should contain rule about clearing lower 7 bits', () => {
			const rule = result.behavior_rules.find(r => r.includes('cleared'));
			expect(rule).toBeDefined();
		});

		it('should contain rule about Running Status compatibility', () => {
			const rule = result.behavior_rules.find(r => r.includes('Running Status'));
			expect(rule).toBeDefined();
		});

		it('should contain rule about 9n kk 00 as Note Off', () => {
			const rule = result.behavior_rules.find(r => r.includes('9n kk 00'));
			expect(rule).toBeDefined();
		});

		it('should contain rule about receiver ignoring unrecognized message', () => {
			const rule = result.behavior_rules.find(r => r.includes('ignore'));
			expect(rule).toBeDefined();
		});
	});

	describe('Summary', () => {
		it('should have correct counts', () => {
			expect(result.summary.behavior_rule_count).toBe(12);
			expect(result.summary.has_message_format).toBe(true);
			expect(result.summary.has_velocity_range).toBe(true);
		});
	});
});
