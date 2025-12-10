import { describe, test, expect, vi } from 'vitest';
import LayerManager from '../src/js/visuals/LayerManager.js';

describe('LayerManager', () => {
	test('setAnimations distributes to layer groups', () => {
		const lm = new LayerManager();
		const fakeLayer = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const animations = {
			0: {
				60: {
					0: fakeLayer
				}
			}
		};

		lm.setAnimations(animations);

		// Layer A should have no active layers initially
		expect(lm.getLayerA().getActiveLayers()).toEqual([]);
	});

	test('noteOn/noteOff activates and deactivates layers via LayerGroup', () => {
		const lm = new LayerManager();
		const fakeLayer = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const animations = {
			0: {
				60: {
					0: fakeLayer
				}
			}
		};

		lm.setAnimations(animations);
		lm.noteOn(0, 60, 127);

		// Layer A (channel 0) should now have the active layer
		const activeLayers = lm.getLayerA().getActiveLayers();
		expect(activeLayers).toContain(fakeLayer);

		lm.noteOff(0, 60);
		expect(fakeLayer.stop).toHaveBeenCalled();
		expect(lm.getLayerA().getActiveLayers()).toEqual([]);
	});
});

describe('LayerManager - velocity selection', () => {
	test('selects correct velocity layer with low/mid/high velocities', () => {
		const lm = new LayerManager();
		const fakeLayer40 = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };
		const fakeLayer80 = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const animations = {
			0: {
				60: {
					40: fakeLayer40,
					80: fakeLayer80
				}
			}
		};

		lm.setAnimations(animations);

		// Below lowest - should not activate any layer
		lm.noteOn(0, 60, 30);
		expect(lm.getLayerA().getActiveLayers()).toEqual([]);
		lm.noteOff(0, 60);

		// Equal to lowest - should activate fakeLayer40
		lm.noteOn(0, 60, 40);
		expect(lm.getLayerA().getActiveLayers()).toContain(fakeLayer40);
		lm.noteOff(0, 60);

		// Mid range (between 40 and 80) -> pick 40
		lm.noteOn(0, 60, 60);
		expect(lm.getLayerA().getActiveLayers()).toContain(fakeLayer40);
		lm.noteOff(0, 60);

		// Equal to highest
		lm.noteOn(0, 60, 80);
		expect(lm.getLayerA().getActiveLayers()).toContain(fakeLayer80);
		lm.noteOff(0, 60);

		// Above highest -> pick 80
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerA().getActiveLayers()).toContain(fakeLayer80);
	});
});

describe('LayerManager - clearLayers', () => {
	test('clearLayers clears all layer groups', () => {
		const lm = new LayerManager();
		const fakeLayer = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn() };

		const animations = {
			0: {
				60: {
					0: fakeLayer
				}
			}
		};

		lm.setAnimations(animations);
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerA().getActiveLayers()).toContain(fakeLayer);

		lm.clearLayers();
		expect(lm.getLayerA().getActiveLayers()).toEqual([]);
	});
});

describe('LayerManager - destroy', () => {
	test('destroy clears layers and can be called multiple times safely', () => {
		const lm = new LayerManager();
		const fakeLayer = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn() };

		const animations = {
			0: {
				60: {
					0: fakeLayer
				}
			}
		};

		lm.setAnimations(animations);
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerA().getActiveLayers()).toContain(fakeLayer);

		lm.destroy();
		expect(lm.getLayerA().getActiveLayers()).toEqual([]);

		// Calling destroy again should be a no-op and not throw
		expect(() => lm.destroy()).not.toThrow();
	});
});
