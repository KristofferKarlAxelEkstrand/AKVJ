import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { run } from '../scripts/animations/index.js';

const FIXTURE_BASE = path.join(process.cwd(), 'test', 'fixtures', 'pipeline-fixture');

async function setupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
	const dir = path.join(FIXTURE_BASE, '0', '0', '0');
	await fs.mkdir(dir, { recursive: true });
	// 1x1 transparent PNG
	const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8AABQMBFADsZg8AAAAASUVORK5CYII=';
	await fs.writeFile(path.join(dir, 'sprite.png'), Buffer.from(pngBase64, 'base64'));
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1 }));
}

async function cleanupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
}

describe('scripts/animations/index.js pipeline', () => {
	beforeEach(async () => {
		await setupFixture();
	});
	afterEach(async () => {
		await cleanupFixture();
	});

	test('validate-only returns without throwing', async () => {
		await expect(run({ validateOnly: true, sourceDir: FIXTURE_BASE, exitOnError: false })).resolves.not.toThrow();
	});
});
