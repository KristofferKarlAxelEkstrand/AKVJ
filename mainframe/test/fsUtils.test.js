// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from 'vitest';

const { files, api } = vi.hoisted(() => {
	const files = new Map();
	const api = {
		copyFile: vi.fn(),
		readFile: vi.fn(),
		writeFile: vi.fn()
	};
	return { files, api };
});

vi.mock('fs/promises', () => ({
	default: api,
	...api
}));

const { copyFileWithFallback } = await import('../scripts/clips/lib/fsUtils.js');

describe('copyFileWithFallback', () => {
	const src = '/tmp/src.bin';
	const dest = '/tmp/dest.bin';
	const payload = Buffer.from('akvj-fsutils-bytes');

	beforeEach(() => {
		files.clear();
		vi.clearAllMocks();
		files.set(src, Buffer.from(payload));

		api.copyFile.mockImplementation(async (from, to) => {
			if (!files.has(from)) {
				const error = new Error(`ENOENT: ${from}`);
				error.code = 'ENOENT';
				throw error;
			}
			files.set(to, Buffer.from(files.get(from)));
		});
		api.readFile.mockImplementation(async path => {
			if (!files.has(path)) {
				const error = new Error(`ENOENT: ${path}`);
				error.code = 'ENOENT';
				throw error;
			}
			return Buffer.from(files.get(path));
		});
		api.writeFile.mockImplementation(async (path, contents) => {
			files.set(path, Buffer.from(contents));
		});
	});

	test('copyFile success writes dest matching source', async () => {
		await copyFileWithFallback(src, dest);

		expect(api.copyFile).toHaveBeenCalledWith(src, dest);
		expect(api.readFile).not.toHaveBeenCalled();
		expect(api.writeFile).not.toHaveBeenCalled();
		expect(files.get(dest)).toEqual(payload);
	});

	test('EPERM falls back to readFile + writeFile with matching bytes', async () => {
		const error = new Error('operation not permitted');
		error.code = 'EPERM';
		api.copyFile.mockRejectedValueOnce(error);

		await copyFileWithFallback(src, dest);

		expect(api.readFile).toHaveBeenCalledWith(src);
		expect(api.writeFile).toHaveBeenCalledWith(dest, expect.any(Buffer));
		expect(files.get(dest)).toEqual(payload);
	});

	test('ENOSYS falls back to readFile + writeFile with matching bytes', async () => {
		const error = new Error('function not implemented');
		error.code = 'ENOSYS';
		api.copyFile.mockRejectedValueOnce(error);

		await copyFileWithFallback(src, dest);

		expect(api.readFile).toHaveBeenCalledWith(src);
		expect(api.writeFile).toHaveBeenCalledWith(dest, expect.any(Buffer));
		expect(files.get(dest)).toEqual(payload);
	});

	test('other errors rethrow and do not write dest', async () => {
		const error = new Error('no such file');
		error.code = 'ENOENT';
		api.copyFile.mockRejectedValueOnce(error);

		await expect(copyFileWithFallback(src, dest)).rejects.toMatchObject({ code: 'ENOENT' });

		expect(api.readFile).not.toHaveBeenCalled();
		expect(api.writeFile).not.toHaveBeenCalled();
		expect(files.has(dest)).toBe(false);
	});
});
