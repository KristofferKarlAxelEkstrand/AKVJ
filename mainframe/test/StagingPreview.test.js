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

describe('AkvjStagingPreview', () => {
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
		await element.loadFrames([], 240, 135, 12, 'loop');
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

		await element.loadFrames([mockFile], 240, 135, 12, 'loop');

		const playButton = element.querySelector('button.clip-preview-play');
		expect(playButton.disabled).toBe(false);

		global.Image = originalImage;
	});

	test('sets CSS display size to 2× frame size', async () => {
		await element.loadFrames([], 240, 135, 12, 'loop');
		const canvas = element.querySelector('canvas');
		expect(canvas.width).toBe(240);
		expect(canvas.height).toBe(135);
		expect(canvas.style.width).toBe('480px');
		expect(canvas.style.height).toBe('270px');
	});

	test('caps CSS display width at 960px', async () => {
		await element.loadFrames([], 600, 300, 12, 'loop');
		const canvas = element.querySelector('canvas');
		expect(canvas.width).toBe(600);
		expect(canvas.height).toBe(300);
		expect(canvas.style.width).toBe('960px');
		expect(canvas.style.height).toBe('480px');
	});

	test('shows "No frames staged" when loadFrames called with no files', async () => {
		await element.loadFrames([], 240, 135, 12, 'loop');
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

		await element.loadFrames([mockFile], 240, 135, 12, 'loop');

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

		await element.loadFrames(files, 240, 135, 12, 'loop');

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

		await element.loadFrames([mockFile], 240, 135, 12, 'loop');
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

		await element.loadFrames(files, 240, 135, 12, 'once', 'fit', durationsMs);

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

		await element.loadFrames([mockFile], 240, 135, 12, 'loop');
		const speedSelect = element.querySelector('.clip-preview-speed');
		speedSelect.value = '2';
		speedSelect.dispatchEvent(new Event('change', { bubbles: true }));
		expect(element.playbackSpeed).toBe(2);
		expect(speedSelect.value).toBe('2');

		await element.loadFrames([mockFile], 240, 135, 12, 'loop');
		expect(element.playbackSpeed).toBe(1);
		expect(element.querySelector('.clip-preview-speed').value).toBe('1');

		global.Image = originalImage;
	});

	test('cleans up on disconnect', () => {
		element.remove();
		expect(element.children.length).toBe(0);
	});
});
