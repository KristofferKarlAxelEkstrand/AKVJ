import { describe, test, expect, vi } from 'vitest';
import LayerManager from '../src/js/visuals/LayerManager.js';

describe('LayerManager', () => {
	test('setClips distributes to layer groups', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const clips = {
			0: {
				60: {
					0: mockClip
				}
			}
		};

		lm.setClips(clips);

		// Layer Group A should have no active clips initially
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});

	test('noteOn/noteOff activates and deactivates clips via LayerGroup', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const clips = {
			0: {
				60: {
					0: mockClip
				}
			}
		};

		lm.setClips(clips);
		lm.noteOn(0, 60, 127);

		// Layer Group A (channel 0) should now have the active clip
		const activeClips = lm.getLayerGroupA().getActiveClips();
		expect(activeClips).toContain(mockClip);

		lm.noteOff(0, 60);
		expect(mockClip.stop).toHaveBeenCalled();
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});
});

describe('LayerManager - velocity selection', () => {
	test('selects correct velocity clip with low/mid/high velocities', () => {
		const lm = new LayerManager();
		const mockClip40 = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };
		const mockClip80 = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const clips = {
			0: {
				60: {
					40: mockClip40,
					80: mockClip80
				}
			}
		};

		lm.setClips(clips);

		// Below lowest - should not activate any clip
		lm.noteOn(0, 60, 30);
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
		lm.noteOff(0, 60);

		// Equal to lowest - should activate mockClip40
		lm.noteOn(0, 60, 40);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockClip40);
		lm.noteOff(0, 60);

		// Mid range (between 40 and 80) -> pick 40
		lm.noteOn(0, 60, 60);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockClip40);
		lm.noteOff(0, 60);

		// Equal to highest
		lm.noteOn(0, 60, 80);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockClip80);
		lm.noteOff(0, 60);

		// Above highest -> pick 80
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockClip80);
	});
});

describe('LayerManager - clearClips', () => {
	test('clearClips clears all layer groups', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn() };

		const clips = {
			0: {
				60: {
					0: mockClip
				}
			}
		};

		lm.setClips(clips);
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockClip);

		lm.clearClips();
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});
});

describe('LayerManager - destroy', () => {
	test('destroy clears clips and can be called multiple times safely', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn() };

		const clips = {
			0: {
				60: {
					0: mockClip
				}
			}
		};

		lm.setClips(clips);
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockClip);

		lm.destroy();
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);

		// Calling destroy again should be a no-op and not throw
		expect(() => lm.destroy()).not.toThrow();
	});
});

describe('LayerManager - reserved channels', () => {
	test('noteOn ignores reserved channels (13, 14, 15)', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		lm.setClips({ 13: { 60: { 0: mockClip } } });

		lm.noteOn(13, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
		expect(lm.getLayerGroupB().getActiveClips()).toEqual([]);
		expect(lm.getLayerGroupC().getActiveClips()).toEqual([]);
	});

	test('noteOff ignores reserved channels', () => {
		const lm = new LayerManager();

		expect(() => lm.noteOff(14, 60)).not.toThrow();
	});
});

