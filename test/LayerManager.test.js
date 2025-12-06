import LayerManager from '../src/js/visuals/LayerManager.js';

describe('LayerManager', () => {
	test('setAnimations and noteOn/noteOff behavior', () => {
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
		expect(lm.getActiveLayers()).toEqual([]);

		lm.noteOn(0, 60, 127);
		const active = lm.getActiveLayers();
		expect(active[0][60]).toBe(fakeLayer);

		lm.noteOff(0, 60);
		expect(active[0][60]).toBeNull();
		expect(fakeLayer.stop).toHaveBeenCalled();
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
		// Below lowest - should be ignored (no layer activated)
		lm.noteOn(0, 60, 30);
		let active = lm.getActiveLayers();
		expect(active[0]).toBeUndefined();
		// Reset
		lm.noteOff(0, 60);
		// Equal to lowest
		lm.noteOn(0, 60, 40);
		active = lm.getActiveLayers();
		expect(active[0][60]).toBe(fakeLayer40);
		lm.noteOff(0, 60);
		// Mid range (between 40 and 80) -> pick 40
		lm.noteOn(0, 60, 60);
		active = lm.getActiveLayers();
		expect(active[0][60]).toBe(fakeLayer40);
		lm.noteOff(0, 60);
		// Equal to highest
		lm.noteOn(0, 60, 80);
		active = lm.getActiveLayers();
		expect(active[0][60]).toBe(fakeLayer80);
		lm.noteOff(0, 60);
		// Above highest -> pick 80
		lm.noteOn(0, 60, 127);
		active = lm.getActiveLayers();
		expect(active[0][60]).toBe(fakeLayer80);
	});
});

describe('LayerManager - clearLayers', () => {
	test('clearLayers stops and disposes active layers', () => {
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
		const active = lm.getActiveLayers();
		expect(active[0][60]).toBe(fakeLayer);

		lm.clearLayers();
		expect(fakeLayer.stop).toHaveBeenCalled();
		expect(fakeLayer.dispose).toHaveBeenCalled();
		expect(lm.getActiveLayers().length).toBe(0);
	});
});
