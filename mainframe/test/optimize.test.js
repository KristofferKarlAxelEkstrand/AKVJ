// @vitest-environment node

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	optimize,
	optimizeFile,
	finalizeOptimizedFile,
	handleOptimizeError,
	copyClipJsonFiles
} from '../scripts/clips/lib/optimize.js';
import { hashFile, writeHashFile } from '../scripts/clips/lib/hash.js';
import { PNG_1x1 } from './utils/pngFixtures.js';

describe('scripts/clips/lib/optimize.js', () => {
	let root;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-optimize-'));
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	test('optimizeFile copies when sharp is null', async () => {
		const sourcePath = path.join(root, 'sprite.png');
		const cachePath = path.join(root, 'cache', 'sprite.png');
		await fs.writeFile(sourcePath, PNG_1x1);

		const result = await optimizeFile(sourcePath, cachePath, null);
		expect(result).toMatchObject({ skipped: false, optimized: true, bitDepth: null });
		expect(await fs.readFile(cachePath)).toEqual(PNG_1x1);
		await expect(fs.access(`${cachePath}.hash`)).resolves.toBeUndefined();
	});

	test('optimizeFile skips when cache is valid', async () => {
		const sourcePath = path.join(root, 'sprite.png');
		const cachePath = path.join(root, 'cache', 'sprite.png');
		await fs.mkdir(path.dirname(cachePath), { recursive: true });
		await fs.writeFile(sourcePath, PNG_1x1);
		await fs.writeFile(cachePath, PNG_1x1);
		const hash = await hashFile(sourcePath);
		await writeHashFile(`${cachePath}.hash`, hash);

		const result = await optimizeFile(sourcePath, cachePath, null);
		expect(result).toMatchObject({ skipped: true, optimized: false });
	});

	test('finalizeOptimizedFile keeps optimized file when smaller', async () => {
		const sourcePath = path.join(root, 'source.png');
		const cachePath = path.join(root, 'out.png');
		const tempFilePath = `${cachePath}.tmp`;
		await fs.writeFile(sourcePath, Buffer.alloc(200, 1));
		await fs.writeFile(tempFilePath, Buffer.alloc(50, 2));

		const size = await finalizeOptimizedFile(sourcePath, cachePath, tempFilePath, 50, null, 200);
		expect(size).toBe(50);
		expect(await fs.readFile(cachePath)).toEqual(Buffer.alloc(50, 2));
		await expect(fs.access(tempFilePath)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('finalizeOptimizedFile falls back to source when optimized is not smaller (no bitDepth)', async () => {
		const sourcePath = path.join(root, 'source.png');
		const cachePath = path.join(root, 'out.png');
		const tempFilePath = `${cachePath}.tmp`;
		await fs.writeFile(sourcePath, Buffer.alloc(40, 1));
		await fs.writeFile(tempFilePath, Buffer.alloc(80, 2));

		const size = await finalizeOptimizedFile(sourcePath, cachePath, tempFilePath, 80, null, 40);
		expect(size).toBe(40);
		expect(await fs.readFile(cachePath)).toEqual(Buffer.alloc(40, 1));
		await expect(fs.access(tempFilePath)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('finalizeOptimizedFile always keeps bitDepth output regardless of size', async () => {
		const sourcePath = path.join(root, 'source.png');
		const cachePath = path.join(root, 'out.png');
		const tempFilePath = `${cachePath}.tmp`;
		await fs.writeFile(sourcePath, Buffer.alloc(40, 1));
		await fs.writeFile(tempFilePath, Buffer.alloc(80, 2));

		const size = await finalizeOptimizedFile(sourcePath, cachePath, tempFilePath, 80, 1, 40);
		expect(size).toBe(80);
		expect(await fs.readFile(cachePath)).toEqual(Buffer.alloc(80, 2));
	});

	test('handleOptimizeError cleans temp file and copies source fallback', async () => {
		const sourcePath = path.join(root, 'source.png');
		const cachePath = path.join(root, 'out.png');
		const tempFilePath = `${cachePath}.tmp`;
		await fs.writeFile(sourcePath, PNG_1x1);
		await fs.writeFile(tempFilePath, Buffer.alloc(8, 9));

		await expect(handleOptimizeError(sourcePath, cachePath, tempFilePath, true, new Error('sharp failed'))).rejects.toThrow(
			/optimize error: sharp failed/
		);
		await expect(fs.access(tempFilePath)).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await fs.readFile(cachePath)).toEqual(PNG_1x1);
	});

	test('copyClipJsonFiles copies only .json files', async () => {
		const clipDir = path.join(root, 'clip');
		const cacheDir = path.join(root, 'cache');
		await fs.mkdir(clipDir, { recursive: true });
		await fs.writeFile(path.join(clipDir, 'meta.json'), '{"ok":true}');
		await fs.writeFile(path.join(clipDir, 'notes.txt'), 'nope');
		await fs.writeFile(path.join(clipDir, 'sprite.png'), PNG_1x1);

		await copyClipJsonFiles(clipDir, cacheDir, 'clip');
		await expect(fs.access(path.join(cacheDir, 'clip', 'meta.json'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(cacheDir, 'clip', 'notes.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(fs.access(path.join(cacheDir, 'clip', 'sprite.png'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('optimize with sharp available returns sharp: true and copies json', async () => {
		const clipDir = path.join(root, 'clip-b');
		const cacheDir = path.join(root, 'cache-b');
		await fs.mkdir(clipDir, { recursive: true });
		const pngPath = path.join(clipDir, 'sprite.png');
		await fs.writeFile(pngPath, PNG_1x1);
		await fs.writeFile(path.join(clipDir, 'meta.json'), JSON.stringify({ png: 'sprite.png' }));

		const { sharp, results } = await optimize([{ clipId: 'clip-b', dir: clipDir, pngPath, meta: {} }], cacheDir);
		expect(sharp).toBe(true);
		expect(results).toHaveLength(1);
		expect(results[0].skipped || results[0].optimized).toBe(true);
		await expect(fs.access(path.join(cacheDir, 'clip-b', 'meta.json'))).resolves.toBeUndefined();
	});
});
