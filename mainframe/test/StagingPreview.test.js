// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { advanceFrame, ShuffleState, PingpongState } from '../src/js/playbackUtils.js';
import '../src/js/StagingPreview.js';

describe('advanceFrame', () => {
	test('loop mode wraps around', () => {
		expect(advanceFrame(5, 6, 'loop')).toEqual({ frame: 0, finished: false });
		expect(advanceFrame(0, 6, 'loop')).toEqual({ frame: 1, finished: false });
	});

	test('once mode stops at last frame', () => {
		expect(advanceFrame(4, 6, 'once')).toEqual({ frame: 5, finished: false });
		expect(advanceFrame(5, 6, 'once')).toEqual({ frame: 5, finished: true });
	});

	test('reverse mode decrements with wrap', () => {
		expect(advanceFrame(5, 6, 'reverse')).toEqual({ frame: 4, finished: false });
		expect(advanceFrame(0, 6, 'reverse')).toEqual({ frame: 5, finished: false });
	});

	test('random mode returns a valid frame', () => {
		const result = advanceFrame(0, 6, 'random');
		expect(result.frame).toBeGreaterThanOrEqual(0);
		expect(result.frame).toBeLessThan(6);
		expect(result.finished).toBe(false);
	});

	test('pingpong mode bounces without state (forward only)', () => {
		expect(advanceFrame(0, 4, 'pingpong')).toEqual({ frame: 1, finished: false });
		expect(advanceFrame(2, 4, 'pingpong')).toEqual({ frame: 3, finished: false });
	});

	test('pingpong mode full cycle with PingpongState', () => {
		const pingpongState = new PingpongState();
		const frameCount = 4;
		const sequence = [];
		let frame = 0;
		for (let i = 0; i < 10; i++) {
			const result = advanceFrame(frame, frameCount, 'pingpong', undefined, pingpongState);
			frame = result.frame;
			sequence.push(frame);
		}
		expect(sequence).toEqual([1, 2, 3, 2, 1, 0, 1, 2, 3, 2]);
	});

	test('pingpong mode does not freeze at last frame with state', () => {
		const pingpongState = new PingpongState();
		const frameCount = 4;
		let frame = 2;
		const result1 = advanceFrame(frame, frameCount, 'pingpong', undefined, pingpongState);
		frame = result1.frame;
		expect(frame).toBe(3);
		const result2 = advanceFrame(frame, frameCount, 'pingpong', undefined, pingpongState);
		frame = result2.frame;
		expect(frame).toBe(2);
		const result3 = advanceFrame(frame, frameCount, 'pingpong', undefined, pingpongState);
		frame = result3.frame;
		expect(frame).toBe(1);
	});

	test('scrub mode behaves like loop', () => {
		expect(advanceFrame(3, 6, 'scrub')).toEqual({ frame: 4, finished: false });
		expect(advanceFrame(5, 6, 'scrub')).toEqual({ frame: 0, finished: false });
	});

	test('shuffle without state falls back to random', () => {
		const result = advanceFrame(0, 6, 'shuffle');
		expect(result.frame).toBeGreaterThanOrEqual(0);
		expect(result.frame).toBeLessThan(6);
	});

	test('shuffle with state visits all frames before repeating', () => {
		const shuffleState = new ShuffleState(6);
		const visited = new Set();
		for (let i = 0; i < 6; i++) {
			const result = advanceFrame(0, 6, 'shuffle', shuffleState);
			visited.add(result.frame);
		}
		expect(visited.size).toBe(6);
	});

	test('shuffle reshuffles after all frames visited', () => {
		const shuffleState = new ShuffleState(4);
		const firstPass = [];
		for (let i = 0; i < 4; i++) {
			firstPass.push(advanceFrame(0, 4, 'shuffle', shuffleState).frame);
		}
		const secondPass = [];
		for (let i = 0; i < 4; i++) {
			secondPass.push(advanceFrame(0, 4, 'shuffle', shuffleState).frame);
		}
		expect(new Set(firstPass).size).toBe(4);
		expect(new Set(secondPass).size).toBe(4);
	});
});

