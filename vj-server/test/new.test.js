import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, afterEach } from 'vitest';
import { createClip } from '../scripts/clips/new.js';

const TEST_CLIP_ID = 'test-scaffold-clip';

describe('scripts/clips/new.js', () => {
	/** @type {string} */
	let clipsRoot;

	afterEach(async () => {
		if (clipsRoot) {
			await fs.rm(clipsRoot, { recursive: true, force: true });
		}
	});

	test('creates new clip meta.json scaffold', async () => {
		clipsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-new-clip-'));
		const dir = path.join(clipsRoot, TEST_CLIP_ID);

		await createClip(TEST_CLIP_ID, { clipsRoot });

		const meta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
		expect(meta.png).toBe('sprite.png');
	});

	test('rejects bare numeric clipIds', async () => {
		clipsRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-new-clip-'));
		await expect(createClip('5', { clipsRoot })).rejects.toThrow(/Invalid clipId/);
	});
});
