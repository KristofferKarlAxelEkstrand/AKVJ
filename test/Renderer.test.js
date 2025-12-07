import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Renderer from '../src/js/visuals/Renderer.js';

function createMockContext() {
	return {
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		fillStyle: '#000000'
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

	test('passes RAF timestamp to animation play method', () => {
		const ctx = createMockContext();
		let receivedTimestamp = null;
		const layer = {
			play: t => {
				receivedTimestamp = t;
			}
		};
		const layerManager = { getActiveLayers: () => [[layer]] };

		// Set up RAF to immediately invoke the callback with a timestamp
		let called = false;
		rafSpy.mockImplementation(cb => {
			if (!called) {
				called = true;
				cb(12345);
			}
			return 1;
		});

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();
		expect(receivedTimestamp).toBe(12345);
		renderer.destroy();
	});

	test('clears finished non-looping layers from active layer array', () => {
		const ctx = createMockContext();
		const finishedLayer = { play: vi.fn(), isFinished: true };
		const layers = [[finishedLayer]];
		const layerManager = { getActiveLayers: () => layers };

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();

		// finished layer should not have its play() invoked and should be cleared from layer list
		expect(finishedLayer.play).not.toHaveBeenCalled();
		expect(layers[0][0]).toBeNull();
	});

	test('continues rendering loop when no active layers present', () => {
		const ctx = createMockContext();
		const layerManager = { getActiveLayers: () => [] };

		rafSpy.mockClear();
		const renderer = new Renderer(ctx, layerManager);
		renderer.start();

		expect(ctx.fillRect).toHaveBeenCalled();
		// Loop continues even when there are no active layers; ensure RAF was scheduled
		expect(rafSpy).toHaveBeenCalled();
		renderer.destroy();
	});

	test('handles pending frame after destroy without throwing', () => {
		const ctx = createMockContext();
		const layer = createMockLayer();
		const layerManager = { getActiveLayers: () => [[layer]] };

		let frameCallback = null;
		rafSpy.mockImplementation(cb => {
			frameCallback = cb;
			return 1;
		});

		const renderer = new Renderer(ctx, layerManager);
		renderer.start();
		// Destroy while a frame callback is pending
		renderer.destroy();

		expect(frameCallback).toBeDefined();
		// Clear spy and invoke to verify no new RAF scheduled after destroy
		rafSpy.mockClear();
		expect(() => frameCallback()).not.toThrow();
		// No new frame should be scheduled after destroy
		expect(rafSpy).not.toHaveBeenCalled();
	});

	test('destroy is idempotent and safe to call multiple times', () => {
		const ctx = createMockContext();
		const layerManager = { getActiveLayers: () => [] };
		const renderer = new Renderer(ctx, layerManager);

		renderer.destroy();
		expect(() => renderer.destroy()).not.toThrow();
	});

	test('destroy before start does not throw', () => {
		const ctx = createMockContext();
		const layerManager = { getActiveLayers: () => [] };
		const renderer = new Renderer(ctx, layerManager);

		expect(() => renderer.destroy()).not.toThrow();
	});
});
