import { vi } from 'vitest';
import settings from '../../src/js/core/settings.js';

/**
 * Install mocks for requestAnimationFrame and cancelAnimationFrame.
 * @returns {{ rafSpy: import('vitest').Mock, cafSpy: import('vitest').Mock }}
 */
export function installRAFMocks() {
	const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
	const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
	return { rafSpy, cafSpy };
}

/**
 * Restore the RAF mocks installed by {@link installRAFMocks}.
 * @param {{ rafSpy: import('vitest').Mock, cafSpy: import('vitest').Mock }} mocks
 */
export function restoreRAFMocks({ rafSpy, cafSpy }) {
	rafSpy.mockRestore();
	cafSpy.mockRestore();
}

/**
 * Create a basic mocked 2D canvas context.
 * @returns {Object}
 */
export function createMockContext() {
	return {
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		fillStyle: '#000000'
	};
}

/**
 * Create a more complete mocked 2D context suitable for off-screen canvases.
 * @returns {Object}
 */
export function createMockCanvasContext() {
	return {
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
		getImageData: vi.fn(() => ({
			width: settings.canvas.width,
			height: settings.canvas.height,
			data: new Uint8ClampedArray(settings.canvas.width * settings.canvas.height * 4)
		})),
		putImageData: vi.fn(),
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'high'
	};
}

/**
 * Replace document.createElement so canvas tags return mocked off-screen canvases.
 * Exposes the created canvases on globalThis for tests that need direct access.
 * @returns {{ restore: Function }}
 */
export function installMockCanvas() {
	const createElementBackup = document.createElement;
	const createdCanvases = [];

	document.createElement = tagName => {
		if (tagName === 'canvas') {
			const ctx = createMockCanvasContext();
			const canvas = {
				width: settings.canvas.width,
				height: settings.canvas.height,
				getContext: () => ctx
			};
			createdCanvases.push(canvas);
			return canvas;
		}
		return createElementBackup(tagName);
	};

	return {
		createdCanvases,
		restore: () => {
			document.createElement = createElementBackup;
		}
	};
}
