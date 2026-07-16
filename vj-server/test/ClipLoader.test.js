import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ClipLoader from '../src/js/visuals/ClipLoader.js';
import settings from '../src/js/core/settings.js';

function mockFetchCatalogAndMapping(catalog, mapping) {
	globalThis.fetch = vi.fn(async url => {
		const href = String(url);
		if (href.includes('set-mapping')) {
			return { ok: true, json: async () => mapping };
		}
		return { ok: true, json: async () => catalog };
	});
}

function installMockImage() {
	class MockImage {
		constructor() {
			this.onload = null;
			this.onerror = null;
			this.width = 240;
			this.height = 135;
		}
		set src(v) {
			if (!v || v.endsWith('/')) {
				if (typeof this.onerror === 'function') {
					this.onerror();
				}
				return;
			}
			if (typeof this.onload === 'function') {
				this.onload();
			}
		}
	}
	globalThis.Image = MockImage;
}

describe('ClipLoader', () => {
	let originalFetch;
	let originalImage;
	let originalConcurrency;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		originalImage = globalThis.Image;
		originalConcurrency = settings.performance.maxConcurrentClipLoads;
	});
	afterEach(() => {
		globalThis.fetch = originalFetch;
		globalThis.Image = originalImage;
		settings.performance.maxConcurrentClipLoads = originalConcurrency;
	});

	test('setupClips resolves mapping and loads images using concurrency setting', async () => {
		settings.performance.maxConcurrentClipLoads = 1;

		const catalog = {
			'neon-skull': { png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const mapping = [{ channel: 1, note: 60, velocity: 0, clipId: 'neon-skull' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(clips).toBeTruthy();
		// DAW channel 1 → code channel 0
		expect(clips[0][60]).toBeDefined();
	});
});

describe('ClipLoader - sanitizeFileName (indirect tests)', () => {
	let originalFetch;
	let originalImage;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		originalImage = globalThis.Image;
	});
	afterEach(() => {
		globalThis.fetch = originalFetch;
		globalThis.Image = originalImage;
	});

	test('rejects path traversal attempts in filenames', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			evil: { png: '../secret.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const mapping = [{ channel: 1, note: 60, velocity: 0, clipId: 'evil' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '../secret.png');
		expect(clips[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('allows valid filenames with supported extensions', async () => {
		const catalog = {
			ok: { png: 'sprite01.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const mapping = [{ channel: 1, note: 60, velocity: 0, clipId: 'ok' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(clips[0][60][0]).toBeDefined();
	});

	test('rejects filenames with invalid patterns like ....png or -.png', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			bad: { png: '....png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const mapping = [{ channel: 1, note: 60, velocity: 0, clipId: 'bad' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '....png');
		expect(clips[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('ignores non-numeric channel/note/velocity keys from mapping', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			ok: { png: 'sprite01.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const mapping = [{ channel: '../etc', note: 60, velocity: 0, clipId: 'ok' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('ignoring clip with non-numeric path keys'), expect.any(Object));
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});
});

describe('ClipLoader - mapping edge cases', () => {
	let originalFetch;
	let originalImage;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		originalImage = globalThis.Image;
	});
	afterEach(() => {
		globalThis.fetch = originalFetch;
		globalThis.Image = originalImage;
	});

	test('maps DAW channel 5 to code channel 4 (mixer)', async () => {
		const catalog = {
			'mask-clip': { png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true, bitDepth: 1 }
		};
		const mapping = [{ channel: 5, note: 0, velocity: 0, clipId: 'mask-clip' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(clips[4][0][0]).toBeDefined();
		expect(clips[5]).toBeUndefined();
	});

	test('skips unknown clipId with a warning', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {};
		const mapping = [{ channel: 1, note: 0, velocity: 0, clipId: 'missing-clip' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith('ClipLoader: mapping references unknown clipId', 'missing-clip');
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});

	test('throws when mapping is not an array', async () => {
		mockFetchCatalogAndMapping({ ok: { png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1 } }, { not: 'array' });
		installMockImage();
		const loader = new ClipLoader({});
		await expect(loader.setupClips('/clips/clips.json', '/clips/set-mapping.json')).rejects.toThrow(/must be a JSON array/);
	});

	test('throws when mapping fetch fails', async () => {
		globalThis.fetch = vi.fn(async url => {
			if (String(url).includes('set-mapping')) {
				return { ok: false, status: 404 };
			}
			return { ok: true, json: async () => ({}) };
		});
		installMockImage();
		const loader = new ClipLoader({});
		await expect(loader.setupClips('/clips/clips.json', '/clips/set-mapping.json')).rejects.toThrow(/status: 404/);
	});

	test('rejects bare numeric clipIds', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			5: { png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const mapping = [{ channel: 1, note: 0, velocity: 0, clipId: '5' }];
		mockFetchCatalogAndMapping(catalog, mapping);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/set-mapping.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith('ClipLoader: invalid clipId', '5');
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});
});
