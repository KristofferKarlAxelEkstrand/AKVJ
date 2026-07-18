import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// We'll create a minimal test directory structure and test the validation

describe('validate.js extended validation', () => {
	let testClipsDir;
	let validate;

	beforeEach(async () => {
		// Create a temp directory for test clips
		testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

		// Import the validate function
		const module = await import('../scripts/clips/lib/validate.js');
		validate = module.validate;
	});

	afterEach(async () => {
		// Clean up temp directory
		if (testClipsDir) {
			await fs.rm(testClipsDir, { recursive: true, force: true });
		}
	});

	async function createTestClip(clipId, meta, hasPng = true) {
		const clipDir = path.join(testClipsDir, clipId);
		await fs.mkdir(clipDir, { recursive: true });
		await fs.writeFile(path.join(clipDir, 'meta.json'), JSON.stringify(meta));
		if (hasPng) {
			// Create a minimal valid 1x1 PNG
			// This is a minimal valid 1x1 pixel transparent PNG
			const minimalPng = Buffer.from([
				0x89,
				0x50,
				0x4e,
				0x47,
				0x0d,
				0x0a,
				0x1a,
				0x0a, // PNG signature
				0x00,
				0x00,
				0x00,
				0x0d,
				0x49,
				0x48,
				0x44,
				0x52, // IHDR chunk
				0x00,
				0x00,
				0x00,
				0x01,
				0x00,
				0x00,
				0x00,
				0x01, // 1x1 dimensions
				0x08,
				0x02,
				0x00,
				0x00,
				0x00,
				0x90,
				0x77,
				0x53,
				0xde, // bit depth, color type, etc
				0x00,
				0x00,
				0x00,
				0x0c,
				0x49,
				0x44,
				0x41,
				0x54, // IDAT chunk
				0x08,
				0xd7,
				0x63,
				0xf8,
				0xff,
				0xff,
				0x3f,
				0x00, // compressed data
				0x05,
				0xfe,
				0x02,
				0xfe,
				0xa5,
				0x56,
				0x68,
				0x3e, // CRC
				0x00,
				0x00,
				0x00,
				0x00,
				0x49,
				0x45,
				0x4e,
				0x44, // IEND chunk
				0xae,
				0x42,
				0x60,
				0x82
			]);
			await fs.writeFile(path.join(clipDir, 'sprite.png'), minimalPng);
		}
	}

	describe('bitDepth validation', () => {
		test('accepts valid bitDepth values (1, 2, 4, 8)', async () => {
			const validBitDepths = [1, 2, 4, 8];

			for (const bitDepth of validBitDepths) {
				// Clean and recreate temp dir for each test
				await fs.rm(testClipsDir, { recursive: true, force: true });
				testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

				await createTestClip('test-clip', {
					png: 'sprite.png',
					frames: 1,
					framesPerRow: 1,
					bitDepth
				});

				const result = await validate(testClipsDir);
				expect(result.errors).toHaveLength(0);
				expect(result.valid).toHaveLength(1);
				expect(result.valid[0].meta.bitDepth).toBe(bitDepth);
			}
		});

		test('rejects invalid bitDepth values', async () => {
			const invalidBitDepths = [0, 3, 5, 16, 'invalid', null];

			for (const bitDepth of invalidBitDepths) {
				await fs.rm(testClipsDir, { recursive: true, force: true });
				testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

				await createTestClip('test-clip', {
					png: 'sprite.png',
					frames: 1,
					framesPerRow: 1,
					bitDepth
				});

				const result = await validate(testClipsDir);
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].errors.some(e => e.includes('bitDepth'))).toBe(true);
			}
		});

		test('allows omitting bitDepth entirely', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid).toHaveLength(1);
		});
	});

	describe('playback validation', () => {
		test('accepts valid playback values', async () => {
			const validModes = ['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub'];

			for (const playback of validModes) {
				await fs.rm(testClipsDir, { recursive: true, force: true });
				testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

				await createTestClip('test-clip', {
					png: 'sprite.png',
					frames: 1,
					framesPerRow: 1,
					playback
				});

				const result = await validate(testClipsDir);
				expect(result.errors).toHaveLength(0);
				expect(result.valid).toHaveLength(1);
				expect(result.valid[0].meta.playback).toBe(playback);
			}
		});

		test('rejects invalid playback values', async () => {
			const invalidModes = ['invalid', 'pongping', 123, null, true, false];

			for (const playback of invalidModes) {
				await fs.rm(testClipsDir, { recursive: true, force: true });
				testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

				await createTestClip('test-clip', {
					png: 'sprite.png',
					frames: 1,
					framesPerRow: 1,
					playback
				});

				const result = await validate(testClipsDir);
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].errors.some(e => e.includes('playback must be one of'))).toBe(true);
			}
		});

		test('migrates loop boolean to playback', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				loop: true
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].meta.playback).toBe('loop');
			expect(result.valid[0].meta.loop).toBeUndefined();

			// Test false -> once
			await fs.rm(testClipsDir, { recursive: true, force: true });
			testClipsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

			await createTestClip('test-clip2', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				loop: false
			});

			const result2 = await validate(testClipsDir);
			expect(result2.errors).toHaveLength(0);
			expect(result2.valid[0].meta.playback).toBe('once');
		});
	});

	describe('frameDurationBeats validation', () => {
		test('accepts single positive number (shorthand)', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				frameDurationBeats: 0.5
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].meta.frameDurationBeats).toBe(0.5);
		});

		test('accepts array of positive numbers matching frames', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				frameDurationBeats: [0.5]
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].meta.frameDurationBeats).toEqual([0.5]);
		});

		test('rejects array with wrong length', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 4,
				framesPerRow: 1, // Note: will fail dimension check, but we test frameDurationBeats first
				frameDurationBeats: [1, 0.5] // Only 2 elements, should be 4
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats array length'))).toBe(true);
		});

		test('rejects non-positive numbers in array', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 4,
				framesPerRow: 1,
				frameDurationBeats: [1, 0, 0.5, 2] // 0 is not positive
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats[1]'))).toBe(true);
		});

		test('rejects negative shorthand value', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				frameDurationBeats: -1
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats must be a positive number'))).toBe(true);
		});

		test('rejects zero shorthand value', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				frameDurationBeats: 0
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats must be a positive number'))).toBe(true);
		});

		test('rejects invalid type (string)', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				frameDurationBeats: 'invalid'
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats must be'))).toBe(true);
		});

		test('allows omitting frameDurationBeats entirely', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
		});
	});

	describe('sync field validation', () => {
		test('accepts valid sync: "free"', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'free'
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
		});

		test('accepts valid sync: "beat" with preset syncLength', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: '1 bar',
				beatsPerBar: 4
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
		});

		test('accepts custom syncLength with syncBeats', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: 'custom',
				syncBeats: 6
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
		});

		test('rejects invalid sync mode', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'bogus'
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toContainEqual(expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('sync must be one of')]) }));
		});

		test('rejects invalid syncLength preset', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: '3 beats'
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toContainEqual(expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('syncLength must be one of')]) }));
		});

		test('rejects custom syncLength without syncBeats', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: 'custom'
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toContainEqual(expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('syncBeats is required')]) }));
		});

		test('rejects non-positive syncBeats', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: 'custom',
				syncBeats: -1
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toContainEqual(expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('syncBeats must be a positive number')]) }));
		});

		test('rejects non-integer beatsPerBar', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: '1 bar',
				beatsPerBar: 3.5
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toContainEqual(expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('beatsPerBar must be a positive integer')]) }));
		});

		test('rejects non-positive beatsPerBar', async () => {
			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				sync: 'beat',
				syncLength: '1 bar',
				beatsPerBar: 0
			});
			const result = await validate(testClipsDir);
			expect(result.errors).toContainEqual(expect.objectContaining({ errors: expect.arrayContaining([expect.stringContaining('beatsPerBar must be a positive integer')]) }));
		});
	});
});
