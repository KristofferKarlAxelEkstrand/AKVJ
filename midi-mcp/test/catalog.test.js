import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { listDocs, loadCatalog, MISSING_DATA_MESSAGE } from '../lib/catalog.js';

async function makeFixtureDirs({ withData = true, withReference = true } = {}) {
	const root = await mkdtemp(path.join(tmpdir(), 'midi-mcp-catalog-'));
	const repo = path.join(root, 'repo');
	const mcp = path.join(repo, 'midi-mcp');
	await mkdir(mcp, { recursive: true });
	if (withData) {
		await mkdir(path.join(mcp, 'data'), { recursive: true });
		await writeFile(path.join(mcp, 'data', 'catalog.json'), JSON.stringify([{ name: 'spec-a', title: 'Spec A', protocol: 'midi1', summary: 'Test spec.', pages: 2 }]));
		await writeFile(path.join(mcp, 'data', 'spec-a.md'), '---\ntitle: Spec A\n---\n# Spec A\n\n## Page 1\n\nNote On details.\n');
	}
	if (withReference) {
		await mkdir(path.join(mcp, 'reference'), { recursive: true });
		await writeFile(path.join(mcp, 'reference', 'quick-ref.md'), '---\ntitle: Quick Ref\nprotocol: midi1\nsummary: Fast answers.\n---\n# Quick Ref\n\nStatus bytes table.\n');
	}
	return { mcp, repo };
}

describe('loadCatalog', () => {
	test('merges spec data and reference docs with tiers', async () => {
		const { mcp, repo } = await makeFixtureDirs();
		const { docs, byName, missingData } = await loadCatalog({ rootDir: mcp, repoDir: repo });
		expect(missingData).toBe(false);
		const spec = byName.get('spec-a');
		expect(spec.tier).toBe('spec');
		expect(spec.text).toContain('Note On details');
		expect(spec.text).not.toContain('---\ntitle');
		const reference = byName.get('quick-ref');
		expect(reference.tier).toBe('reference');
		expect(reference.protocol).toBe('midi1');
		expect(docs.length).toBe(2);
	});

	test('flags missing data/ but still loads reference docs', async () => {
		const { mcp, repo } = await makeFixtureDirs({ withData: false });
		const { docs, missingData } = await loadCatalog({ rootDir: mcp, repoDir: repo });
		expect(missingData).toBe(true);
		expect(docs.some(doc => doc.name === 'quick-ref')).toBe(true);
	});

	test('missing-data message tells agents how to rebuild', () => {
		expect(MISSING_DATA_MESSAGE).toContain('npm run midi:extract');
	});
});

describe('listDocs', () => {
	test('filters by protocol and tier and omits text bodies', async () => {
		const { mcp, repo } = await makeFixtureDirs();
		const { docs } = await loadCatalog({ rootDir: mcp, repoDir: repo });
		const referenceOnly = listDocs(docs, { tier: 'reference' });
		expect(referenceOnly.length).toBe(1);
		expect(referenceOnly[0].name).toBe('quick-ref');
		expect(referenceOnly[0].text).toBeUndefined();
		expect(listDocs(docs, { protocol: 'web-midi' })).toEqual([]);
	});
});
