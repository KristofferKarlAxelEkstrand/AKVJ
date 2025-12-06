import LayerManager from '../src/js/LayerManager.js';

describe('LayerManager', () => {
	test('setAnimations and noteOn/noteOff behavior', () => {
		const lm = new LayerManager();
		const fakeLayer = { play: vi.fn(), stop: vi.fn() };

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
