import { describe, it, expect, beforeAll } from 'vitest';
import { transformStandardsIncorporateMidi } from '../../lib/transformers/standardsIncorporateMidiTransformer.js';
import path from 'node:path';

const MARKDOWN_PATH = path.resolve('data/standards-that-incorporate-midi-midi-org.md');

let result;

beforeAll(async () => {
	result = await transformStandardsIncorporateMidi(MARKDOWN_PATH);
});

describe('Standards that Incorporate MIDI Transformer', () => {
	it('should produce a result object', () => {
		expect(result).toBeDefined();
		expect(typeof result).toBe('object');
	});

	describe('Metadata', () => {
		it('should have correct metadata from frontmatter', () => {
			expect(result.metadata.title).toContain('Standards');
			expect(result.metadata.protocol).toBe('general');
		});
	});

	describe('Standards', () => {
		it('should have 12 standards', () => {
			expect(result.standards).toHaveLength(12);
		});

		it('should parse 1394TA entry', () => {
			const entry = result.standards.find(e => e.sdo === '1394TA');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('AM824');
			expect(entry.specification_number).toBe('1999014');
			expect(entry.form_of_reference).toContain('Normative');
			expect(entry.mma_references).toContain('RP-27');
		});

		it('should parse 3GPP/ETSI entry', () => {
			const entry = result.standards.find(e => e.sdo === '3GPP/ETSI');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('UMTS');
			expect(entry.mma_references).toContain('RP-01');
		});

		it('should parse CMIA entry', () => {
			const entry = result.standards.find(e => e.sdo === 'CMIA');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('MIDI Keyboards');
			expect(entry.specification_number).toBe('QB/T 4015-2010');
		});

		it('should parse IEC entries (3 total)', () => {
			const iecEntries = result.standards.filter(e => e.sdo === 'IEC');
			expect(iecEntries).toHaveLength(3);
		});

		it('should parse IEEE entry', () => {
			const entry = result.standards.find(e => e.sdo === 'IEEE');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('AVB');
			expect(entry.specification_number).toBe('1722');
		});

		it('should parse IETF entry', () => {
			const entry = result.standards.find(e => e.sdo === 'IETF');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('RTP');
			expect(entry.specification_number).toBe('RFC-6295');
		});

		it('should parse ISO/IEC JTC1 entries (2 total)', () => {
			const isoEntries = result.standards.filter(e => e.sdo === 'ISO/IEC JTC1');
			expect(isoEntries).toHaveLength(2);
		});

		it('should parse Khronos entry', () => {
			const entry = result.standards.find(e => e.sdo === 'Khronos');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('OpenSL ES');
		});

		it('should parse USB-IF entry', () => {
			const entry = result.standards.find(e => e.sdo === 'USB-IF');
			expect(entry).toBeDefined();
			expect(entry.specification_name).toContain('MIDI Devices');
			expect(entry.mma_references).toContain('General MIDI 1');
		});
	});

	describe('Summary', () => {
		it('should have standard count', () => {
			expect(result.summary.standard_count).toBe(12);
		});
	});
});
