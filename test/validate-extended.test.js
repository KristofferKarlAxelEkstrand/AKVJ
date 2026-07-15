import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// We'll create a minimal test directory structure and test the validation

describe('validate.js extended validation', () => {
	let tempDir;
	let validate;

	beforeEach(async () => {
		// Create a temp directory for test animations
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

		// Import the validate function
		const module = await import('../scripts/animations/lib/validate.js');
		validate = module.validate;
	});

	afterEach(async () => {
		// Clean up temp directory
		if (tempDir) {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	async function createTestAnimation(channelNoteVelocity, meta, hasPng = true) {
		const animDir = path.join(tempDir, channelNoteVelocity);
		await fs.mkdir(animDir, { recursive: true });
		await fs.writeFile(path.join(animDir, 'meta.json'), JSON.stringify(meta));
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
			await fs.writeFile(path.join(animDir, 'sprite.png'), minimalPng);
		}
	}

	describe('bitDepth validation', () => {
		test('accepts valid bitDepth values (1, 2, 4, 8)', async () => {
			const validBitDepths = [1, 2, 4, 8];

			for (const bitDepth of validBitDepths) {
				// Clean and recreate temp dir for each test
				await fs.rm(tempDir, { recursive: true, force: true });
				tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

				await createTestAnimation('0/0/0', {
					png: 'sprite.png',
					numberOfFrames: 1,
					framesPerRow: 1,
					bitDepth
				});

				const result = await validate(tempDir);
				expect(result.errors).toHaveLength(0);
				expect(result.valid).toHaveLength(1);
				expect(result.valid[0].meta.bitDepth).toBe(bitDepth);
			}
		});

		test('rejects invalid bitDepth values', async () => {
			const invalidBitDepths = [0, 3, 5, 16, 'invalid', null];

			for (const bitDepth of invalidBitDepths) {
				await fs.rm(tempDir, { recursive: true, force: true });
				tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-validate-test-'));

				await createTestAnimation('0/0/0', {
					png: 'sprite.png',
					numberOfFrames: 1,
					framesPerRow: 1,
					bitDepth
				});

				const result = await validate(tempDir);
				expect(result.errors).toHaveLength(1);
				expect(result.errors[0].errors.some(e => e.includes('bitDepth'))).toBe(true);
			}
		});

		test('allows omitting bitDepth entirely', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid).toHaveLength(1);
		});
	});

	describe('frameDurationBeats validation', () => {
		test('accepts single positive number (shorthand)', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1,
				frameDurationBeats: 0.5
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].meta.frameDurationBeats).toBe(0.5);
		});

		test('accepts array of positive numbers matching numberOfFrames', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1,
				frameDurationBeats: [0.5]
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].meta.frameDurationBeats).toEqual([0.5]);
		});

		test('rejects array with wrong length', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 4,
				framesPerRow: 1, // Note: will fail dimension check, but we test frameDurationBeats first
				frameDurationBeats: [1, 0.5] // Only 2 elements, should be 4
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats array length'))).toBe(true);
		});

		test('rejects non-positive numbers in array', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 4,
				framesPerRow: 1,
				frameDurationBeats: [1, 0, 0.5, 2] // 0 is not positive
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats[1]'))).toBe(true);
		});

		test('rejects negative shorthand value', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1,
				frameDurationBeats: -1
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats must be a positive number'))).toBe(true);
		});

		test('rejects zero shorthand value', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1,
				frameDurationBeats: 0
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats must be a positive number'))).toBe(true);
		});

		test('rejects invalid type (string)', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1,
				frameDurationBeats: 'invalid'
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errors.some(e => e.includes('frameDurationBeats must be'))).toBe(true);
		});

		test('allows omitting frameDurationBeats entirely', async () => {
			await createTestAnimation('0/0/0', {
				png: 'sprite.png',
				numberOfFrames: 1,
				framesPerRow: 1
			});

			const result = await validate(tempDir);
			expect(result.errors).toHaveLength(0);
		});
	});
});
