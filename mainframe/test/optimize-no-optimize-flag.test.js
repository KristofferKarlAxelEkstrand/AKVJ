// @vitest-environment node
/**
 * Isolated so mocking `sharp` does not affect sharp-backed optimize tests.
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PNG_1x1 } from './utils/pngFixtures.js';

const sharpFactory = vi.fn(() => {
	throw new Error('sharp must not run when noOptimize is true');
});

vi.mock('sharp', () => ({
	default: sharpFactory
}));

const { optimize } = await import('../scripts/clips/lib/optimize.js');

describe('optimize noOptimize flag', () => {
	let root;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-optimize-noopt-'));
		sharpFactory.mockClear();
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	test('noOptimize: true never loads or invokes sharp and still copies PNGs', async () => {
		const clipDir = path.join(root, 'clip-a');
		const cacheDir = path.join(root, 'cache');
		await fs.mkdir(clipDir, { recursive: true });
		const pngPath = path.join(clipDir, 'sprite.png');
		await fs.writeFile(pngPath, PNG_1x1);
		await fs.writeFile(path.join(clipDir, 'meta.json'), JSON.stringify({ png: 'sprite.png' }));

		const { results, sharp } = await optimize([{ clipId: 'clip-a', dir: clipDir, pngPath, meta: {} }], cacheDir, {
			noOptimize: true
		});

		expect(sharp).toBe(false);
		expect(sharpFactory).not.toHaveBeenCalled();
		expect(results[0].optimized).toBe(true);
		const cached = await fs.readFile(path.join(cacheDir, 'clip-a', 'sprite.png'));
		expect(cached.equals(PNG_1x1)).toBe(true);
	});
});
