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

	test('skips folders with invalid clipId', async () => {
		const badDir = path.join(FIXTURE_BASE, 'bad id');
		await fs.mkdir(badDir, { recursive: true });
		await fs.writeFile(path.join(badDir, 'sprite.png'), '');
		await fs.writeFile(path.join(badDir, 'meta.json'), JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1 }));

		const outPath = path.join(FIXTURE_BASE, 'clips.json');
		const result = await generate(FIXTURE_BASE, outPath);
		expect(result).not.toHaveProperty('bad id');
		expect(result).toHaveProperty('clip-a');
		expect(result).toHaveProperty('clip-b');
	});

	test('corrupt meta.json still writes entry with png fallback', async () => {
		const dir = path.join(FIXTURE_BASE, 'clip-corrupt');
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, 'sheet.png'), '');
		await fs.writeFile(path.join(dir, 'meta.json'), '{ not-json');

		const outPath = path.join(FIXTURE_BASE, 'clips.json');
		const result = await generate(FIXTURE_BASE, outPath);
		expect(result['clip-corrupt']).toEqual({ png: 'sheet.png' });
	});

	test('folder with only png and no meta uses sprite filename', async () => {
		const dir = path.join(FIXTURE_BASE, 'clip-png-only');
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, 'sprite.png'), '');

		const outPath = path.join(FIXTURE_BASE, 'clips.json');
		const result = await generate(FIXTURE_BASE, outPath);
		expect(result['clip-png-only']).toEqual({ png: 'sprite.png' });

		const onDisk = JSON.parse(await fs.readFile(outPath, 'utf8'));
		expect(onDisk).toEqual(result);
	});
});
