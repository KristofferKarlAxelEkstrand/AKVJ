import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test, expect } from 'vitest';
import { hasUtf8Bom, withoutUtf8Bom } from '../check-utf8.js';

describe('hasUtf8Bom / withoutUtf8Bom', () => {
	const bom = Buffer.from([0xef, 0xbb, 0xbf]);

	test('detects UTF-8 BOM bytes', () => {
		expect(hasUtf8Bom(Buffer.concat([bom, Buffer.from('hi')]))).toBe(true);
	});

	test('returns false for non-BOM buffers', () => {
		expect(hasUtf8Bom(Buffer.from('hi'))).toBe(false);
		expect(hasUtf8Bom(Buffer.from([0xef, 0xbb]))).toBe(false);
		expect(hasUtf8Bom(Buffer.alloc(0))).toBe(false);
	});

	test('withoutUtf8Bom strips BOM (fix path)', () => {
		const withBom = Buffer.concat([bom, Buffer.from('hello')]);
		expect(Buffer.from(withoutUtf8Bom(withBom)).toString('utf8')).toBe('hello');
		expect(hasUtf8Bom(withoutUtf8Bom(withBom))).toBe(false);
	});

	test('withoutUtf8Bom is a no-op when BOM is absent', () => {
		const plain = Buffer.from('plain');
		expect(withoutUtf8Bom(plain)).toBe(plain);
	});

	test('stripping BOM matches on-disk --fix behavior', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akvj-utf8-'));
		const file = path.join(dir, 'bom.txt');
		try {
			fs.writeFileSync(file, Buffer.concat([bom, Buffer.from('content')]));
			const fixed = withoutUtf8Bom(fs.readFileSync(file));
			fs.writeFileSync(file, fixed);
			expect(fs.readFileSync(file).toString('utf8')).toBe('content');
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});
