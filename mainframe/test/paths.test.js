import { describe, it, expect } from 'vitest';
import { isValidClipId, clipDir, rawAssetsDir, resolveSafeSpritePath, CLIPS_DIR, KEY_MAP_PATH, RAW_ASSETS_DIR } from '../server/paths.js';
import path from 'path';

describe('paths', () => {
	describe('isValidClipId', () => {
		it('accepts alphanumeric clip IDs with hyphens and underscores', () => {
			expect(isValidClipId('c1-n0-v0')).toBe(true);
			expect(isValidClipId('my_clip')).toBe(true);
			expect(isValidClipId('clipA')).toBe(true);
		});

		it('rejects empty strings', () => {
			expect(isValidClipId('')).toBe(false);
		});

		it('rejects non-string types', () => {
			expect(isValidClipId(null)).toBe(false);
			expect(isValidClipId(undefined)).toBe(false);
			expect(isValidClipId(123)).toBe(false);
			expect(isValidClipId({})).toBe(false);
		});

		it('rejects pure numeric IDs', () => {
			expect(isValidClipId('123')).toBe(false);
			expect(isValidClipId('0')).toBe(false);
		});

		it('rejects IDs with path separators', () => {
			expect(isValidClipId('../etc/passwd')).toBe(false);
			expect(isValidClipId('a/b')).toBe(false);
			expect(isValidClipId('a\\b')).toBe(false);
		});

		it('rejects IDs starting with special characters', () => {
			expect(isValidClipId('-clip')).toBe(false);
			expect(isValidClipId('_clip')).toBe(false);
			expect(isValidClipId('.clip')).toBe(false);
		});
	});

	describe('clipDir', () => {
		it('returns a path under CLIPS_DIR for valid clip IDs', () => {
			const result = clipDir('c1-n0-v0');
			expect(result).toBe(path.join(CLIPS_DIR, 'c1-n0-v0'));
		});

		it('throws for invalid clip IDs', () => {
			expect(() => clipDir('../etc/passwd')).toThrow('Invalid clipId');
			expect(() => clipDir('')).toThrow('Invalid clipId');
			expect(() => clipDir('123')).toThrow('Invalid clipId');
		});
	});

	describe('rawAssetsDir', () => {
		it('returns a path under RAW_ASSETS_DIR for valid clip IDs', () => {
			const result = rawAssetsDir('c1-n0-v0');
			expect(result).toBe(path.join(RAW_ASSETS_DIR, 'c1-n0-v0'));
		});

		it('throws for invalid clip IDs', () => {
			expect(() => rawAssetsDir('../etc/passwd')).toThrow('Invalid clipId');
			expect(() => rawAssetsDir('')).toThrow('Invalid clipId');
			expect(() => rawAssetsDir('123')).toThrow('Invalid clipId');
		});
	});

	describe('resolveSafeSpritePath', () => {
		it('resolves a valid PNG filename under the clip directory', () => {
			const result = resolveSafeSpritePath('c1-n0-v0', 'sprite.png');
			expect(result).toBe(path.join(CLIPS_DIR, 'c1-n0-v0', 'sprite.png'));
		});

		it('accepts uppercase PNG extension', () => {
			const result = resolveSafeSpritePath('c1-n0-v0', 'sprite.PNG');
			expect(result).toBe(path.join(CLIPS_DIR, 'c1-n0-v0', 'sprite.PNG'));
		});

		it('strips path components from pngName using basename', () => {
			const result = resolveSafeSpritePath('c1-n0-v0', '../../etc/passwd.png');
			expect(result).toBe(path.join(CLIPS_DIR, 'c1-n0-v0', 'passwd.png'));
		});

		it('throws for non-PNG filenames', () => {
			expect(() => resolveSafeSpritePath('c1-n0-v0', 'sprite.jpg')).toThrow('Invalid sprite filename');
			expect(() => resolveSafeSpritePath('c1-n0-v0', 'sprite.txt')).toThrow('Invalid sprite filename');
		});

		it('throws for filenames without extension', () => {
			expect(() => resolveSafeSpritePath('c1-n0-v0', 'sprite')).toThrow('Invalid sprite filename');
		});

		it('throws for empty filename', () => {
			expect(() => resolveSafeSpritePath('c1-n0-v0', '')).toThrow('Invalid sprite filename');
		});

		it('throws for invalid clip ID', () => {
			expect(() => resolveSafeSpritePath('../etc', 'sprite.png')).toThrow('Invalid clipId');
		});
	});

	describe('exports', () => {
		it('exports CLIPS_DIR as a string', () => {
			expect(typeof CLIPS_DIR).toBe('string');
			expect(CLIPS_DIR.length).toBeGreaterThan(0);
		});

		it('exports RAW_ASSETS_DIR as a string', () => {
			expect(typeof RAW_ASSETS_DIR).toBe('string');
			expect(RAW_ASSETS_DIR.length).toBeGreaterThan(0);
		});

		it('exports KEY_MAP_PATH ending with key-map.json', () => {
			expect(KEY_MAP_PATH.endsWith('key-map.json')).toBe(true);
		});
	});
});
