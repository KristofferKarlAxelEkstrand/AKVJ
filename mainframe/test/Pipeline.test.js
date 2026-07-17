import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { run } from '../scripts/clips/index.js';

const FIXTURE_BASE = path.join(process.cwd(), 'test', 'fixtures', 'pipeline-fixture');

async function setupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
	const dir = path.join(FIXTURE_BASE, 'fixture-clip');
	await fs.mkdir(dir, { recursive: true });
	const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AABQMBFADsZg8AAAAASUVORK5CYII=';
	await fs.writeFile(path.join(dir, 'sprite.png'), Buffer.from(pngBase64, 'base64'));
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }));
	await fs.writeFile(path.join(FIXTURE_BASE, 'key-map.json'), JSON.stringify({ 1: { 0: { 0: 'fixture-clip' } } }, null, '\t'));
}

async function cleanupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
}

describe('scripts/clips/index.js pipeline', () => {
	beforeEach(async () => {
		await setupFixture();
	});
	afterEach(async () => {
		await cleanupFixture();
	});

	test('validate-only returns without throwing', async () => {
		await expect(run({ validateOnly: true, sourceDir: FIXTURE_BASE })).resolves.toBeUndefined();
	});

	test('validate-only fails on invalid clips', async () => {
		await fs.writeFile(path.join(FIXTURE_BASE, 'fixture-clip', 'meta.json'), '{ invalid json');
		await expect(run({ validateOnly: true, sourceDir: FIXTURE_BASE })).rejects.toThrow();
	});
});
