import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ClipLoader from '../src/js/visuals/ClipLoader.js';
import settings from '../src/js/core/settings.js';

function mockFetchCatalogAndLayout(catalog, midiLayout) {
	globalThis.fetch = vi.fn(async url => {
		const href = String(url);
		if (href.includes('midi-layout')) {
			return { ok: true, json: async () => midiLayout };
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
			'neon-skull': { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = { 1: { 60: { 0: 'neon-skull' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
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
			evil: { png: '../secret.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = { 1: { 60: { 0: 'evil' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '../secret.png');
		expect(clips[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('allows valid filenames with supported extensions', async () => {
		const catalog = {
			ok: { png: 'sprite01.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = { 1: { 60: { 0: 'ok' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
		expect(clips[0][60][0]).toBeDefined();
	});

	test('rejects filenames with invalid patterns like ....png or -.png', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			bad: { png: '....png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = { 1: { 60: { 0: 'bad' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '....png');
		expect(clips[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('ignores non-numeric channel/note/velocity keys from mapping', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			ok: { png: 'sprite01.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = { '../etc': { 60: { 0: 'ok' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
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
			'mask-clip': { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true, bitDepth: 1 }
		};
		const midiLayout = { 5: { 0: { 0: 'mask-clip' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
		expect(clips[4][0][0]).toBeDefined();
		expect(clips[5]).toBeUndefined();
	});

	test('skips unknown clipId with a warning', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {};
		const midiLayout = { 1: { 0: { 0: 'missing-clip' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith('ClipLoader: midi-layout references unknown clipId', 'missing-clip');
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});

	test('throws when mapping is not an array', async () => {
		mockFetchCatalogAndLayout({ ok: { png: 'sprite.png', frames: 1, framesPerRow: 1 } }, 'not-an-object');
		installMockImage();
		const loader = new ClipLoader({});
		await expect(loader.setupClips('/clips/clips.json', '/clips/midi-layout.json')).rejects.toThrow(/must be a JSON object/);
	});

	test('throws when mapping fetch fails', async () => {
		globalThis.fetch = vi.fn(async url => {
			if (String(url).includes('midi-layout')) {
				return { ok: false, status: 404 };
			}
			return { ok: true, json: async () => ({}) };
		});
		installMockImage();
		const loader = new ClipLoader({});
		await expect(loader.setupClips('/clips/clips.json', '/clips/midi-layout.json')).rejects.toThrow(/status: 404/);
	});

	test('rejects bare numeric clipIds', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			5: { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = { 1: { 0: { 0: '5' } } };
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');
		expect(consoleWarnSpy).toHaveBeenCalledWith('ClipLoader: invalid clipId', '5');
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});

	test('accepts object mapping values with triggerType and triggerGroup overrides', async () => {
		const catalog = {
			'neon-skull': { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const midiLayout = {
			1: {
				60: { 0: 'neon-skull' },
				61: { 0: { clipId: 'neon-skull', triggerType: 'latch', triggerGroup: 'bg' } }
			}
		};
		mockFetchCatalogAndLayout(catalog, midiLayout);
		installMockImage();

		const loader = new ClipLoader({});
		const clips = await loader.setupClips('/clips/clips.json', '/clips/midi-layout.json');

		// String mapping: default triggerType
		const clip1 = clips[0][60][0];
		expect(clip1.triggerType).toBe('momentary');
		expect(clip1.triggerGroup).toBeNull();

		// Object mapping: overridden triggerType and triggerGroup
		const clip2 = clips[0][61][0];
		expect(clip2.triggerType).toBe('latch');
		expect(clip2.triggerGroup).toBe('bg');
	});
});
