import { describe, it, expect } from 'vitest';
import { isValidClipId, isValidProjectId, deriveProjectId, clipDir, rawAssetsDir, resolveSafeSpritePath, projectClipsDir, projectKeyMapPath, projectRawAssetsRoot, resolveProjectsDir, resolveProjectsIndexPath, resolveActiveProjectPath, DEFAULT_PROJECT_ID } from '../server/paths.js';
import path from 'path';

describe('paths', () => {
	describe('isValidClipId', () => {
		it('accepts alphanumeric clip IDs with hyphens and underscores', () => {
			expect(isValidClipId('c1-n0-v0')).toBe(true);
			expect(isValidClipId('my_clip')).toBe(true);
			expect(isValidClipId('clipA')).toBe(true);
			expect(isValidClipId('neon-skull')).toBe(true);
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
			expect(isValidClipId('5')).toBe(false);
			expect(isValidClipId('12')).toBe(false);
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
		it('returns a path under the project clips dir for valid clip IDs', () => {
			const result = clipDir('c1-n0-v0');
			expect(result).toBe(path.join(projectClipsDir(DEFAULT_PROJECT_ID), 'c1-n0-v0'));
			expect(result).toContain(path.join('projects', 'default', 'clips'));
		});

		it('throws for invalid clip IDs', () => {
			expect(() => clipDir('../etc/passwd')).toThrow('Invalid clipId');
			expect(() => clipDir('')).toThrow('Invalid clipId');
			expect(() => clipDir('123')).toThrow('Invalid clipId');
		});
	});

	describe('rawAssetsDir', () => {
		it('returns a path under the project raw-assets root for valid clip IDs', () => {
			const result = rawAssetsDir('c1-n0-v0');
			expect(result).toBe(path.join(projectRawAssetsRoot(DEFAULT_PROJECT_ID), 'c1-n0-v0'));
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
			expect(result).toBe(path.join(projectClipsDir(DEFAULT_PROJECT_ID), 'c1-n0-v0', 'sprite.png'));
		});

		it('accepts uppercase PNG extension', () => {
			const result = resolveSafeSpritePath('c1-n0-v0', 'sprite.PNG');
			expect(result).toBe(path.join(projectClipsDir(DEFAULT_PROJECT_ID), 'c1-n0-v0', 'sprite.PNG'));
		});

		it('strips path components from pngName using basename', () => {
			const result = resolveSafeSpritePath('c1-n0-v0', '../../etc/passwd.png');
			expect(result).toBe(path.join(projectClipsDir(DEFAULT_PROJECT_ID), 'c1-n0-v0', 'passwd.png'));
		});

		it('throws for dotted or traversal filenames', () => {
			expect(() => resolveSafeSpritePath('neon-skull', '../secret')).toThrow('Invalid sprite filename');
			expect(() => resolveSafeSpritePath('neon-skull', '....png')).toThrow('Invalid sprite filename');
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

	describe('project path helpers', () => {
		it('resolves project clips, key-map, and raw-assets under projects/', () => {
			expect(projectClipsDir(DEFAULT_PROJECT_ID)).toContain(path.join('projects', 'default', 'clips'));
			expect(projectKeyMapPath(DEFAULT_PROJECT_ID).endsWith('key-map.json')).toBe(true);
			expect(projectRawAssetsRoot(DEFAULT_PROJECT_ID)).toContain('.raw-assets');
		});

		it('resolves projects dir, index, and active-project paths', () => {
			expect(typeof resolveProjectsDir()).toBe('string');
			expect(resolveProjectsIndexPath().endsWith('index.json')).toBe(true);
			expect(typeof resolveActiveProjectPath()).toBe('string');
			expect(isValidProjectId('default')).toBe(true);
			expect(isValidProjectId('123')).toBe(false);
			expect(deriveProjectId('Gig Show')).toBe('gig-show');
		});
	});
});
