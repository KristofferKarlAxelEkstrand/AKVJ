import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { writeJsonAtomic } from '../server/writeJsonAtomic.js';

describe('writeJsonAtomic', () => {
	let tempDir;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-atomic-test-'));
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
		vi.restoreAllMocks();
	});

	it('writes json to a file', async () => {
		const target = path.join(tempDir, 'test.json');
		const data = { a: 1, b: 'two' };
		await writeJsonAtomic(target, data);

		const result = JSON.parse(await fs.readFile(target, 'utf8'));
		expect(result).toEqual(data);
	});

	it('formats json with tabs', async () => {
		const target = path.join(tempDir, 'test2.json');
		await writeJsonAtomic(target, { a: 1 });
		const raw = await fs.readFile(target, 'utf8');
		expect(raw).toBe('{\n\t"a": 1\n}\n');
	});

	it('is atomic and handles concurrency', async () => {
		const target = path.join(tempDir, 'concurrent.json');
		const writes = [];
		for (let i = 0; i < 50; i++) {
			writes.push(writeJsonAtomic(target, { i }));
		}
		await Promise.all(writes);

		// The final file must be valid JSON
		const result = JSON.parse(await fs.readFile(target, 'utf8'));
		expect(typeof result.i).toBe('number');
	});

	it('leaves original file intact if write fails', async () => {
		const target = path.join(tempDir, 'fail.json');
		await writeJsonAtomic(target, { init: true });

		const originalWrite = fs.writeFile;
		vi.spyOn(fs, 'writeFile').mockImplementation(async (path, data, options) => {
			if (String(path).includes('fail.json.tmp.')) {
				throw new Error('Interrupted write');
			}
			return originalWrite.call(fs, path, data, options);
		});

		await expect(writeJsonAtomic(target, { updated: true })).rejects.toThrow('Interrupted write');

		const result = JSON.parse(await fs.readFile(target, 'utf8'));
		expect(result).toEqual({ init: true }); // Original data preserved
	});
});