describe('LayerManager - multi-channel routing', () => {
	test('noteOn routes to Layer Group B for channels 5-8', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		lm.setClips({ 5: { 60: { 0: mockClip } } });
		lm.noteOn(5, 60, 127);

		expect(lm.getLayerGroupB().getActiveClips()).toContain(mockClip);
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});

	test('noteOn routes to Layer Group C for channels 10-11', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		lm.setClips({ 10: { 60: { 0: mockClip } } });
		lm.noteOn(10, 60, 127);

		expect(lm.getLayerGroupC().getActiveClips()).toContain(mockClip);
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});

	test('noteOn routes to MaskManager for channel 4 (mixer)', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), bitDepth: 1 };

		lm.setClips({ 4: { 60: { 0: mockClip } } });
		lm.noteOn(4, 60, 127);

		expect(lm.getMaskManager().getCurrentMask()).toBe(mockClip);
	});

	test('noteOn routes to EffectsManager for channel 9 (mixed output effects)', () => {
		const lm = new LayerManager();

		lm.noteOn(9, 0, 127);

		expect(lm.getEffectsManager().hasMixedOutputEffects()).toBe(true);
	});

	test('noteOn routes to EffectsManager for channel 12 (global effects)', () => {
		const lm = new LayerManager();

		lm.noteOn(12, 0, 127);

		expect(lm.getEffectsManager().hasGlobalEffects()).toBe(true);
	});

	test('noteOff routes to Layer Group B for channels 5-8', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		lm.setClips({ 5: { 60: { 0: mockClip } } });
		lm.noteOn(5, 60, 127);
		expect(lm.getLayerGroupB().getActiveClips()).toContain(mockClip);

		lm.noteOff(5, 60);
		expect(mockClip.stop).toHaveBeenCalled();
		expect(lm.getLayerGroupB().getActiveClips()).toEqual([]);
	});

	test('noteOff routes to EffectsManager for channel 9', () => {
		const lm = new LayerManager();

		lm.noteOn(9, 0, 127);
		expect(lm.getEffectsManager().hasMixedOutputEffects()).toBe(true);

		lm.noteOff(9, 0);
		expect(lm.getEffectsManager().hasMixedOutputEffects()).toBe(false);
	});
});

describe('LayerManager - getters', () => {
	test('getLayerGroupA returns a LayerGroup instance', () => {
		const lm = new LayerManager();
		expect(lm.getLayerGroupA()).toBeDefined();
		expect(typeof lm.getLayerGroupA().noteOn).toBe('function');
	});

	test('getLayerGroupB returns a LayerGroup instance', () => {
		const lm = new LayerManager();
		expect(lm.getLayerGroupB()).toBeDefined();
		expect(typeof lm.getLayerGroupB().noteOn).toBe('function');
	});

	test('getLayerGroupC returns a LayerGroup instance', () => {
		const lm = new LayerManager();
		expect(lm.getLayerGroupC()).toBeDefined();
		expect(typeof lm.getLayerGroupC().noteOn).toBe('function');
	});

	test('getMaskManager returns a MaskManager instance', () => {
		const lm = new LayerManager();
		expect(lm.getMaskManager()).toBeDefined();
		expect(typeof lm.getMaskManager().noteOn).toBe('function');
	});

	test('getEffectsManager returns an EffectsManager instance', () => {
		const lm = new LayerManager();
		expect(lm.getEffectsManager()).toBeDefined();
		expect(typeof lm.getEffectsManager().noteOn).toBe('function');
	});
});

describe('LayerManager - clearClips (expanded)', () => {
	test('clearClips clears Layer Group B', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		lm.setClips({ 5: { 60: { 0: mockClip } } });
		lm.noteOn(5, 60, 127);
		expect(lm.getLayerGroupB().getActiveClips()).toContain(mockClip);

		lm.clearClips();
		expect(lm.getLayerGroupB().getActiveClips()).toEqual([]);
	});

	test('clearClips clears Layer Group C', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		lm.setClips({ 10: { 60: { 0: mockClip } } });
		lm.noteOn(10, 60, 127);
		expect(lm.getLayerGroupC().getActiveClips()).toContain(mockClip);

		lm.clearClips();
		expect(lm.getLayerGroupC().getActiveClips()).toEqual([]);
	});

	test('clearClips clears MaskManager', () => {
		const lm = new LayerManager();
		const mockClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), bitDepth: 1 };

		lm.setClips({ 4: { 60: { 0: mockClip } } });
		lm.noteOn(4, 60, 127);
		expect(lm.getMaskManager().getCurrentMask()).toBe(mockClip);

		lm.clearClips();
		expect(lm.getMaskManager().getCurrentMask()).toBeNull();
	});

	test('clearClips clears EffectsManager', () => {
		const lm = new LayerManager();

		lm.noteOn(9, 0, 127);
		lm.noteOn(12, 0, 127);
		expect(lm.getEffectsManager().hasMixedOutputEffects()).toBe(true);
		expect(lm.getEffectsManager().hasGlobalEffects()).toBe(true);

		lm.clearClips();
		expect(lm.getEffectsManager().hasMixedOutputEffects()).toBe(false);
		expect(lm.getEffectsManager().hasGlobalEffects()).toBe(false);
	});
});
