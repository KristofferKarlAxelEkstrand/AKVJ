import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ProjectCatalog from '../src/js/visuals/ProjectCatalog.js';
import settings from '../src/js/core/settings.js';

describe('ProjectCatalog', () => {
	/** @type {ProjectCatalog} */
	let catalog;
	/** @type {import('vitest').Mock} */
	let fetchMock;

	beforeEach(() => {
		catalog = new ProjectCatalog();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	describe('fetchActiveProjectId', () => {
		test('returns project ID for valid active-project.json', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ project: 'my-project' })
			});
			await expect(catalog.fetchActiveProjectId()).resolves.toBe('my-project');
			expect(fetchMock).toHaveBeenCalled();
			const url = fetchMock.mock.calls[0][0];
			expect(String(url)).toContain(settings.performance.activeProjectUrl);
		});

		test('returns null when project field is non-string', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ project: 42 })
			});
			await expect(catalog.fetchActiveProjectId()).resolves.toBeNull();
		});

		test('returns null when project fails SAFE_ID_PATTERN', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ project: '../etc' })
			});
			await expect(catalog.fetchActiveProjectId()).resolves.toBeNull();
		});

		test('returns null on fetch error', async () => {
			fetchMock.mockRejectedValue(new Error('network'));
			await expect(catalog.fetchActiveProjectId()).resolves.toBeNull();
		});

		test('returns null on non-ok HTTP response', async () => {
			fetchMock.mockResolvedValue({ ok: false, status: 404 });
			await expect(catalog.fetchActiveProjectId()).resolves.toBeNull();
		});
	});

	describe('fetchProjectsIndex', () => {
		test('returns filtered valid entries', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => [{ id: 'good', name: 'Good' }, { id: '../bad', name: 'Bad' }, { id: 99, name: 'Nope' }, null, { id: 'also-good', name: 'Also' }]
			});
			await expect(catalog.fetchProjectsIndex()).resolves.toEqual([
				{ id: 'good', name: 'Good' },
				{ id: 'also-good', name: 'Also' }
			]);
		});

		test('returns empty array when fetch fails', async () => {
			fetchMock.mockRejectedValue(new Error('fail'));
			await expect(catalog.fetchProjectsIndex()).resolves.toEqual([]);
		});

		test('returns empty array when response is not an array', async () => {
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ projects: [] })
			});
			await expect(catalog.fetchProjectsIndex()).resolves.toEqual([]);
		});
	});

	describe('URL builders', () => {
		test('buildProjectKeyMapUrl replaces projectId', () => {
			expect(catalog.buildProjectKeyMapUrl('demo')).toBe(settings.performance.projectKeyMapUrlTemplate.replace('{projectId}', 'demo'));
		});

		test('buildProjectKeyMapUrl throws on invalid id', () => {
			expect(() => catalog.buildProjectKeyMapUrl('../etc')).toThrow(/Invalid project ID/);
		});

		test('buildProjectClipsJsonUrl replaces projectId', () => {
			expect(catalog.buildProjectClipsJsonUrl('demo')).toBe(settings.performance.projectClipsJsonUrlTemplate.replace('{projectId}', 'demo'));
		});

		test('buildProjectClipsJsonUrl throws on invalid id', () => {
			expect(() => catalog.buildProjectClipsJsonUrl('')).toThrow(/Invalid project ID/);
		});
	});

	describe('statelessness', () => {
		test('holds no active project id — AppState owns it', () => {
			expect(catalog.activeProjectId).toBeUndefined();
			expect(catalog.setActiveProjectId).toBeUndefined();
		});
	});

	describe('loadJson cache-busting', () => {
		test('appends ?t= cache buster when DEV is true', async () => {
			vi.stubEnv('DEV', true);
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ project: 'x' })
			});
			await catalog.fetchActiveProjectId();
			const url = String(fetchMock.mock.calls[0][0]);
			expect(url).toMatch(/\?t=\d/);
			expect(url).toContain(settings.performance.activeProjectUrl);
		});

		test('does not append cache buster when DEV is false', async () => {
			vi.stubEnv('DEV', false);
			fetchMock.mockResolvedValue({
				ok: true,
				json: async () => ({ project: 'x' })
			});
			await catalog.fetchActiveProjectId();
			const url = String(fetchMock.mock.calls[0][0]);
			expect(url).toBe(settings.performance.activeProjectUrl);
		});
	});
});
