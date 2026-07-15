import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import AnimationLoader from '../src/js/visuals/AnimationLoader.js';
import settings from '../src/js/core/settings.js';

describe('AnimationLoader', () => {
	let originalFetch;
	let originalImage;
	let originalConcurrency;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		originalImage = globalThis.Image;
		originalConcurrency = settings.performance.maxConcurrentAnimationLoads;
	});
	afterEach(() => {
		globalThis.fetch = originalFetch;
		globalThis.Image = originalImage;
		settings.performance.maxConcurrentAnimationLoads = originalConcurrency;
	});

	test('setUpAnimations loads images using configured concurrency setting', async () => {
		// Configure small concurrency for the test
		settings.performance.maxConcurrentAnimationLoads = 1;

		// Stub fetch of JSON to return simple animations mapping
		const simpleJson = {
			0: {
				60: {
					0: { png: 'sprite.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
				}
			}
		};
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => simpleJson });

		// Stub global Image to call onload synchronously when src is set
		class MockImage {
			constructor() {
				this.onload = null;
				this.onerror = null;
				this.width = 240;
				this.height = 135;
			}
			set src(_v) {
				// Synchronous success
				if (typeof this.onload === 'function') {
					this.onload();
				}
			}
		}
		globalThis.Image = MockImage;

		const ctx = {}; // not used by loader in our test
		const loader = new AnimationLoader(ctx);
		const animations = await loader.setUpAnimations('/fake.json');
		expect(animations).toBeTruthy();
		expect(animations[0][60]).toBeDefined();
	});
});

describe('AnimationLoader - sanitizeFileName (indirect tests)', () => {
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
		// JSON with malicious filename
		const maliciousJson = {
			0: {
				60: {
					0: { png: '../secret.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
				}
			}
		};
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => maliciousJson });

		// MockImage that tracks src set and rejects load for empty src
		class MockImage {
			constructor() {
				this.onload = null;
				this.onerror = null;
				this.width = 240;
				this.height = 135;
			}
			set src(v) {
				// Will fail for sanitized empty filename
				if (v.endsWith('/')) {
					if (typeof this.onerror === 'function') {
						this.onerror();
					}
				} else if (typeof this.onload === 'function') {
					this.onload();
				}
			}
		}
		globalThis.Image = MockImage;

		const ctx = {};
		const loader = new AnimationLoader(ctx);
		const animations = await loader.setUpAnimations('/fake.json');
		// Sanitizer warns about invalid filename
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '../secret.png');
		// Animation should not be loaded due to sanitization
		expect(animations[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('allows valid filenames with supported extensions', async () => {
		const validJson = {
			0: {
				60: {
					0: { png: 'sprite01.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
				}
			}
		};
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => validJson });

		class MockImage {
			constructor() {
				this.onload = null;
				this.onerror = null;
				this.width = 240;
				this.height = 135;
			}
			set src(_v) {
				if (typeof this.onload === 'function') {
					this.onload();
				}
			}
		}
		globalThis.Image = MockImage;

		const ctx = {};
		const loader = new AnimationLoader(ctx);
		const animations = await loader.setUpAnimations('/fake.json');
		expect(animations[0][60][0]).toBeDefined();
	});

	test('rejects filenames with invalid patterns like ....png or -.png', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const invalidJson = {
			0: {
				60: {
					0: { png: '....png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
				}
			}
		};
		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => invalidJson });

		class MockImage {
			constructor() {
				this.onload = null;
				this.onerror = null;
				this.width = 240;
				this.height = 135;
			}
			set src(v) {
				if (v.endsWith('/')) {
					if (typeof this.onerror === 'function') {
						this.onerror();
					}
				} else if (typeof this.onload === 'function') {
					this.onload();
				}
			}
		}
		globalThis.Image = MockImage;

		const ctx = {};
		const loader = new AnimationLoader(ctx);
		const animations = await loader.setUpAnimations('/fake.json');
		// Sanitizer should warn about the invalid filename
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid file name'), '....png');
		expect(animations[0]?.[60]?.[0]).toBeUndefined();
		consoleWarnSpy.mockRestore();
	});

	test('ignores non-numeric channel/note/velocity keys from JSON', async () => {
		const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const maliciousKeysJson = {
			'../etc': {
				60: {
					0: { png: 'sprite01.png', numberOfFrames: 1, framesPerRow: 1, loop: true, frameRatesForFrames: { 0: 60 }, retrigger: true }
				}
			}
		};

		globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => maliciousKeysJson });

		class MockImage {
			constructor() {
				this.onload = null;
				this.onerror = null;
				this.width = 240;
				this.height = 135;
			}
			set src(_v) {
				if (typeof this.onload === 'function') {
					this.onload();
				}
			}
		}
		globalThis.Image = MockImage;

		const ctx = {};
		const loader = new AnimationLoader(ctx);
		const animations = await loader.setUpAnimations('/fake.json');

		// Should have warned about non-numeric keys and not loaded any animations
		expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('ignoring animation with non-numeric path keys'), expect.any(Object));
		expect(Object.keys(animations).length).toBe(0);

		consoleWarnSpy.mockRestore();
	});
});
