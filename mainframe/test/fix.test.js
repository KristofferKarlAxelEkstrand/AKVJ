import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fixClip, fixClips } from '../scripts/clips/lib/fix.js';
import { validate } from '../scripts/clips/lib/validate.js';

let root;

async function writeClip(clipId, metaText, pngNames = ['sprite.png']) {
	const dir = path.join(root, clipId);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'meta.json'), metaText);
	for (const png of pngNames) {
		await fs.writeFile(path.join(dir, png), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
	}
	return dir;
}

/**
 * @param {string} metaPath
 * @param {Error} error
 */
function mockMetaReadError(metaPath, error) {
	const real = fs.readFile.bind(fs);
	vi.spyOn(fs, 'readFile').mockImplementation(async (filePath, encoding) => {
		if (path.resolve(String(filePath)) === path.resolve(metaPath)) {
			throw error;
		}
		return real(filePath, encoding);
	});
}

beforeEach(async () => {
	root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-fix-'));
});

afterEach(async () => {
	vi.restoreAllMocks();
	await fs.rm(root, { recursive: true, force: true });
});

describe('fixClip', () => {
	test('leaves a hand-written meta.json byte-for-byte identical when nothing to migrate', async () => {
		// Deliberately idiosyncratic: 4-space indent, unsorted keys, no trailing newline.
		const handWritten = '{\n    "playback": "pingpong",\n    "png": "sprite.png",\n    "frames": 2,\n    "framesPerRow": 2\n}';
		const dir = await writeClip('hand-written', handWritten);
		const metaPath = path.join(dir, 'meta.json');

		const { changes } = await fixClip(dir);

		expect(changes).toEqual([]);
		expect(await fs.readFile(metaPath, 'utf8')).toBe(handWritten);
	});

	test('migrates deprecated loop to playback', async () => {
		const dir = await writeClip('legacy-loop', JSON.stringify({ png: 'sprite.png', frames: 2, framesPerRow: 2, loop: false }));

		const { changes } = await fixClip(dir);

		expect(changes).toEqual(['loop: false → playback: "once"']);
		const meta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
		expect(meta.playback).toBe('once');
		expect(meta.loop).toBeUndefined();
	});

	test('drops loop when playback is already set', async () => {
		const dir = await writeClip('both', JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'once', loop: true }));

		const { changes } = await fixClip(dir);

		expect(changes).toEqual(['removed deprecated loop (playback: "once" already set)']);
		const meta = JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8'));
		expect(meta.playback).toBe('once');
		expect(meta.loop).toBeUndefined();
	});

	test('points png at the only sprite on disk', async () => {
		const dir = await writeClip('renamed-png', JSON.stringify({ png: 'old.png', frames: 1, framesPerRow: 1 }), ['sprite.png']);

		const { changes } = await fixClip(dir);

		expect(changes).toEqual(['png: "old.png" → "sprite.png"']);
		expect(JSON.parse(await fs.readFile(path.join(dir, 'meta.json'), 'utf8')).png).toBe('sprite.png');
	});

	test('refuses to guess when several PNGs are present', async () => {
		const original = JSON.stringify({ png: 'old.png', frames: 1, framesPerRow: 1 });
		const dir = await writeClip('ambiguous', original, ['a.png', 'b.png']);

		const { changes, skipped } = await fixClip(dir);

		expect(changes).toEqual([]);
		expect(skipped).toHaveLength(1);
		expect(await fs.readFile(path.join(dir, 'meta.json'), 'utf8')).toBe(original);
	});

	test('missing meta.json is a silent no-op (ENOENT)', async () => {
		const dir = path.join(root, 'no-meta');
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, 'sprite.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));

		const result = await fixClip(dir);

		expect(result).toEqual({ changes: [], skipped: [], errors: [] });
		await expect(fs.access(path.join(dir, 'meta.json'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('non-ENOENT read failure reports Cannot read meta.json', async () => {
		const dir = await writeClip('unreadable', JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop' }));
		const metaPath = path.join(dir, 'meta.json');
		mockMetaReadError(metaPath, Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }));

		const { changes, skipped, errors } = await fixClip(dir);

		expect(changes).toEqual([]);
		expect(skipped).toEqual([]);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toContain('Cannot read meta.json');
	});
});

describe('fixClips', () => {
	test('reports each migrated clip and skips clean ones', async () => {
		await writeClip('clean', JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop' }));
		await writeClip('legacy', JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, loop: true }));

		const { fixed, errors } = await fixClips(root);

		expect(errors).toEqual([]);
		expect(fixed.map(entry => entry.clipId)).toEqual(['legacy']);
	});

	test('skips folders whose names are not valid clip ids', async () => {
		await writeClip('valid-clip', JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, loop: true }));
		await fs.mkdir(path.join(root, 'Bad Folder'), { recursive: true });
		await fs.writeFile(path.join(root, 'Bad Folder', 'meta.json'), JSON.stringify({ png: 'sprite.png', loop: true }));

		const { fixed, skipped, errors } = await fixClips(root);

		expect(fixed.map(entry => entry.clipId)).toEqual(['valid-clip']);
		expect(skipped).toEqual([]);
		expect(errors).toEqual([]);
	});

	test('aggregates skipped and errors across clips', async () => {
		await writeClip('ambiguous-png', JSON.stringify({ png: 'old.png', frames: 1, framesPerRow: 1, playback: 'loop' }), ['a.png', 'b.png']);
		const unreadableDir = await writeClip('unreadable-meta', JSON.stringify({ png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop' }));
		mockMetaReadError(path.join(unreadableDir, 'meta.json'), Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }));

		const { fixed, skipped, errors } = await fixClips(root);

		expect(fixed).toEqual([]);
		expect(skipped).toHaveLength(1);
		expect(skipped[0].clipId).toBe('ambiguous-png');
		expect(skipped[0].skipped[0]).toContain('fix it by hand');
		expect(errors).toHaveLength(1);
		expect(errors[0].clipId).toBe('unreadable-meta');
		expect(errors[0].errors[0]).toContain('Cannot read meta.json');
	});
});

describe('validate is report-only', () => {
	test('reports a missing png without rewriting the source meta', async () => {
		const original = JSON.stringify({ png: 'old.png', frames: 1, framesPerRow: 1, playback: 'loop' });
		const dir = await writeClip('missing-png', original);

		const { errors } = await validate(root);

		expect(errors).toHaveLength(1);
		expect(errors[0].errors.some(message => message.includes('--fix'))).toBe(true);
		expect(await fs.readFile(path.join(dir, 'meta.json'), 'utf8')).toBe(original);
	});
});
