import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { transformDlsProprietaryChunkIds } from '../../lib/transformers/dlsProprietaryChunkIdsTransformer.js';

describe('DLS Proprietary Chunk IDs Transformer', () => {
	let result;

	beforeAll(async () => {
		const docPath = path.resolve(__dirname, '../../data/dls-proprietary-chunk-ids-midi-org.md');
		result = await transformDlsProprietaryChunkIds(docPath);
	});

	it('should produce correct metadata', () => {
		expect(result.metadata.title).toBe('DLS Proprietary Chunk IDs');
		expect(result.metadata.protocol).toBe('midi1');
		expect(result.metadata.source).toBe('dls-proprietary-chunk-ids-midi-org.md');
		expect(result.metadata.as_of_date).toBe('November, 2004');
	});

	it('should have a non-empty description', () => {
		expect(result.description.length).toBeGreaterThan(50);
		expect(result.description).toContain('MMA');
	});

	describe('Chunk IDs', () => {
		it('should have 5 entries', () => {
			expect(result.chunk_ids).toHaveLength(5);
			expect(result.summary.chunk_id_count).toBe(5);
		});

		it('should parse MMA_ as MIDI Manufacturers Association', () => {
			const entry = result.chunk_ids.find(c => c.chunk_id === 'MMA_');
			expect(entry).toBeDefined();
			expect(entry.manufacturer).toBe('MIDI Manufacturers Association');
		});

		it('should parse ESS_ as ESS Technology', () => {
			const entry = result.chunk_ids.find(c => c.chunk_id === 'ESS_');
			expect(entry).toBeDefined();
			expect(entry.manufacturer).toBe('ESS Technology');
		});

		it('should parse CRS_ as Crystal Semiconductor', () => {
			const entry = result.chunk_ids.find(c => c.chunk_id === 'CRS_');
			expect(entry).toBeDefined();
			expect(entry.manufacturer).toBe('Crystal Semiconductor');
		});

		it('should parse YMH_ as Yamaha Corporation', () => {
			const entry = result.chunk_ids.find(c => c.chunk_id === 'YMH_');
			expect(entry).toBeDefined();
			expect(entry.manufacturer).toBe('Yamaha Corporation');
		});

		it('should parse SEM_ as Sony Ericsson', () => {
			const entry = result.chunk_ids.find(c => c.chunk_id === 'SEM_');
			expect(entry).toBeDefined();
			expect(entry.manufacturer).toBe('Sony Ericsson');
		});

		it('should have all chunk IDs ending with underscore', () => {
			for (const entry of result.chunk_ids) {
				expect(entry.chunk_id).toMatch(/^[A-Z]{3}_$/);
			}
		});
	});

	describe('Summary', () => {
		it('should have correct count', () => {
			expect(result.summary.chunk_id_count).toBe(5);
		});
	});
});
