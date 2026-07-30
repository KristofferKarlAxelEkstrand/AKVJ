// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/js/PreviewClip.js';
import { DEFAULT_FRAME_RATE } from '../src/js/clipSchema.js';
import { createMock2dContext } from './utils/mockCanvas.js';

const FRAME_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const FALLBACK_MS = 1000 / DEFAULT_FRAME_RATE;

function flushPromises() {
	return new Promise(resolve => setTimeout(resolve, 0));
}

function mockFetch(frames = [FRAME_DATA_URL], durationsMs = []) {
	return vi.spyOn(global, 'fetch').mockResolvedValue({
		ok: true,
		json: async () => ({ frames, durationsMs })
	});
}

function mockImage() {
	const original = global.Image;
	global.Image = class {
		constructor() {
			this.naturalWidth = 2;
			this.naturalHeight = 1;
			this.width = 2;
			this.height = 1;
		}

		set src(value) {
			this._src = value;
			const hasError = typeof value === 'string' && value.startsWith('error:');
			const handler = hasError ? this.onerror : this.onload;
			if (handler) {
				handler();
			}
		}

		get src() {
			return this._src;
		}
	};
	return original;
}

describe('PreviewClip', () => {
	/** @type {import('../src/js/PreviewClip.js').default} */
	let element;
	let originalImage;
	/** @type {{ imageSmoothingEnabled: boolean, clearRect: Function, drawImage: Function }} */
	let mockCtx;

	beforeEach(() => {
		mockCtx = createMock2dContext({ imageSmoothingEnabled: true });
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);
		originalImage = mockImage();
		element = document.createElement('preview-clip');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
		global.Image = originalImage;
		vi.restoreAllMocks();
	});

	test('forces imageSmoothingEnabled false on connect', () => {
		expect(mockCtx.imageSmoothingEnabled).toBe(false);
	});

	test('re-applies imageSmoothingEnabled false when paint resizes the canvas buffer', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL]);
		element.clipId = 'paint-smooth-lock';
		await flushPromises();

		element.currentFrame = 1;
		mockCtx.imageSmoothingEnabled = true;
		const canvas = element.querySelector('canvas');
		canvas.width = 1;
		canvas.height = 1;
		element.currentFrame = 0;
		expect(mockCtx.imageSmoothingEnabled).toBe(false);
	});

	test('renders canvas, speed control, and progress indicator', () => {
		expect(element.querySelector('canvas')).not.toBeNull();
		expect(element.querySelector('select.preview-clip-speed')).not.toBeNull();
		expect(element.querySelector('progress.preview-clip-progress')).not.toBeNull();
		expect(element.querySelector('span.preview-clip-frame-label')).not.toBeNull();
	});

	test('play button is disabled before a clip is loaded', () => {
		const playButton = element.querySelector('button.preview-clip-play');
		expect(playButton.disabled).toBe(true);
	});

	test('set clipId loads frames and updates totalFrames', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL]);
		element.clipId = 'test-clip';

		await flushPromises();

		expect(global.fetch).toHaveBeenCalledWith('/api/clips/test-clip/frames');
		expect(element.totalFrames).toBe(2);
		expect(element.currentFrame).toBe(0);

		const playButton = element.querySelector('button.preview-clip-play');
		expect(playButton.disabled).toBe(false);
	});

	test('play(), pause(), and stop() toggle playback state and button text', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL]);
		vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		element.clipId = 'test-clip';
		await flushPromises();

		const playButton = element.querySelector('button.preview-clip-play');
		element.play();
		expect(element.isPlaying).toBe(true);
		expect(playButton.textContent).toBe('Pause');

		element.pause();
		expect(element.isPlaying).toBe(false);
		expect(playButton.textContent).toBe('Play');

		element.play();
		element.stop();
		expect(element.isPlaying).toBe(false);
		expect(element.currentFrame).toBe(0);
	});

	test('setSpeed updates speed and dispatches speedchange', () => {
		const listener = vi.fn();
		element.addEventListener('speedchange', listener);
		element.setSpeed(2);

		expect(element.querySelector('select.preview-clip-speed').value).toBe('2');
		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener.mock.calls[0][0].detail.speed).toBe(2);
	});

	test('playback dispatches framechange and playbackended in once mode', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL]);

		/** @type {FrameRequestCallback[]} */
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		element.clipId = 'test-clip';
		element.playbackMode = 'once';
		await flushPromises();

		const frameListener = vi.fn();
		const endListener = vi.fn();
		element.addEventListener('framechange', frameListener);
		element.addEventListener('playbackended', endListener);

		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(100);
		expect(element.currentFrame).toBe(1);
		pump(200);

		expect(element.isPlaying).toBe(false);
		expect(endListener).toHaveBeenCalledTimes(1);
		expect(endListener.mock.calls[0][0].detail.totalFrames).toBe(2);
		expect(frameListener.mock.calls.some(call => call[0].detail.currentFrame === 1)).toBe(true);
	});

	test('currentFrame setter clamps and dispatches framechange', () => {
		const listener = vi.fn();
		element.addEventListener('framechange', listener);
		element.currentFrame = 5;
		expect(element.currentFrame).toBe(0);
		expect(listener).not.toHaveBeenCalled();
	});

	test('playbackMode setter rejects unknown values and falls back to loop', () => {
		element.playbackMode = 'not-a-mode';
		expect(element.playbackMode).toBe('loop');
	});

	test('currentFrame setter clamps to the last frame when totalFrames > 0', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		element.clipId = 'clamp-clip';
		await flushPromises();

		element.currentFrame = 5;
		expect(element.currentFrame).toBe(2);

		element.currentFrame = -1;
		expect(element.currentFrame).toBe(0);

		element.currentFrame = 1.5;
		expect(element.currentFrame).toBe(1);
	});

	test('reverse playback advances backward and wraps', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		element.clipId = 'reverse-clip';
		element.playbackMode = 'reverse';
		await flushPromises();
		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(100);
		expect(element.currentFrame).toBe(2);
		pump(200);
		expect(element.currentFrame).toBe(1);
		pump(300);
		expect(element.currentFrame).toBe(0);
		expect(element.isPlaying).toBe(true);
	});

	test('random playback picks a frame from Math.random', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});
		vi.spyOn(Math, 'random').mockReturnValue(0.5);

		element.clipId = 'random-clip';
		element.playbackMode = 'random';
		await flushPromises();
		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(100);
		expect(element.currentFrame).toBe(1);
	});

	test('scrub playback loops like loop mode', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});

		element.clipId = 'scrub-clip';
		element.playbackMode = 'scrub';
		await flushPromises();
		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(100);
		expect(element.currentFrame).toBe(1);
		pump(200);
		expect(element.currentFrame).toBe(2);
		pump(300);
		expect(element.currentFrame).toBe(0);
		expect(element.isPlaying).toBe(true);
	});

	test('pingpong playback bounces at the last frame', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});

		element.clipId = 'pingpong-clip';
		element.playbackMode = 'pingpong';
		await flushPromises();
		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(100);
		expect(element.currentFrame).toBe(1);
		pump(200);
		expect(element.currentFrame).toBe(2);
		pump(300);
		expect(element.currentFrame).toBe(1);
		expect(element.isPlaying).toBe(true);
	});

	test('shuffle playback visits all frames before repeating', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});
		vi.spyOn(Math, 'random').mockReturnValue(0);

		element.clipId = 'shuffle-clip';
		element.playbackMode = 'shuffle';
		await flushPromises();
		element.play();

		const visited = new Set([element.currentFrame]);
		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
			visited.add(element.currentFrame);
		};

		pump(0);
		pump(100);
		pump(200);
		pump(300);

		// Math.random returning 0 deterministically produces the order [1, 2, 0].
		expect(element.currentFrame).toBe(0);
		expect(visited).toEqual(new Set([0, 1, 2]));
	});

	test('loadClip sets totalFrames to 0 when fetch returns 4xx/5xx', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: false,
			status: 404,
			json: async () => ({})
		});

		element.clipId = 'missing-clip';
		await flushPromises();

		expect(global.fetch).toHaveBeenCalledWith('/api/clips/missing-clip/frames');
		expect(element.totalFrames).toBe(0);
		expect(element.querySelector('button.preview-clip-play').disabled).toBe(true);
	});

	test('loadClip sets totalFrames to 0 when JSON is malformed', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => {
				throw new SyntaxError('Unexpected token');
			}
		});

		element.clipId = 'bad-json';
		await flushPromises();

		expect(element.totalFrames).toBe(0);
		expect(element.querySelector('button.preview-clip-play').disabled).toBe(true);
	});

	test('loadClip resolves missing frames to an empty clip', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ notFrames: [FRAME_DATA_URL] })
		});

		element.clipId = 'no-frames';
		await flushPromises();

		expect(element.totalFrames).toBe(0);
		expect(element.querySelector('button.preview-clip-play').disabled).toBe(true);
	});

	test('loadClip treats image onerror as null frames', async () => {
		mockFetch(['error://bad.png']);

		element.clipId = 'bad-image';
		await flushPromises();

		expect(element.totalFrames).toBe(1);
		expect(element.querySelector('button.preview-clip-play').disabled).toBe(false);
	});

	test('normalizeDurationsMs falls back to FALLBACK_MS for invalid durations', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL], [0, -1, NaN]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});

		element.clipId = 'fallback-clip';
		await flushPromises();
		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(Math.ceil(FALLBACK_MS) - 1);
		expect(element.currentFrame).toBe(0);

		pump(Math.ceil(FALLBACK_MS));
		expect(element.currentFrame).toBe(1);
	});

	test('getFrameIntervalMs divides the fallback duration by speed', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL]);
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});

		element.clipId = 'speed-clip';
		await flushPromises();
		element.setSpeed(2);
		element.play();

		const pump = timestamp => {
			const cb = rafQueue.shift();
			if (cb) {
				cb(timestamp);
			}
		};

		pump(0);
		pump(Math.floor(FALLBACK_MS / 2) - 1);
		expect(element.currentFrame).toBe(0);

		pump(Math.ceil(FALLBACK_MS / 2));
		expect(element.currentFrame).toBe(1);
	});

	test('attributeChangedCallback reflects playback-mode, is-playing, and current-frame', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL, FRAME_DATA_URL]);
		vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		element.setAttribute('clip-id', 'attr-clip');
		await flushPromises();
		expect(global.fetch).toHaveBeenCalledWith('/api/clips/attr-clip/frames');

		element.setAttribute('playback-mode', 'pingpong');
		expect(element.playbackMode).toBe('pingpong');

		element.setAttribute('is-playing', '');
		expect(element.isPlaying).toBe(true);

		element.removeAttribute('is-playing');
		expect(element.isPlaying).toBe(false);

		element.setAttribute('current-frame', '2');
		expect(element.currentFrame).toBe(2);

		element.setAttribute('current-frame', '5');
		expect(element.currentFrame).toBe(2);

		element.setAttribute('current-frame', '-1');
		expect(element.currentFrame).toBe(0);
	});

	test('disconnectedCallback cancels animation frame and removes DOM', async () => {
		mockFetch([FRAME_DATA_URL, FRAME_DATA_URL]);
		const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});

		element.clipId = 'cleanup-clip';
		await flushPromises();
		element.play();

		element.remove();

		expect(cancelSpy).toHaveBeenCalled();
		expect(element.isConnected).toBe(false);
		expect(element.isPlaying).toBe(false);
	});
});