describe('ShuffleState', () => {
	test('visits all frames exactly once per cycle', () => {
		const shuffleState = new ShuffleState(8);
		const visited = [];
		for (let i = 0; i < 8; i++) {
			visited.push(shuffleState.next());
		}
		expect(new Set(visited).size).toBe(8);
	});

	test('reset reshuffles', () => {
		const shuffleState = new ShuffleState(4);
		const firstPass = [];
		for (let i = 0; i < 4; i++) {
			firstPass.push(shuffleState.next());
		}
		shuffleState.reset();
		const secondPass = [];
		for (let i = 0; i < 4; i++) {
			secondPass.push(shuffleState.next());
		}
		expect(new Set(firstPass).size).toBe(4);
		expect(new Set(secondPass).size).toBe(4);
	});

	test('handles single frame', () => {
		const shuffleState = new ShuffleState(1);
		expect(shuffleState.next()).toBe(0);
		expect(shuffleState.next()).toBe(0);
	});
});

describe('StagingPreview', () => {
	/** @type {import('../src/js/StagingPreview.js').default} */
	let element;

	beforeEach(() => {
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
			imageSmoothingEnabled: false,
			clearRect: () => {},
			drawImage: () => {}
		});
		element = document.createElement('akvj-staging-preview');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
		vi.restoreAllMocks();
	});

	test('renders canvas and controls on connect', () => {
		expect(element.querySelector('canvas')).not.toBeNull();
		expect(element.querySelector('button.clip-preview-play')).not.toBeNull();
	});

	test('play/pause button is disabled initially', () => {
		const playButton = element.querySelector('button.clip-preview-play');
		expect(playButton.disabled).toBe(true);
	});

	test('play/pause button stays disabled when loadFrames called with no files', async () => {
		await element.loadFrames([], 240, 135, [], 'loop');
		const playButton = element.querySelector('button.clip-preview-play');
		expect(playButton.disabled).toBe(true);
	});

	test('play/pause button is enabled after successful frame load', async () => {
		const mockFile = new File(['pixel-data'], 'frame0.png', { type: 'image/png' });

		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();

		const originalImage = global.Image;
		global.Image = class {
			set src(value) {
				this._src = value;
				setTimeout(() => this.onload && this.onload(), 0);
			}
			get src() {
				return this._src;
			}
		};

		await element.loadFrames([mockFile], 240, 135, [], 'loop');

		const playButton = element.querySelector('button.clip-preview-play');
		expect(playButton.disabled).toBe(false);

		global.Image = originalImage;
	});

	test('sets CSS display size to 2× frame size', async () => {
		await element.loadFrames([], 240, 135, [], 'loop');
		const canvas = element.querySelector('canvas');
		expect(canvas.width).toBe(240);
		expect(canvas.height).toBe(135);
		expect(canvas.style.width).toBe('480px');
		expect(canvas.style.height).toBe('270px');
	});

	test('caps CSS display width at 960px', async () => {
		await element.loadFrames([], 600, 300, [], 'loop');
		const canvas = element.querySelector('canvas');
		expect(canvas.width).toBe(600);
		expect(canvas.height).toBe(300);
		expect(canvas.style.width).toBe('960px');
		expect(canvas.style.height).toBe('480px');
	});

	test('pattern mode previews on the 240×135 output canvas', async () => {
		await element.loadFrames([], 16, 16, [], 'loop', 'pattern');
		const canvas = element.querySelector('canvas');
		expect(canvas.width).toBe(240);
		expect(canvas.height).toBe(135);
		expect(canvas.style.width).toBe('480px');
		expect(canvas.style.height).toBe('270px');
	});

	test('shows "No frames staged" when loadFrames called with no files', async () => {
		await element.loadFrames([], 240, 135, [], 'loop');
		const frameLabel = element.querySelector('.clip-preview-frame-label');
		expect(frameLabel.textContent).toBe('No frames staged');
	});

	test('shows error message when frame loading fails', async () => {
		const mockFile = new File(['bad-data'], 'broken.png', { type: 'image/png' });

		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();

		const originalImage = global.Image;
		global.Image = class {
			set src(value) {
				this._src = value;
				setTimeout(() => this.onerror && this.onerror(new Error('load failed')), 0);
			}
			get src() {
				return this._src;
			}
		};

		await element.loadFrames([mockFile], 240, 135, [], 'loop');

		const frameLabel = element.querySelector('.clip-preview-frame-label');
		expect(frameLabel.textContent).toContain('Failed to load');

		global.Image = originalImage;
	});

	test('scrub slider updates frame label', async () => {
		const files = [
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' }),
			new File(['c'], 'frame2.png', { type: 'image/png' })
		];

		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();

		const originalImage = global.Image;
		global.Image = class {
			set src(value) {
				this._src = value;
				setTimeout(() => this.onload && this.onload(), 0);
			}
			get src() {
				return this._src;
			}
		};

		await element.loadFrames(files, 240, 135, [], 'loop');

		const scrub = element.querySelector('.clip-preview-scrub');
		expect(scrub.disabled).toBe(false);
		expect(scrub.max).toBe('2');

		scrub.value = '2';
		scrub.dispatchEvent(new Event('input', { bubbles: true }));

		const frameLabel = element.querySelector('.clip-preview-frame-label');
		expect(frameLabel.textContent).toBe('Frame 3 / 3');

		global.Image = originalImage;
	});

	test('play button toggles between Pause and Play after load', async () => {
		const mockFile = new File(['pixel-data'], 'frame0.png', { type: 'image/png' });
		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
		vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		const originalImage = global.Image;
		global.Image = class {
			set src(value) {
				this._src = value;
				setTimeout(() => this.onload && this.onload(), 0);
			}
			get src() {
				return this._src;
			}
		};

		await element.loadFrames([mockFile], 240, 135, [], 'loop');
		const playButton = element.querySelector('button.clip-preview-play');
		expect(playButton.disabled).toBe(false);
		expect(playButton.textContent).toBe('Pause');
		playButton.click();
		expect(playButton.textContent).toBe('Play');
		playButton.click();
		expect(playButton.textContent).toBe('Pause');

		global.Image = originalImage;
	});

	test('holds each frame for its per-frame durationMs (not a global frameRate)', async () => {
		const files = [
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' }),
			new File(['c'], 'frame2.png', { type: 'image/png' })
		];
		const durationsMs = [100, 400, 100];

		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();

		/** @type {FrameRequestCallback[]} */
		const rafQueue = [];
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
			rafQueue.push(cb);
			return rafQueue.length;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		const originalImage = global.Image;
		global.Image = class {
			set src(value) {
				this._src = value;
				setTimeout(() => this.onload && this.onload(), 0);
			}
			get src() {
				return this._src;
			}
		};

		await element.loadFrames(files, 240, 135, durationsMs, 'once', 'fit');

		const frameLabel = element.querySelector('.clip-preview-frame-label');
		expect(frameLabel.textContent).toBe('Frame 1 / 3');

		const pump = timestamp => {
			const cb = rafQueue.shift();
			expect(cb).toBeTypeOf('function');
			cb(timestamp);
		};

		pump(0);
		expect(frameLabel.textContent).toBe('Frame 1 / 3');

		pump(50);
		expect(frameLabel.textContent).toBe('Frame 1 / 3');

		pump(100);
		expect(frameLabel.textContent).toBe('Frame 2 / 3');

		pump(300);
		expect(frameLabel.textContent).toBe('Frame 2 / 3');

		pump(500);
		expect(frameLabel.textContent).toBe('Frame 3 / 3');

		element.querySelector('button.clip-preview-play').click();
		global.Image = originalImage;
	});

	test('loadFrames resets playback speed to 1×', async () => {
		const mockFile = new File(['pixel-data'], 'frame0.png', { type: 'image/png' });
		global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
		vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

		const originalImage = global.Image;
		global.Image = class {
			set src(value) {
				this._src = value;
				setTimeout(() => this.onload && this.onload(), 0);
			}
			get src() {
				return this._src;
			}
		};

		await element.loadFrames([mockFile], 240, 135, [], 'loop');
		const speedSelect = element.querySelector('.clip-preview-speed');
		speedSelect.value = '2';
		speedSelect.dispatchEvent(new Event('change', { bubbles: true }));
		expect(element.playbackSpeed).toBe(2);
		expect(speedSelect.value).toBe('2');

		await element.loadFrames([mockFile], 240, 135, [], 'loop');
		expect(element.playbackSpeed).toBe(1);
		expect(element.querySelector('.clip-preview-speed').value).toBe('1');

		global.Image = originalImage;
	});

	test('cleans up on disconnect', () => {
		element.remove();
		expect(element.children.length).toBe(0);
	});
});

