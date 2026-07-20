import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import ClipLoader from '../src/js/visuals/ClipLoader.js';
import settings from '../src/js/core/settings.js';

function mockFetchCatalogAndLayout(catalog, keyMap, { activeProject = null } = {}) {
	globalThis.fetch = vi.fn(async url => {
		const href = String(url);
		if (href.includes('active-project')) {
			if (activeProject) {
				return { ok: true, json: async () => ({ project: activeProject }) };
			}
			return { ok: false, status: 404, json: async () => ({}) };
		}
		if (href.includes('key-map')) {
			return { ok: true, json: async () => keyMap };
		}
		return { ok: true, json: async () => catalog };
	});
}

/**
 * @param {string[]|null} [loadedSrcs] - Optional collector for image.src values
 */
function installMockImage(loadedSrcs = null) {
	class MockImage {
		constructor() {
			this.onload = null;
			this.onerror = null;
			this.width = 240;
			this.height = 135;
		}
		set src(v) {
			if (loadedSrcs) {
				loadedSrcs.push(v);
			}
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

	test('loadClips resolves mapping and loads images using concurrency setting', async () => {
		settings.performance.maxConcurrentClipLoads = 1;

		const catalog = {
			'neon-skull': { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { 1: { 60: { 0: 'neon-skull' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
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
		const keyMap = { 1: { 60: { 0: 'evil' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '../secret.png');
		expect(clips[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('allows valid filenames with supported extensions', async () => {
		const catalog = {
			ok: { png: 'sprite01.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { 1: { 60: { 0: 'ok' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		expect(clips[0][60][0]).toBeDefined();
	});

	test('rejects filenames with invalid patterns like ....png or -.png', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			bad: { png: '....png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { 1: { 60: { 0: 'bad' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '....png');
		expect(clips[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('ignores non-numeric channel/note/velocity keys from mapping', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			ok: { png: 'sprite01.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { '../etc': { 60: { 0: 'ok' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
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
		const keyMap = { 5: { 0: { 0: 'mask-clip' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		expect(clips[4][0][0]).toBeDefined();
		expect(clips[5]).toBeUndefined();
	});

	test('skips unknown clipId with a warning', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {};
		const keyMap = { 1: { 0: { 0: 'missing-clip' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		expect(consoleWarnSpy).toHaveBeenCalledWith('ClipLoader: key-map references unknown clipId', 'missing-clip');
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});

	test('throws when mapping is not an array', async () => {
		mockFetchCatalogAndLayout({ ok: { png: 'sprite.png', frames: 1, framesPerRow: 1 } }, 'not-an-object');
		installMockImage();
		const loader = new ClipLoader();
		await expect(loader.loadClips()).rejects.toThrow(/must be a JSON object/);
	});

	test('throws when mapping fetch fails', async () => {
		globalThis.fetch = vi.fn(async url => {
			if (String(url).includes('key-map')) {
				return { ok: false, status: 404 };
			}
			return { ok: true, json: async () => ({}) };
		});
		installMockImage();
		const loader = new ClipLoader();
		await expect(loader.loadClips()).rejects.toThrow(/status: 404/);
	});

	test('rejects bare numeric clipIds', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const catalog = {
			5: { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { 1: { 0: { 0: '5' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		expect(consoleWarnSpy).toHaveBeenCalledWith('ClipLoader: invalid clipId', '5');
		expect(Object.keys(clips).length).toBe(0);
		consoleWarnSpy.mockRestore();
	});

	test('accepts object mapping values with triggerType and triggerGroup overrides', async () => {
		const catalog = {
			'neon-skull': { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = {
			1: {
				60: { 0: 'neon-skull' },
				61: { 0: { clipId: 'neon-skull', triggerType: 'latch', triggerGroup: 'bg' } }
			}
		};
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();

		// String mapping: default triggerType
		const clip1 = clips[0][60][0];
		expect(clip1.triggerType).toBe('momentary');
		expect(clip1.triggerGroup).toBeNull();

		// Object mapping: overridden triggerType and triggerGroup
		const clip2 = clips[0][61][0];
		expect(clip2.triggerType).toBe('latch');
		expect(clip2.triggerGroup).toBe('bg');
	});

	test('sync overrides on two placements resolve to different syncBeats', async () => {
		const { normalizeClipMetadata } = await import('../src/js/visuals/clipMetadata.js');
		const baseMeta = {
			png: 'sprite.png',
			frames: 4,
			framesPerRow: 4,
			playback: 'loop',
			frameRatesForFrames: { 0: 12, 1: 12, 2: 12, 3: 12 },
			retrigger: true
		};
		const catalog = { 'neon-skull': baseMeta };
		const keyMap = {
			1: {
				60: { 0: { clipId: 'neon-skull', sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 } },
				61: { 0: { clipId: 'neon-skull', sync: 'beat', syncLength: '2 bars', beatsPerBar: 4 } }
			}
		};
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();

		expect(clips[0][60][0]).toBeTruthy();
		expect(clips[0][61][0]).toBeTruthy();
		expect(clips[0][60][0]).not.toBe(clips[0][61][0]);

		// Same shallow-merge + normalize path ClipLoader uses in #loadMappedClip / #createClip
		const oneBar = normalizeClipMetadata({ ...baseMeta, sync: 'beat', syncLength: '1 bar', beatsPerBar: 4 });
		const twoBars = normalizeClipMetadata({ ...baseMeta, sync: 'beat', syncLength: '2 bars', beatsPerBar: 4 });
		expect(oneBar.syncBeats).toBe(4);
		expect(twoBars.syncBeats).toBe(8);
	});

	test('loads clip successfully when frameRatesForFrames is omitted from metadata', async () => {
		// This simulates clips that use BPM sync (sync/syncLength) and don't define frameRatesForFrames
		const catalog = {
			'bpm-sync-clip': {
				png: 'sprite.png',
				frames: 4,
				framesPerRow: 4,
				playback: 'loop',
				sync: 'beat',
				syncLength: '1 bar',
				retrigger: true
				// frameRatesForFrames is intentionally omitted
			}
		};
		const keyMap = { 1: { 60: { 0: 'bpm-sync-clip' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();

		// Clip should load successfully without throwing
		expect(clips[0][60][0]).toBeDefined();
		expect(clips[0][60][0]).toBeInstanceOf(Object);
	});

	test('frameDurationsMs array in catalog is preserved and the Clip uses ms timing', async () => {
		const catalog = {
			'ms-clip': {
				png: 'sprite.png',
				frames: 2,
				framesPerRow: 2,
				playback: 'once',
				frameDurationsMs: [50, 100],
				retrigger: true
			}
		};
		const keyMap = { 1: { 60: { 0: 'ms-clip' } } };
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		const clip = clips[0][60][0];

		const ctx = { drawImage: vi.fn() };
		clip.renderToContext(ctx, 0);
		expect(clip.currentFrame).toBe(0);

		clip.renderToContext(ctx, 40);
		expect(clip.currentFrame).toBe(0);

		clip.renderToContext(ctx, 50);
		expect(clip.currentFrame).toBe(1);
	});

	test('unknown mapping override keys are dropped and do not reach Clip timing', async () => {
		const catalog = {
			'base-clip': {
				png: 'sprite.png',
				frames: 2,
				framesPerRow: 2,
				playback: 'once',
				frameRatesForFrames: { 0: 1000, 1: 1000 },
				retrigger: true
			}
		};
		const keyMap = {
			1: {
				60: { 0: 'base-clip' },
				61: { 0: { clipId: 'base-clip', frameDurationsMs: [50, 100], scaleMode: 'cover' } }
			}
		};
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage();

		const loader = new ClipLoader();
		const clips = await loader.loadClips();
		const ctx = { drawImage: vi.fn() };

		const baseClip = clips[0][60][0];
		baseClip.renderToContext(ctx, 0);
		baseClip.renderToContext(ctx, 1);
		expect(baseClip.currentFrame).toBe(1);

		// Disallowed leaf keys must not override catalog FPS timing (1ms/frame)
		const filteredClip = clips[0][61][0];
		filteredClip.renderToContext(ctx, 0);
		filteredClip.renderToContext(ctx, 1);
		expect(filteredClip.currentFrame).toBe(1);
	});
});

describe('ClipLoader - project load path', () => {
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

	test('loadClipsFromProject fetches project-scoped catalog and key-map', async () => {
		const catalog = {
			'neon-skull': { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { 1: { 60: { 0: 'neon-skull' } } };
		const loadedSrcs = [];
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage(loadedSrcs);

		const loader = new ClipLoader();
		const clips = await loader.loadClipsFromProject('demo');

		const fetchUrls = globalThis.fetch.mock.calls.map(call => String(call[0]));
		expect(fetchUrls.some(url => url.includes('/projects/demo/clips/clips.json'))).toBe(true);
		expect(fetchUrls.some(url => url.includes('/projects/demo/clips/key-map.json'))).toBe(true);
		// DAW channel 1 → code channel 0
		expect(clips[0][60][0]).toBeDefined();
		expect(loadedSrcs.some(src => src.includes('/projects/demo/clips/neon-skull/sprite.png'))).toBe(true);
	});

	test('loadClipsFromProject throws on invalid projectId', async () => {
		const loader = new ClipLoader();
		await expect(loader.loadClipsFromProject('../etc')).rejects.toThrow(/Invalid project ID/);
	});

	test('loadClips uses active project URLs instead of legacy args', async () => {
		const catalog = {
			'live-clip': { png: 'sheet.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		const keyMap = { 1: { 60: { 0: 'live-clip' } } };
		const loadedSrcs = [];
		mockFetchCatalogAndLayout(catalog, keyMap, { activeProject: 'live-set' });
		installMockImage(loadedSrcs);

		const loader = new ClipLoader();
		const clips = await loader.loadClips('/clips/clips.json', '/clips/key-map.json');

		const fetchUrls = globalThis.fetch.mock.calls.map(call => String(call[0]));
		expect(fetchUrls.some(url => url.includes('/projects/live-set/clips/clips.json'))).toBe(true);
		expect(fetchUrls.some(url => url.includes('/projects/live-set/clips/key-map.json'))).toBe(true);
		expect(fetchUrls.some(url => url.includes('/clips/clips.json') && !url.includes('/projects/'))).toBe(false);
		expect(fetchUrls.some(url => url.includes('/clips/key-map.json') && !url.includes('/projects/'))).toBe(false);
		expect(clips[0][60][0]).toBeDefined();
		expect(loadedSrcs.some(src => src.includes('/projects/live-set/clips/live-clip/sheet.png'))).toBe(true);
	});

	test('decodes each unique clipId image only once across notes, velocities, and channels', async () => {
		const catalog = {
			shared: { png: 'sprite.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true },
			other: { png: 'other.png', frames: 1, framesPerRow: 1, playback: 'loop', frameRatesForFrames: { 0: 60 }, retrigger: true }
		};
		// Same clipId on two notes, two velocities, and a second channel — plus one distinct clip.
		const keyMap = {
			1: { 60: { 0: 'shared', 64: 'shared' }, 61: { 0: 'shared' } },
			2: { 60: { 0: 'shared' }, 62: { 0: 'other' } }
		};
		const loadedSrcs = [];
		mockFetchCatalogAndLayout(catalog, keyMap);
		installMockImage(loadedSrcs);

		const loader = new ClipLoader();
		const clips = await loader.loadClipsFromProject('demo');

		expect(loadedSrcs.filter(src => src.includes('/projects/demo/clips/shared/sprite.png'))).toHaveLength(1);
		expect(loadedSrcs.filter(src => src.includes('/projects/demo/clips/other/other.png'))).toHaveLength(1);
		expect(loadedSrcs).toHaveLength(2);
		// DAW channels 1→0 and 2→1; all shared slots still resolve
		expect(clips[0][60][0]).toBeDefined();
		expect(clips[0][60][64]).toBeDefined();
		expect(clips[0][61][0]).toBeDefined();
		expect(clips[1][60][0]).toBeDefined();
		expect(clips[1][62][0]).toBeDefined();
	});
});

describe('ClipLoader - destroyClips()', () => {
	test('calls destroy on every nested clip once', () => {
		const a = { destroy: vi.fn() };
		const b = { destroy: vi.fn() };
		const clips = {
			0: { 60: { 0: a } },
			1: { 61: { 0: b } }
		};
		const loader = new ClipLoader();
		loader.destroyClips(clips);
		expect(a.destroy).toHaveBeenCalledTimes(1);
		expect(b.destroy).toHaveBeenCalledTimes(1);
	});

	test('destroyClips(null) and destroyClips(undefined) do not throw', () => {
		const loader = new ClipLoader();
		expect(() => loader.destroyClips(null)).not.toThrow();
		expect(() => loader.destroyClips(undefined)).not.toThrow();
	});

	test('continues destroying siblings when one clip.destroy() throws', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const exploding = {
			destroy: vi.fn(() => {
				throw new Error('boom');
			})
		};
		const survivor = { destroy: vi.fn() };
		const clips = {
			0: { 60: { 0: exploding, 64: survivor } }
		};
		const loader = new ClipLoader();
		expect(() => loader.destroyClips(clips)).not.toThrow();
		expect(exploding.destroy).toHaveBeenCalledTimes(1);
		expect(survivor.destroy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith('Failed to destroy clip:', expect.any(Error));
		errorSpy.mockRestore();
	});
});
