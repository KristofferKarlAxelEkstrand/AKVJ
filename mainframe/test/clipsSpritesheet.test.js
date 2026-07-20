// @vitest-environment node

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseArgs, loadFrameFiles, writeMetaFile, createSpriteSheet } from '../scripts/clips/spritesheet.js';
import { PNG_1x1 } from './utils/pngFixtures.js';

describe('scripts/clips/spritesheet.js', () => {
	let root;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-clips-ss-'));
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	describe('parseArgs', () => {
		test('parses positional dirs and option flags', () => {
			expect(parseArgs(['./in', './out', '--frames-per-row', '4', '--frame-rate', '24'])).toEqual({
				inputDir: './in',
				outputDir: './out',
				framesPerRow: 4,
				frameRate: 24
			});
		});

		test('uses defaults when options omitted', () => {
			expect(parseArgs(['frames', 'clip'])).toEqual({
				inputDir: 'frames',
				outputDir: 'clip',
				framesPerRow: 16,
				frameRate: 12
			});
		});
	});

	describe('loadFrameFiles', () => {
		test('filters to image extensions and sorts by embedded number', async () => {
			const inputDir = path.join(root, 'frames');
			await fs.mkdir(inputDir);
			await fs.writeFile(path.join(inputDir, 'frame10.png'), PNG_1x1);
			await fs.writeFile(path.join(inputDir, 'frame2.png'), PNG_1x1);
			await fs.writeFile(path.join(inputDir, 'notes.txt'), 'ignore');
			await fs.writeFile(path.join(inputDir, 'frame1.JPG'), PNG_1x1);

			const files = await loadFrameFiles(inputDir);
			expect(files).toEqual(['frame1.JPG', 'frame2.png', 'frame10.png']);
		});

		test('throws when no images are present', async () => {
			const inputDir = path.join(root, 'empty');
			await fs.mkdir(inputDir);
			await fs.writeFile(path.join(inputDir, 'readme.md'), 'x');
			await expect(loadFrameFiles(inputDir)).rejects.toThrow(/No image files/);
		});
	});

	describe('writeMetaFile', () => {
		test('writes expected meta.json structure', async () => {
			const outputDir = path.join(root, 'out');
			await fs.mkdir(outputDir);
			await writeMetaFile(outputDir, 3, 2, 15);
			const meta = JSON.parse(await fs.readFile(path.join(outputDir, 'meta.json'), 'utf8'));
			expect(meta).toEqual({
				png: 'sprite.png',
				frames: 3,
				framesPerRow: 2,
				playback: 'loop',
				retrigger: true,
				frameRatesForFrames: { 0: 15 }
			});
		});
	});

	describe('createSpriteSheet', () => {
		test('builds sprite.png and meta.json from fixture frames', async () => {
			const inputDir = path.join(root, 'in');
			const outputDir = path.join(root, 'clip');
			await fs.mkdir(inputDir);
			for (const name of ['1.png', '2.png']) {
				await sharp(PNG_1x1).png().toFile(path.join(inputDir, name));
			}

			await createSpriteSheet(inputDir, outputDir, { framesPerRow: 2, frameRate: 12 });

			await expect(fs.access(path.join(outputDir, 'sprite.png'))).resolves.toBeUndefined();
			const meta = JSON.parse(await fs.readFile(path.join(outputDir, 'meta.json'), 'utf8'));
			expect(meta.frames).toBe(2);
			expect(meta.framesPerRow).toBe(2);
			const sheetMeta = await sharp(path.join(outputDir, 'sprite.png')).metadata();
			expect(sheetMeta.width).toBe(2);
			expect(sheetMeta.height).toBe(1);
		});
	});
});
