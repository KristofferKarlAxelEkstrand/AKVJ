import { vi } from 'vitest';

/**
 * Stub CanvasRenderingContext2D for jsdom tests that only need method spies
 * (or a mutable `imageSmoothingEnabled` flag).
 * @param {{ imageSmoothingEnabled?: boolean }} [overrides]
 * @returns {Record<string, unknown>}
 */
export function createMock2dContext({ imageSmoothingEnabled = false } = {}) {
	return {
		imageSmoothingEnabled,
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		getImageData: vi.fn((x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })),
		putImageData: vi.fn(),
		createPattern: vi.fn(() => null),
		beginPath: vi.fn(),
		closePath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		stroke: vi.fn(),
		fill: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		scale: vi.fn(),
		clip: vi.fn()
	};
}
