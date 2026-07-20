// @vitest-environment node

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { isPipelineReadyClip, listClips, readyClipIdSet, clipsRootFor } from '../server/clipCatalog.js';

describe('isPipelineReadyClip', () => {
	const readyMeta = { png: 'sprite.png', frames: 4, framesPerRow: 2 };

	test('accepts legacy meta.numberOfFrames alias', () => {
		expect(isPipelineReadyClip({ png: 'sprite.png', numberOfFrames: 3, framesPerRow: 1 }, true)).toBe(true);
	});

	test('rejects path traversal in meta.png', () => {
		expect(isPipelineReadyClip({ ...readyMeta, png: '../evil.png' }, true)).toBe(false);
		expect(isPipelineReadyClip({ ...readyMeta, png: 'subdir/sprite.png' }, true)).toBe(false);
	});

	test('rejects non-integer frames (float)', () => {
		expect(isPipelineReadyClip({ ...readyMeta, frames: 2.5 }, true)).toBe(false);
	});

	test('rejects framesPerRow of 0 or negative', () => {
		expect(isPipelineReadyClip({ ...readyMeta, framesPerRow: 0 }, true)).toBe(false);
		expect(isPipelineReadyClip({ ...readyMeta, framesPerRow: -1 }, true)).toBe(false);
	});

	test('rejects null or undefined meta', () => {
		expect(isPipelineReadyClip(null, true)).toBe(false);
		expect(isPipelineReadyClip(undefined, true)).toBe(false);
	});

	test('rejects when hasSprite is false', () => {
		expect(isPipelineReadyClip(readyMeta, false)).toBe(false);
	});

	test('accepts a valid ready clip', () => {
		expect(isPipelineReadyClip(readyMeta, true)).toBe(true);
	});
});