/**
 * Minimal software 2d context for asserting bake/placement draw results in jsdom.
 * @param {HTMLCanvasElement} canvas
 */
function createRecording2dContext(canvas) {
	/** @type {Uint8ClampedArray} */
	let buffer = new Uint8ClampedArray(0);

	const syncBuffer = () => {
		const size = Math.max(0, canvas.width) * Math.max(0, canvas.height) * 4;
		if (buffer.length !== size) {
			buffer = new Uint8ClampedArray(size);
		}
		canvas._recordingBuffer = buffer;
	};

	/**
	 * @param {CanvasImageSource & { _fill?: number[], _recordingBuffer?: Uint8ClampedArray, width: number, height: number }} source
	 * @param {number} sx
	 * @param {number} sy
	 * @returns {[number, number, number, number]}
	 */
	const sampleSource = (source, sx, sy) => {
		if (Array.isArray(source._fill)) {
			return source._fill;
		}
		const srcBuf = source._recordingBuffer;
		const srcW = source.width || 0;
		const srcH = source.height || 0;
		if (!srcBuf || srcW <= 0 || srcH <= 0) {
			return [0, 0, 0, 0];
		}
		const x = Math.min(srcW - 1, Math.max(0, Math.floor(sx)));
		const y = Math.min(srcH - 1, Math.max(0, Math.floor(sy)));
		const i = (y * srcW + x) * 4;
		return [srcBuf[i], srcBuf[i + 1], srcBuf[i + 2], srcBuf[i + 3]];
	};

	return {
		imageSmoothingEnabled: false,
		/** @type {{ sourceWidth: number, sourceHeight: number, dx: number, dy: number }[]} */
		drawCalls: [],
		clearRect(x, y, width, height) {
			syncBuffer();
			const canvasWidth = canvas.width;
			const canvasHeight = canvas.height;
			const x0 = Math.max(0, Math.floor(x));
			const y0 = Math.max(0, Math.floor(y));
			const x1 = Math.min(canvasWidth, Math.ceil(x + width));
			const y1 = Math.min(canvasHeight, Math.ceil(y + height));
			for (let row = y0; row < y1; row++) {
				for (let col = x0; col < x1; col++) {
					const i = (row * canvasWidth + col) * 4;
					buffer[i] = 0;
					buffer[i + 1] = 0;
					buffer[i + 2] = 0;
					buffer[i + 3] = 0;
				}
			}
		},
		drawImage(source, ...args) {
			syncBuffer();
			let sx = 0;
			let sy = 0;
			let sWidth = source.width || 0;
			let sHeight = source.height || 0;
			let dx;
			let dy;
			let dWidth;
			let dHeight;
			if (args.length === 2) {
				[dx, dy] = args;
				dWidth = sWidth;
				dHeight = sHeight;
			} else if (args.length === 4) {
				[dx, dy, dWidth, dHeight] = args;
			} else {
				[sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = args;
			}
			dx = Math.floor(dx);
			dy = Math.floor(dy);
			dWidth = Math.floor(dWidth);
			dHeight = Math.floor(dHeight);
			this.drawCalls.push({
				sourceWidth: source.width || 0,
				sourceHeight: source.height || 0,
				dx,
				dy
			});

			const canvasWidth = canvas.width;
			const canvasHeight = canvas.height;
			for (let row = 0; row < dHeight; row++) {
				const destY = dy + row;
				if (destY < 0 || destY >= canvasHeight) {
					continue;
				}
				const srcY = sy + (dHeight === 0 ? 0 : (row * sHeight) / dHeight);
				for (let col = 0; col < dWidth; col++) {
					const destX = dx + col;
					if (destX < 0 || destX >= canvasWidth) {
						continue;
					}
					const srcX = sx + (dWidth === 0 ? 0 : (col * sWidth) / dWidth);
					const [r, g, b, a] = sampleSource(source, srcX, srcY);
					if (a === 0) {
						continue;
					}
					const i = (destY * canvasWidth + destX) * 4;
					buffer[i] = r;
					buffer[i + 1] = g;
					buffer[i + 2] = b;
					buffer[i + 3] = a;
				}
			}
		},
		getImageData(x, y, width, height) {
			syncBuffer();
			const data = new Uint8ClampedArray(width * height * 4);
			const canvasWidth = canvas.width;
			const canvasHeight = canvas.height;
			for (let row = 0; row < height; row++) {
				for (let col = 0; col < width; col++) {
					const srcX = x + col;
					const srcY = y + row;
					const di = (row * width + col) * 4;
					if (srcX < 0 || srcY < 0 || srcX >= canvasWidth || srcY >= canvasHeight) {
						continue;
					}
					const si = (srcY * canvasWidth + srcX) * 4;
					data[di] = buffer[si];
					data[di + 1] = buffer[si + 1];
					data[di + 2] = buffer[si + 2];
					data[di + 3] = buffer[si + 3];
				}
			}
			return { width, height, data };
		}
	};
}

/**
 * @param {{ width?: number, height?: number, fill?: number[] }} [options]
 */
function installSolidImageMock(options = {}) {
	const { width = 8, height = 8, fill = [255, 0, 0, 255] } = options;
	const originalImage = global.Image;
	global.Image = class {
		width = width;
		height = height;
		naturalWidth = width;
		naturalHeight = height;
		_fill = fill;
		onload = null;
		onerror = null;
		set src(value) {
			this._src = value;
			queueMicrotask(() => this.onload?.());
		}
		get src() {
			return this._src;
		}
	};
	global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
	global.URL.revokeObjectURL = vi.fn();
	return () => {
		global.Image = originalImage;
	};
}

/**
 * @param {ImageData | { data: Uint8ClampedArray }} imageData
 * @returns {{ x: number, y: number } | null}
 */
function firstOpaquePixel(imageData) {
	const { data, width } = imageData;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] > 0) {
			const pixelIndex = i / 4;
			return { x: pixelIndex % width, y: Math.floor(pixelIndex / width) };
		}
	}
	return null;
}

