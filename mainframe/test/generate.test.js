import fs from 'fs/promises';
import path from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { generate } from '../scripts/clips/lib/generate.js';

const FIXTURE_BASE = path.join(process.cwd(), 'test', 'fixtures', 'generate-fixture');

async function setupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
	const dir = path.join(FIXTURE_BASE, 'clip-a');
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'sprite.png'), '');
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }));

	const dir2 = path.join(FIXTURE_BASE, 'clip-b');
	await fs.mkdir(dir2, { recursive: true });
	await fs.writeFile(path.join(dir2, 'frames.png'), '');
	await fs.writeFile(path.join(dir2, 'meta.json'), JSON.stringify({ frames: 2, framesPerRow: 1 }));
}

async function cleanupFixture() {
	await fs.rm(FIXTURE_BASE, { recursive: true, force: true });
}

describe('scripts/clips/lib/generate.js', () => {
	beforeEach(async () => {
		await setupFixture();
	});
	afterEach(async () => {
		await cleanupFixture();
	});

	test('generates flat clips.json with explicit png from metadata', async () => {
		const outPath = path.join(FIXTURE_BASE, 'clips.json');
		const result = await generate(FIXTURE_BASE, outPath);
		expect(result).toHaveProperty('clip-a');
		expect(result['clip-a'].png).toBe('sprite.png');
		expect(result['clip-a'].frames).toBe(1);
	});

	test('uses png filename when metadata lacks png field', async () => {
		const outPath = path.join(FIXTURE_BASE, 'clips.json');
		const result = await generate(FIXTURE_BASE, outPath);
		expect(result['clip-b'].png).toBe('frames.png');
		expect(result['clip-b'].frames).toBe(2);
	});
});
