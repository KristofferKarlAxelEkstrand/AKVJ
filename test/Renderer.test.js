import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Renderer from '../src/js/visuals/Renderer.js';

function createMockContext() {
	return {
		fillRect: vi.fn(),
		drawImage: vi.fn()
	};
}

function createMockLayer(playSpy = vi.fn()) {
	return { play: playSpy };
}

describe('Renderer', () => {
	let rafSpy;
	let cafSpy;

	beforeEach(() => {
		// Avoid recursive synchronous calls; let the first loop run and don't recursively call raf
		rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => {
			return 1; // no immediate callback
		});
		cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
	});

	afterEach(() => {
		rafSpy.mockRestore();
		cafSpy.mockRestore();
	});

	test('fills canvas with background color and renders active layers', () => {
		const ctx = createMockContext();
		const layer = createMockLayer();
		const layerManager = { getActiveLayers: () => [[layer]] };

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();

		expect(ctx.fillRect).toHaveBeenCalled();
		expect(layer.play).toHaveBeenCalled();
		// stop and destroy should not throw
		const stopSpy = vi.spyOn(renderer, 'stop');
		renderer.destroy();
		expect(stopSpy).toHaveBeenCalled();
	});

	test('skips rendering loop when no active layers present', () => {
		const ctx = createMockContext();
		const layerManager = { getActiveLayers: () => [] };

		const rafMock = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
		const renderer = new Renderer(ctx, layerManager);
		renderer.start();

		expect(ctx.fillRect).toHaveBeenCalled();
		// No layers to play -> nothing should call any play method
		rafMock.mockRestore();
		renderer.destroy();
	});

	test('handles pending frame after destroy without throwing', () => {
		const ctx = createMockContext();
		const layer = createMockLayer();
		const layerManager = { getActiveLayers: () => [[layer]] };

		let frameCallback = null;
		const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(cb => {
			frameCallback = cb;
			return 1;
		});
		const cafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();
		// Destroy while a frame callback is pending
		renderer.destroy();

		expect(() => frameCallback && frameCallback()).not.toThrow();

		rafSpy.mockRestore();
		cafSpy.mockRestore();
	});
});
