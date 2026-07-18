// @vitest-environment node

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { copyToPublic, clean, removeEmptyDirs } from '../scripts/clips/lib/copy.js';

describe('scripts/clips/lib/copy.js', () => {
	let root;
	let cacheDir;
	let publicDir;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-copy-'));
		cacheDir = path.join(root, 'cache');
		publicDir = path.join(root, 'public');
		await fs.mkdir(cacheDir, { recursive: true });
		await fs.mkdir(publicDir, { recursive: true });
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	test('copyToPublic copies changed files, skips matches, removes orphans', async () => {
		await fs.mkdir(path.join(cacheDir, 'clip-a'), { recursive: true });
		await fs.writeFile(path.join(cacheDir, 'clip-a', 'sprite.png'), Buffer.from('new'));
		await fs.writeFile(path.join(cacheDir, 'clips.json'), '{"a":1}');
		await fs.writeFile(path.join(cacheDir, 'clip-a', 'sprite.png.hash'), 'ignored');

		await fs.mkdir(path.join(publicDir, 'clip-a'), { recursive: true });
		await fs.writeFile(path.join(publicDir, 'clip-a', 'sprite.png'), Buffer.from('old'));
		await fs.writeFile(path.join(publicDir, 'clips.json'), '{"a":1}');
		await fs.writeFile(path.join(publicDir, 'orphan.txt'), 'gone');

		const stats = await copyToPublic(cacheDir, publicDir);
		expect(stats.copied).toBeGreaterThanOrEqual(1);
		expect(stats.skipped).toBeGreaterThanOrEqual(1);
		expect(stats.removed).toBe(1);
		expect(await fs.readFile(path.join(publicDir, 'clip-a', 'sprite.png'), 'utf8')).toBe('new');
		await expect(fs.access(path.join(publicDir, 'orphan.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('copyToPublic preserves LICENSE files in public dir', async () => {
		await fs.writeFile(path.join(cacheDir, 'clips.json'), '{}');
		await fs.writeFile(path.join(publicDir, 'LICENSE-ASSETS.md'), 'keep me');
		await fs.writeFile(path.join(publicDir, 'stale.png'), 'remove');

		const stats = await copyToPublic(cacheDir, publicDir);
		expect(stats.removed).toBe(1);
		expect(await fs.readFile(path.join(publicDir, 'LICENSE-ASSETS.md'), 'utf8')).toBe('keep me');
	});

	test('removeEmptyDirs removes nested empty directories', async () => {
		const nested = path.join(publicDir, 'a', 'b', 'c');
		await fs.mkdir(nested, { recursive: true });
		await removeEmptyDirs(publicDir);
		await expect(fs.access(path.join(publicDir, 'a'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('clean removes cache and public generated files but preserves LICENSE', async () => {
		await fs.writeFile(path.join(cacheDir, 'x.png'), 'cache');
		await fs.writeFile(path.join(publicDir, 'y.png'), 'pub');
		await fs.writeFile(path.join(publicDir, 'LICENSE.txt'), 'license');

		await clean(cacheDir, publicDir);

		await expect(fs.access(cacheDir)).rejects.toMatchObject({ code: 'ENOENT' });
		await expect(fs.access(path.join(publicDir, 'y.png'))).rejects.toMatchObject({ code: 'ENOENT' });
		expect(await fs.readFile(path.join(publicDir, 'LICENSE.txt'), 'utf8')).toBe('license');
	});
});
