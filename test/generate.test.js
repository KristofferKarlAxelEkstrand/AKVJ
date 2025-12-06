import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { generate } from '../scripts/animations/lib/generate.js';

const FIXTURE_BASE = path.join(process.cwd(), 'test', 'fixtures', 'generate-fixture');

async function setupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
	const dir = path.join(FIXTURE_BASE, '0', '0', '0');
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), '');
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1 }));

	// Variant without meta.png set, but PNG present
	const dir2 = path.join(FIXTURE_BASE, '0', '0', '1');
	await fs.mkdir(dir2, { recursive: true });
	await fs.writeFile(path.join(dir2, 'frames.png'), '');
	await fs.writeFile(path.join(dir2, 'meta.json'), JSON.stringify({ numberOfFrames: 2, framesPerRow: 1 }));
}

async function cleanupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
}

describe('scripts/animations/lib/generate.js', () => {
	beforeEach(async () => {
		await setupFixture();
	});
	afterEach(async () => {
		await cleanupFixture();
	});

	test('generates animations.json with explicit png from metadata', async () => {
		const outPath = path.join(FIXTURE_BASE, 'animations.json');
		const result = await generate(FIXTURE_BASE, outPath);
		expect(result).toHaveProperty('0');
		expect(result['0']).toHaveProperty('0');
		expect(result['0']['0']).toHaveProperty('0');
		const entry = result['0']['0']['0'];
		expect(entry.png).toBe('sprite.png');
		expect(entry.numberOfFrames).toBe(1);
	});

	test('uses png filename when metadata lacks png field', async () => {
		const outPath = path.join(FIXTURE_BASE, 'animations.json');
		const result = await generate(FIXTURE_BASE, outPath);
		const entry = result['0']['0']['1'];
		expect(entry.png).toBe('frames.png');
		expect(entry.numberOfFrames).toBe(2);
	});
});
