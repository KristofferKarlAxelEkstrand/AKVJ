import { describe, test, expect, vi } from 'vitest';
import LayerManager from '../src/js/visuals/LayerManager.js';

describe('LayerManager', () => {
	test('setAnimations distributes to layer groups', () => {
		const lm = new LayerManager();
		const mockAnimationClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const animations = {
			0: {
				60: {
					0: mockAnimationClip
				}
			}
		};

		lm.setAnimations(animations);

		// Layer Group A should have no active clips initially
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});

	test('noteOn/noteOff activates and deactivates clips via LayerGroup', () => {
		const lm = new LayerManager();
		const mockAnimationClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const animations = {
			0: {
				60: {
					0: mockAnimationClip
				}
			}
		};

		lm.setAnimations(animations);
		lm.noteOn(0, 60, 127);

		// Layer Group A (channel 0) should now have the active clip
		const activeClips = lm.getLayerGroupA().getActiveClips();
		expect(activeClips).toContain(mockAnimationClip);

		lm.noteOff(0, 60);
		expect(mockAnimationClip.stop).toHaveBeenCalled();
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});
});

describe('LayerManager - velocity selection', () => {
	test('selects correct velocity clip with low/mid/high velocities', () => {
		const lm = new LayerManager();
		const mockAnimationClip40 = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };
		const mockAnimationClip80 = { play: vi.fn(), stop: vi.fn(), reset: vi.fn() };

		const animations = {
			0: {
				60: {
					40: mockAnimationClip40,
					80: mockAnimationClip80
				}
			}
		};

		lm.setAnimations(animations);

		// Below lowest - should not activate any clip
		lm.noteOn(0, 60, 30);
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
		lm.noteOff(0, 60);

		// Equal to lowest - should activate mockAnimationClip40
		lm.noteOn(0, 60, 40);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockAnimationClip40);
		lm.noteOff(0, 60);

		// Mid range (between 40 and 80) -> pick 40
		lm.noteOn(0, 60, 60);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockAnimationClip40);
		lm.noteOff(0, 60);

		// Equal to highest
		lm.noteOn(0, 60, 80);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockAnimationClip80);
		lm.noteOff(0, 60);

		// Above highest -> pick 80
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockAnimationClip80);
	});
});

describe('LayerManager - clearClips', () => {
	test('clearClips clears all layer groups', () => {
		const lm = new LayerManager();
		const mockAnimationClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn() };

		const animations = {
			0: {
				60: {
					0: mockAnimationClip
				}
			}
		};

		lm.setAnimations(animations);
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockAnimationClip);

		lm.clearClips();
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);
	});
});

describe('LayerManager - destroy', () => {
	test('destroy clears clips and can be called multiple times safely', () => {
		const lm = new LayerManager();
		const mockAnimationClip = { play: vi.fn(), stop: vi.fn(), reset: vi.fn(), dispose: vi.fn() };

		const animations = {
			0: {
				60: {
					0: mockAnimationClip
				}
			}
		};

		lm.setAnimations(animations);
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(mockAnimationClip);

		lm.destroy();
		expect(lm.getLayerGroupA().getActiveClips()).toEqual([]);

		// Calling destroy again should be a no-op and not throw
		expect(() => lm.destroy()).not.toThrow();
	});
});