describe('clipCatalog integration', () => {
	/** @type {string} */
	let tempDir;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clipCatalog-'));
		process.env.AKVJ_CLIPS_DIR = tempDir;
	});

	afterEach(async () => {
		delete process.env.AKVJ_CLIPS_DIR;
		if (tempDir) {
			await fs.rm(tempDir, { recursive: true, force: true });
		}
	});

	/**
	 * @param {string} clipId
	 * @param {object} meta
	 */
	async function writeMeta(clipId, meta) {
		const dir = path.join(tempDir, clipId);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(meta)}\n`, 'utf8');
	}

	/**
	 * @param {string} clipId
	 * @param {string} [name]
	 */
	async function writeSprite(clipId, name = 'sprite.png') {
		const dir = path.join(tempDir, clipId);
		await fs.writeFile(path.join(dir, name), Buffer.from('PNG'), 'utf8');
	}

	describe('readClipDirectories (via listClips)', () => {
		test('returns an empty array when the clips root does not exist', async () => {
			process.env.AKVJ_CLIPS_DIR = path.join(tempDir, 'missing-root');
			const clips = await listClips('default');
			expect(clips).toEqual([]);
		});

		test('ignores files and invalid clip IDs at the clips root', async () => {
			await fs.writeFile(path.join(tempDir, 'not-a-dir.txt'), '', 'utf8');
			await fs.mkdir(path.join(tempDir, '123'), { recursive: true });
			await fs.mkdir(path.join(tempDir, 'bad id'), { recursive: true });
			await writeMeta('ready-clip', { frames: 1, framesPerRow: 1 });
			await writeSprite('ready-clip');

			const clips = await listClips('default');
			expect(clips.map(clip => clip.clipId)).toEqual(['ready-clip']);
		});
	});

	describe('readClipMeta (via listClips)', () => {
		test('returns parsed meta.json when valid', async () => {
			const meta = { png: 'sprite.png', frames: 4, framesPerRow: 2, name: 'Valid' };
			await writeMeta('valid', meta);
			await writeSprite('valid');

			const clips = await listClips('default');
			expect(clips).toHaveLength(1);
			expect(clips[0].meta).toEqual(meta);
			expect(clips[0].pipelineReady).toBe(true);
		});

		test('returns empty meta when meta.json is missing', async () => {
			await fs.mkdir(path.join(tempDir, 'no-meta'), { recursive: true });

			const clips = await listClips('default');
			expect(clips).toHaveLength(1);
			expect(clips[0].clipId).toBe('no-meta');
			expect(clips[0].meta).toEqual({});
			expect(clips[0].hasSprite).toBe(false);
			expect(clips[0].pipelineReady).toBe(false);
		});

		test('returns empty meta when meta.json contains invalid JSON', async () => {
			const dir = path.join(tempDir, 'bad-meta');
			await fs.mkdir(dir, { recursive: true });
			await fs.writeFile(path.join(dir, 'meta.json'), '{ not json', 'utf8');

			const clips = await listClips('default');
			expect(clips).toHaveLength(1);
			expect(clips[0].clipId).toBe('bad-meta');
			expect(clips[0].meta).toEqual({});
			expect(clips[0].hasSprite).toBe(false);
			expect(clips[0].pipelineReady).toBe(false);
		});
	});

	describe('checkSpriteExists (via listClips hasSprite)', () => {
		test('returns true when meta.png points to an existing sprite', async () => {
			await writeMeta('has-sprite', { png: 'custom.png', frames: 1, framesPerRow: 1 });
			await writeSprite('has-sprite', 'custom.png');

			const clips = await listClips('default');
			expect(clips[0].hasSprite).toBe(true);
			expect(clips[0].pipelineReady).toBe(true);
		});

		test('falls back to sprite.png when meta.png is missing and the file exists', async () => {
			await writeMeta('fallback-sprite', { frames: 1, framesPerRow: 1 });
			await writeSprite('fallback-sprite');

			const clips = await listClips('default');
			expect(clips[0].hasSprite).toBe(true);
			expect(clips[0].pipelineReady).toBe(true);
		});

		test('returns false when the explicit meta.png is missing', async () => {
			await writeMeta('missing-explicit', { png: 'other.png', frames: 1, framesPerRow: 1 });

			const clips = await listClips('default');
			expect(clips[0].hasSprite).toBe(false);
			expect(clips[0].pipelineReady).toBe(false);
		});

		test('returns false when the default sprite.png is missing', async () => {
			await writeMeta('missing-default', { frames: 1, framesPerRow: 1 });

			const clips = await listClips('default');
			expect(clips[0].hasSprite).toBe(false);
			expect(clips[0].pipelineReady).toBe(false);
		});

		test('returns false when meta.png contains path traversal', async () => {
			await writeMeta('path-traversal', { png: '../evil.png', frames: 1, framesPerRow: 1 });

			const clips = await listClips('default');
			expect(clips[0].hasSprite).toBe(false);
			expect(clips[0].pipelineReady).toBe(false);
		});

		test('returns false when meta.png contains a subdirectory', async () => {
			const dir = path.join(tempDir, 'subdir-sprite');
			await fs.mkdir(path.join(dir, 'subdir'), { recursive: true });
			await fs.writeFile(path.join(dir, 'subdir', 'sprite.png'), Buffer.from('PNG'), 'utf8');
			await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify({ png: 'subdir/sprite.png', frames: 1, framesPerRow: 1 }), 'utf8');

			const clips = await listClips('default');
			expect(clips[0].hasSprite).toBe(false);
			expect(clips[0].pipelineReady).toBe(false);
		});
	});

	describe('listClips', () => {
		test('sorts the final clip array by clipId', async () => {
			await writeMeta('zebra', { frames: 1, framesPerRow: 1 });
			await writeSprite('zebra');
			await writeMeta('alpha', { frames: 1, framesPerRow: 1 });
			await writeSprite('alpha');

			const clips = await listClips('default');
			expect(clips.map(clip => clip.clipId)).toEqual(['alpha', 'zebra']);
		});

		test('returns a full catalog entry for each valid clip directory', async () => {
			const meta = { frames: 3, framesPerRow: 1 };
			await writeMeta('full', meta);
			await writeSprite('full');

			const clips = await listClips('default');
			expect(clips[0]).toEqual({
				clipId: 'full',
				meta,
				hasSprite: true,
				pipelineReady: true
			});
		});
	});

	describe('readyClipIdSet', () => {
		test('returns a Set of only pipeline-ready clip IDs', async () => {
			await writeMeta('ready', { frames: 1, framesPerRow: 1 });
			await writeSprite('ready');
			await writeMeta('draft', { frames: 1, framesPerRow: 1 });

			const ids = await readyClipIdSet('default');
			expect(ids).toEqual(new Set(['ready']));
		});
	});

	describe('clipsRootFor', () => {
		test('resolves the clips root for a given project', async () => {
			const root = await clipsRootFor('default');
			expect(root).toBe(tempDir);
		});
	});
});
