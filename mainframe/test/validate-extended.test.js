import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { writeClip } from './utils/clipFixtures.js';

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
		await writeClip(testClipsDir, clipId, { meta, hasPng });
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

		test('accepts legacy loop boolean without mutating meta', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			await createTestClip('test-clip', {
				png: 'sprite.png',
				frames: 1,
				framesPerRow: 1,
				loop: true
			});

			const result = await validate(testClipsDir);
			expect(result.errors).toHaveLength(0);
			expect(result.valid[0].meta.loop).toBe(true);
			expect(result.valid[0].meta.playback).toBeUndefined();
			expect(warnSpy.mock.calls.some(call => String(call[0]).includes('"loop" property is deprecated'))).toBe(true);

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
			expect(result2.valid[0].meta.loop).toBe(false);
			expect(result2.valid[0].meta.playback).toBeUndefined();

			warnSpy.mockRestore();
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
