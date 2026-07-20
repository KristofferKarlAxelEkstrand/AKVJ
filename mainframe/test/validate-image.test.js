import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { validateImageDimensions } from '../scripts/clips/lib/validate/image.js';

describe('validateImageDimensions', () => {
	let tempDir;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-image-'));
	});

	afterEach(async () => {
		if (tempDir) {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	/**
	 * @param {number} width
	 * @param {number} height
	 * @returns {Promise<string>}
	 */
	async function writePng(width, height) {
		const pngPath = path.join(tempDir, `${width}x${height}.png`);
		const buffer = await sharp({
			create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } }
		})
			.png()
			.toBuffer();
		await fs.writeFile(pngPath, buffer);
		return pngPath;
	}

	test('returns no errors when dimensions match meta', async () => {
		const pngPath = await writePng(8, 4);
		const errors = await validateImageDimensions(pngPath, { frames: 4, framesPerRow: 2 });
		expect(errors).toEqual([]);
	});

	test('reports when width is not divisible by framesPerRow', async () => {
		const pngPath = await writePng(10, 10);
		const errors = await validateImageDimensions(pngPath, { frames: 1, framesPerRow: 3 });
		expect(errors).toContain('Image width (10) must be divisible by framesPerRow (3)');
	});

	test('reports when height is not divisible by row count', async () => {
		const pngPath = await writePng(8, 9);
		const errors = await validateImageDimensions(pngPath, { frames: 3, framesPerRow: 2 });
		expect(errors).toContain('Image height (9) must be divisible by number of rows (2)');
	});

	test('reports when PNG path is unreadable', async () => {
		const missing = path.join(tempDir, 'missing.png');
		const errors = await validateImageDimensions(missing, { frames: 1, framesPerRow: 1 });
		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatch(/^Failed to read image dimensions:/);
	});

	test('returns [] when pngPath is missing or frame counts are non-positive', async () => {
		const pngPath = await writePng(4, 4);
		expect(await validateImageDimensions('', { frames: 1, framesPerRow: 1 })).toEqual([]);
		expect(await validateImageDimensions(null, { frames: 1, framesPerRow: 1 })).toEqual([]);
		expect(await validateImageDimensions(pngPath, { frames: 0, framesPerRow: 1 })).toEqual([]);
		expect(await validateImageDimensions(pngPath, { frames: 1, framesPerRow: 0 })).toEqual([]);
		expect(await validateImageDimensions(pngPath, { framesPerRow: 1 })).toEqual([]);
	});
});
