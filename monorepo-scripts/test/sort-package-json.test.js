import { describe, test, expect } from 'vitest';
import { sortPackageJson } from '../sort-package-json.js';

describe('sortPackageJson', () => {
	test('sorts keys with name/version/description first, rest alphabetical', () => {
		const sorted = sortPackageJson({
			scripts: { test: 'vitest' },
			version: '1.0.0',
			dependencies: { a: '1' },
			name: 'demo',
			description: 'A demo',
			license: 'MIT'
		});
		expect(Object.keys(sorted)).toEqual(['name', 'version', 'description', 'dependencies', 'license', 'scripts']);
	});

	test('handles missing standard keys gracefully', () => {
		const sorted = sortPackageJson({
			private: true,
			name: 'only-name',
			type: 'module'
		});
		expect(Object.keys(sorted)).toEqual(['name', 'private', 'type']);
		expect(sorted).not.toHaveProperty('version');
		expect(sorted).not.toHaveProperty('description');
	});

	test('preserves nested object values without deep-sorting', () => {
		const scripts = { z: 'last', a: 'first' };
		const sorted = sortPackageJson({ version: '0', scripts, name: 'x' });
		expect(sorted.scripts).toBe(scripts);
		expect(Object.keys(sorted.scripts)).toEqual(['z', 'a']);
	});

	test('returns empty object for empty input', () => {
		expect(sortPackageJson({})).toEqual({});
	});
});
