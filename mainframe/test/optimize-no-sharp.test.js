// @vitest-environment node
/**
 * Isolated from optimize.test.js so mocking `sharp` does not affect sharp-backed tests.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PNG_1x1 } from './utils/pngFixtures.js';

vi.mock('sharp', () => ({
	default: undefined
}));

const { optimize } = await import('../scripts/clips/lib/optimize.js');

describe('optimize without sharp', () => {
	let root;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-optimize-nosh-'));
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	test('optimize copies files and reports sharp: false when sharp is unavailable', async () => {
		const clipDir = path.join(root, 'clip-a');
		const cacheDir = path.join(root, 'cache');
		await fs.mkdir(clipDir, { recursive: true });
		const pngPath = path.join(clipDir, 'sprite.png');
		await fs.writeFile(pngPath, PNG_1x1);
		await fs.writeFile(path.join(clipDir, 'meta.json'), JSON.stringify({ png: 'sprite.png' }));

		const { results, sharp } = await optimize([{ clipId: 'clip-a', dir: clipDir, pngPath, meta: {} }], cacheDir);

		expect(sharp).toBe(false);
		expect(results[0].optimized).toBe(true);
		await expect(fs.access(path.join(cacheDir, 'clip-a', 'sprite.png'))).resolves.toBeUndefined();
		await expect(fs.access(path.join(cacheDir, 'clip-a', 'meta.json'))).resolves.toBeUndefined();
	});
});
