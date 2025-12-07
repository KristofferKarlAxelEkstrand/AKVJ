import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import AnimationLoader from '../src/js/visuals/AnimationLoader.js';
import settings from '../src/js/core/settings.js';

describe('AnimationLoader', () => {
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
		expect(animations[0]['60']).toBeDefined();
	});
});
