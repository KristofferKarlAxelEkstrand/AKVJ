// @vitest-environment node

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { hashFile, writeHashFile, isCacheValid } from '../scripts/clips/lib/hash.js';

describe('scripts/clips/lib/hash.js', () => {
	let root;

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), 'akvj-hash-'));
		vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		if (root) {
			await fs.rm(root, { recursive: true, force: true });
		}
	});

	describe('hashFile', () => {
		test('computes SHA256 hash of a file', async () => {
			const filePath = path.join(root, 'test.txt');
			await fs.writeFile(filePath, 'hello world');
			const hash = await hashFile(filePath);
			expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
		});

		test('throws when file does not exist (ENOENT)', async () => {
			const filePath = path.join(root, 'nonexistent.txt');
			await expect(hashFile(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
		});

		test('throws when file cannot be read (permission error)', async () => {
			const filePath = path.join(root, 'protected.txt');
			const readSpy = vi.spyOn(fs, 'readFile').mockRejectedValueOnce({ code: 'EACCES' });
			await expect(hashFile(filePath)).rejects.toMatchObject({ code: 'EACCES' });
			readSpy.mockRestore();
		});
	});

	describe('writeHashFile', () => {
		test('writes hash to file', async () => {
			const hashFilePath = path.join(root, 'file.hash');
			const hash = 'abc123';
			await writeHashFile(hashFilePath, hash);
			const content = await fs.readFile(hashFilePath, 'utf8');
			expect(content.trim()).toBe(hash);
		});

		test('throws when directory does not exist', async () => {
			const hashFilePath = path.join(root, 'nonexistent', 'file.hash');
			const hash = 'abc123';
			await expect(writeHashFile(hashFilePath, hash)).rejects.toMatchObject({ code: 'ENOENT' });
		});

		test('throws when file cannot be written (permission error)', async () => {
			const hashFilePath = path.join(root, 'protected.hash');
			const hash = 'abc123';
			const writeSpy = vi.spyOn(fs, 'writeFile').mockRejectedValueOnce({ code: 'EACCES' });
			await expect(writeHashFile(hashFilePath, hash)).rejects.toMatchObject({ code: 'EACCES' });
			writeSpy.mockRestore();
		});
	});

	describe('isCacheValid', () => {
		test('returns true when cache is valid (hashes match)', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			await fs.writeFile(cachePath, 'hello');
			const hash = await hashFile(sourcePath);
			await writeHashFile(`${cachePath}.hash`, hash);
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(true);
		});

		test('returns false when cache is invalid (hashes differ)', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			await fs.writeFile(cachePath, 'goodbye');
			const hash = await hashFile(cachePath);
			await writeHashFile(`${cachePath}.hash`, hash);
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
		});

		test('returns false when source file does not exist', async () => {
			const sourcePath = path.join(root, 'nonexistent.txt');
			const cachePath = path.join(root, 'cache.txt');
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
		});

		test('returns false when hash file does not exist', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
		});

		test('returns false when hash file is corrupted (non-UTF8)', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			await fs.writeFile(`${cachePath}.hash`, Buffer.from([0x80, 0x81, 0x82]));
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
		});

		test('returns false when hash file is malformed (empty)', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			await fs.writeFile(`${cachePath}.hash`, '');
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
		});

		test('returns false when hash file contains invalid hash format', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			await fs.writeFile(`${cachePath}.hash`, 'not-a-valid-hash!!!');
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
		});

		test('returns false when source file read fails (permission error)', async () => {
			const sourcePath = path.join(root, 'protected.txt');
			const cachePath = path.join(root, 'cache.txt');
			const readSpy = vi.spyOn(fs, 'readFile').mockRejectedValueOnce({ code: 'EACCES' });
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
			readSpy.mockRestore();
		});

		test('returns false when hash file read fails (permission error)', async () => {
			const sourcePath = path.join(root, 'source.txt');
			const cachePath = path.join(root, 'cache.txt');
			await fs.writeFile(sourcePath, 'hello');
			await fs.writeFile(`${cachePath}.hash`, 'abc123');
			const readSpy = vi.spyOn(fs, 'readFile').mockRejectedValueOnce({ code: 'EACCES' });
			const isValid = await isCacheValid(sourcePath, cachePath);
			expect(isValid).toBe(false);
			readSpy.mockRestore();
		});
	});
});
