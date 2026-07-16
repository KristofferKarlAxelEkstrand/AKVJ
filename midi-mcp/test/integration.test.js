import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../lib/catalog.js';
import { searchDocs } from '../lib/search.js';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

describe('Real Questions Integration Suite', () => {
	let catalogDocs = [];

	beforeAll(async () => {
		const { docs, missingData } = await loadCatalog({ rootDir: ROOT_DIR });

		if (missingData) {
			console.warn('Skipping integration tests because data/ corpus is missing. Run npm run extract first.');
		}
		catalogDocs = docs;
	});

	// Helper to check if a target doc is in the top N results
	function expectDocInTopResults(results, targetDocName, topN = 3) {
		const topDocs = results.slice(0, topN).map(r => r.doc);
		const found = topDocs.some(name => name.includes(targetDocName));
		if (!found) {
			throw new Error(`Expected "${targetDocName}" to be in top ${topN} results. Got: ${topDocs.join(', ')}`);
		}
	}

	it('should rank CC reference high for "CC 74"', () => {
		if (catalogDocs.length === 0) {
			return; // Skip if no data
		}

		const results = searchDocs(catalogDocs, { query: 'CC 74' });
		expect(results.length).toBeGreaterThan(0);
		// Expect the reference guide to be in the top 3
		expectDocInTopResults(results, 'midi-controller-reference');
	});

	it('should rank Web MIDI specs high for "requestMIDIAccess"', () => {
		if (catalogDocs.length === 0) {
			return;
		}

		const results = searchDocs(catalogDocs, { query: 'requestMIDIAccess' });
		expect(results.length).toBeGreaterThan(0);
		// The W3C spec or the reference guide should be at the top
		const topDocs = results.slice(0, 3).map(r => r.doc);
		const found = topDocs.some(name => name.includes('web-midi'));
		expect(found).toBe(true);
	});

	it('should rank the SysEx ID table high for "SysEx ID"', () => {
		if (catalogDocs.length === 0) {
			return;
		}

		const results = searchDocs(catalogDocs, { query: 'SysEx ID' });
		expect(results.length).toBeGreaterThan(0);

		const topDocs = results.slice(0, 3).map(r => r.doc);
		const found = topDocs.some(name => name.includes('sysex-id-table') || name.includes('dls-proprietary-chunk-ids'));
		expect(found).toBe(true);
	});

	it('should rank UMP specs high for "JR Timestamp"', () => {
		if (catalogDocs.length === 0) {
			return;
		}

		const results = searchDocs(catalogDocs, { query: 'JR Timestamp' });
		expect(results.length).toBeGreaterThan(0);

		const topDocs = results.slice(0, 3).map(r => r.doc);
		const found = topDocs.some(name => name.includes('m2-104-um-ump-and-midi-2-0-protocol-specification') || name.includes('midi2-ump-quick-reference'));
		expect(found).toBe(true);
	});
});