describe('StagingPreview bake/placement drawing', () => {
	/** @type {import('../src/js/StagingPreview.js').default} */
	let element;
	/** @type {ReturnType<typeof createRecording2dContext> | null} */
	let previewCtx = null;

	beforeEach(() => {
		previewCtx = null;
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function getRecordingContext(type) {
			if (type !== '2d') {
				return null;
			}
			if (!this._recordingCtx || this._recordingWidth !== this.width || this._recordingHeight !== this.height) {
				this._recordingCtx = createRecording2dContext(this);
				this._recordingWidth = this.width;
				this._recordingHeight = this.height;
			}
			if (this.classList?.contains('staging-preview-canvas')) {
				previewCtx = this._recordingCtx;
			}
			return this._recordingCtx;
		});
		vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
		element = document.createElement('akvj-staging-preview');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
		vi.restoreAllMocks();
	});

	test('runtime placement offsets shift the drawn frame on the preview canvas', async () => {
		const restoreImage = installSolidImageMock({ width: 8, height: 8, fill: [255, 0, 0, 255] });
		const file = new File(['pixel'], 'frame0.png', { type: 'image/png' });

		await element.loadFrames([file], 32, 32, [1000], 'loop', 'none', { x: 0, y: 0 }, [
			{ scaleMode: 'none', placement: { x: 0, y: 0 } }
		]);
		element.querySelector('button.clip-preview-play').click();

		const canvas = element.querySelector('canvas');
		const baseline = firstOpaquePixel(previewCtx.getImageData(0, 0, canvas.width, canvas.height));
		expect(baseline).not.toBeNull();

		await element.loadFrames([file], 32, 32, [1000], 'loop', 'none', { x: 10, y: 6 }, [
			{ scaleMode: 'none', placement: { x: 0, y: 0 } }
		]);
		element.querySelector('button.clip-preview-play').click();

		const shifted = previewCtx.getImageData(0, 0, canvas.width, canvas.height);
		const atBaseline = shifted.data[((baseline.y * canvas.width + baseline.x) * 4) + 3];
		const atOffset = shifted.data[(((baseline.y + 6) * canvas.width + (baseline.x + 10)) * 4) + 3];
		expect(atBaseline).toBe(0);
		expect(atOffset).toBe(255);

		restoreImage();
	});

	test('per-frame bakeConfigs are honored when scrubbing frames', async () => {
		const restoreImage = installSolidImageMock({ width: 4, height: 4, fill: [0, 255, 0, 255] });
		const files = [
			new File(['a'], 'frame0.png', { type: 'image/png' }),
			new File(['b'], 'frame1.png', { type: 'image/png' })
		];

		await element.loadFrames(files, 40, 40, [1000, 1000], 'loop', 'none', { x: 0, y: 0 }, [
			{ scaleMode: 'none', placement: { x: 0, y: 0 } },
			{ scaleMode: 'none', placement: { x: 12, y: 0 } }
		]);
		element.querySelector('button.clip-preview-play').click();

		const canvas = element.querySelector('canvas');
		const frame0Origin = firstOpaquePixel(previewCtx.getImageData(0, 0, canvas.width, canvas.height));
		expect(frame0Origin).not.toBeNull();

		const scrub = element.querySelector('.clip-preview-scrub');
		scrub.value = '1';
		scrub.dispatchEvent(new Event('input', { bubbles: true }));

		const frame1Data = previewCtx.getImageData(0, 0, canvas.width, canvas.height);
		const frame1Origin = firstOpaquePixel(frame1Data);
		expect(frame1Origin).not.toBeNull();
		expect(frame1Origin.x).toBe(frame0Origin.x + 12);
		expect(frame1Origin.y).toBe(frame0Origin.y);

		restoreImage();
	});

	test('ensureTileCanvas matches target cell size for small and large tiles', async () => {
		const restoreImage = installSolidImageMock({ width: 4, height: 4, fill: [0, 0, 255, 255] });
		const file = new File(['pixel'], 'frame0.png', { type: 'image/png' });

		await element.loadFrames([file], 16, 16, [1000], 'loop', 'fit', { x: 0, y: 0 }, [
			{ scaleMode: 'fit' }
		]);
		element.querySelector('button.clip-preview-play').click();
		expect(previewCtx.drawCalls.some(call => call.sourceWidth === 16 && call.sourceHeight === 16)).toBe(true);

		previewCtx.drawCalls.length = 0;
		await element.loadFrames([file], 300, 200, [1000], 'loop', 'fit', { x: 0, y: 0 }, [
			{ scaleMode: 'fit' }
		]);
		element.querySelector('button.clip-preview-play').click();
		expect(previewCtx.drawCalls.some(call => call.sourceWidth === 300 && call.sourceHeight === 200)).toBe(true);

		previewCtx.drawCalls.length = 0;
		await element.loadFrames([file], 16, 16, [1000], 'loop', 'pattern', { x: 3, y: 5 }, [
			{ scaleMode: 'none' }
		]);
		element.querySelector('button.clip-preview-play').click();
		const canvas = element.querySelector('canvas');
		expect(canvas.width).toBe(240);
		expect(canvas.height).toBe(135);
		expect(previewCtx.drawCalls.some(call => call.sourceWidth === 16 && call.sourceHeight === 16)).toBe(true);
		expect(previewCtx.drawCalls.length).toBeGreaterThan(1);

		restoreImage();
	});
});
