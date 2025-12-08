/**
 * Integration tests for the AKVJ multi-layer architecture
 * Tests the full pipeline: MIDI → LayerManager → Renderer → Effects
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import LayerManager from '../src/js/visuals/LayerManager.js';
import LayerGroup from '../src/js/visuals/LayerGroup.js';
import MaskManager from '../src/js/visuals/MaskManager.js';
import EffectsManager from '../src/js/visuals/EffectsManager.js';
import settings from '../src/js/core/settings.js';

/**
 * Create a mock animation layer
 */
function createMockLayer(id = 'mock') {
	return {
		id,
		play: vi.fn(),
		playToContext: vi.fn(),
		stop: vi.fn(),
		reset: vi.fn(),
		dispose: vi.fn(),
		isFinished: false
	};
}

describe('LayerGroup', () => {
	test('manages animation slots correctly', () => {
		// LayerGroup expects an array of channels
		const group = new LayerGroup('A', [0, 1, 2, 3]);
		const layer1 = createMockLayer('layer1');
		const layer2 = createMockLayer('layer2');

		// Create animations map keyed by channel, then note, then velocity
		const animations = {
			0: {
				60: { 0: layer1 },
				61: { 0: layer2 }
			}
		};
		group.setAnimations(animations);

		// Trigger note on for channel 0
		group.noteOn(0, 60, 127);
		expect(group.getActiveLayers()).toContain(layer1);

		group.noteOn(0, 61, 127);
		expect(group.getActiveLayers()).toContain(layer1);
		expect(group.getActiveLayers()).toContain(layer2);

		// Note off should deactivate
		group.noteOff(0, 60);
		expect(group.getActiveLayers()).not.toContain(layer1);
		expect(group.getActiveLayers()).toContain(layer2);
	});

	test('velocity layer selection', () => {
		const group = new LayerGroup('A', [0]);
		const lowVel = createMockLayer('low');
		const highVel = createMockLayer('high');

		const animations = {
			0: {
				60: {
					0: lowVel, // velocity 0-63
					64: highVel // velocity 64-127
				}
			}
		};
		group.setAnimations(animations);

		// Low velocity should get lowVel layer
		group.noteOn(0, 60, 32);
		expect(group.getActiveLayers()).toContain(lowVel);

		group.noteOff(0, 60);

		// High velocity should get highVel layer
		group.noteOn(0, 60, 100);
		expect(group.getActiveLayers()).toContain(highVel);
	});
});

describe('MaskManager', () => {
	test('latches to last triggered mask animation', () => {
		const mask = new MaskManager();
		const maskLayer1 = createMockLayer('mask1');
		const maskLayer2 = createMockLayer('mask2');

		// MaskManager expects full animations object keyed by channel
		// The mixer channel is 4 (from settings.channelMapping.mixer)
		const mixerChannel = settings.channelMapping.mixer;
		const animations = {
			[mixerChannel]: {
				60: { 0: maskLayer1 },
				61: { 0: maskLayer2 }
			}
		};
		mask.setAnimations(animations);

		// Trigger first mask
		mask.noteOn(mixerChannel, 60, 127);
		expect(mask.getCurrentMask()).toBe(maskLayer1);

		// Trigger second mask - should replace first
		mask.noteOn(mixerChannel, 61, 127);
		expect(mask.getCurrentMask()).toBe(maskLayer2);

		// Note off is ignored - mask stays latched
		mask.noteOff(mixerChannel, 61);
		expect(mask.getCurrentMask()).toBe(maskLayer2);
	});

	test('returns null for bit depth when no mask is active', () => {
		const mask = new MaskManager();
		// Bit depth is null when no mask is active
		expect(mask.getBitDepth()).toBe(null);
	});
});

describe('EffectsManager', () => {
	test('handles effect channels correctly', () => {
		const effects = new EffectsManager();

		// Should handle effects AB channel (9)
		expect(effects.handlesChannel(settings.channelMapping.effectsAB)).toBe(true);
		// Should handle effects global channel (12)
		expect(effects.handlesChannel(settings.channelMapping.effectsGlobal)).toBe(true);
		// Should not handle other channels
		expect(effects.handlesChannel(0)).toBe(false);
	});

	test('activates effects based on note ranges', () => {
		const effects = new EffectsManager();

		// Color effect (notes 48-63)
		effects.noteOn(settings.channelMapping.effectsAB, 50, 127);
		expect(effects.hasEffectsAB()).toBe(true);
		expect(effects.getEffectAB('color')).toBeDefined();
		expect(effects.getEffectAB('color').velocity).toBe(127);

		// Note off should deactivate
		effects.noteOff(settings.channelMapping.effectsAB, 50);
		expect(effects.hasEffectsAB()).toBe(false);
	});

	test('effects are NOT latched - note off disables immediately', () => {
		const effects = new EffectsManager();

		// Activate glitch effect (notes 64-79)
		effects.noteOn(settings.channelMapping.effectsGlobal, 70, 100);
		expect(effects.hasEffectsGlobal()).toBe(true);

		// Note off immediately disables
		effects.noteOff(settings.channelMapping.effectsGlobal, 70);
		expect(effects.hasEffectsGlobal()).toBe(false);
	});

	test('multiple effect types can be active simultaneously', () => {
		const effects = new EffectsManager();
		const channel = settings.channelMapping.effectsAB;

		// Activate color effect (48-63)
		effects.noteOn(channel, 50, 100);
		// Activate offset effect (32-47)
		effects.noteOn(channel, 40, 80);

		expect(effects.getActiveEffectsAB().length).toBe(2);
		expect(effects.getEffectAB('color')).toBeDefined();
		expect(effects.getEffectAB('offset')).toBeDefined();
	});

	test('within same type, only last note wins', () => {
		const effects = new EffectsManager();
		const channel = settings.channelMapping.effectsAB;

		// Activate color effect with note 50
		effects.noteOn(channel, 50, 100);
		expect(effects.getEffectAB('color').note).toBe(50);

		// Activate color effect with note 55 - should replace
		effects.noteOn(channel, 55, 80);
		expect(effects.getEffectAB('color').note).toBe(55);
		expect(effects.getEffectAB('color').velocity).toBe(80);
	});
});

describe('LayerManager - Multi-Layer Architecture', () => {
	let lm;

	beforeEach(() => {
		lm = new LayerManager();
	});

	test('getLayerA/B/C returns LayerGroup instances', () => {
		expect(lm.getLayerA()).toBeInstanceOf(LayerGroup);
		expect(lm.getLayerB()).toBeInstanceOf(LayerGroup);
		expect(lm.getLayerC()).toBeInstanceOf(LayerGroup);
	});

	test('getMaskManager returns MaskManager instance', () => {
		expect(lm.getMaskManager()).toBeInstanceOf(MaskManager);
	});

	test('getEffectsManager returns EffectsManager instance', () => {
		expect(lm.getEffectsManager()).toBeInstanceOf(EffectsManager);
	});

	test('routes MIDI to correct layer based on channel', () => {
		const layerA = createMockLayer('layerA');
		const layerB = createMockLayer('layerB');
		const layerC = createMockLayer('layerC');

		const animations = {
			0: { 60: { 0: layerA } }, // Channel 0 -> Layer A
			5: { 60: { 0: layerB } }, // Channel 5 -> Layer B
			10: { 60: { 0: layerC } } // Channel 10 -> Layer C
		};
		lm.setAnimations(animations);

		// Trigger on Layer A channel
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerA().getActiveLayers()).toContain(layerA);

		// Trigger on Layer B channel
		lm.noteOn(5, 60, 127);
		expect(lm.getLayerB().getActiveLayers()).toContain(layerB);

		// Trigger on Layer C channel
		lm.noteOn(10, 60, 127);
		expect(lm.getLayerC().getActiveLayers()).toContain(layerC);
	});

	test('routes channel 4 to MaskManager', () => {
		const maskLayer = createMockLayer('mask');
		const animations = {
			4: { 60: { 0: maskLayer } } // Channel 4 -> Mixer/Mask
		};
		lm.setAnimations(animations);

		lm.noteOn(4, 60, 127);
		expect(lm.getMaskManager().getCurrentMask()).toBe(maskLayer);
	});

	test('routes effect channels to EffectsManager', () => {
		const animations = {};
		lm.setAnimations(animations);

		// Effect on channel 9 (effectsAB)
		lm.noteOn(9, 50, 100); // Color effect
		expect(lm.getEffectsManager().hasEffectsAB()).toBe(true);

		// Effect on channel 12 (effectsGlobal)
		lm.noteOn(12, 70, 80);
		expect(lm.getEffectsManager().hasEffectsGlobal()).toBe(true);
	});
});

describe('Channel Mapping from Settings', () => {
	test('channel mapping matches expected configuration', () => {
		// Verify the channel mapping from settings
		expect(settings.channelMapping.layerA).toEqual([0, 1, 2, 3]);
		expect(settings.channelMapping.mixer).toBe(4);
		expect(settings.channelMapping.layerB).toEqual([5, 6, 7, 8]);
		expect(settings.channelMapping.effectsAB).toBe(9);
		expect(settings.channelMapping.layerC).toEqual([10, 11]);
		expect(settings.channelMapping.effectsGlobal).toBe(12);
	});

	test('effect ranges cover expected note ranges', () => {
		// Match actual settings values
		expect(settings.effectRanges.split).toEqual({ min: 0, max: 15 });
		expect(settings.effectRanges.mirror).toEqual({ min: 16, max: 31 });
		expect(settings.effectRanges.offset).toEqual({ min: 32, max: 47 });
		expect(settings.effectRanges.color).toEqual({ min: 48, max: 63 });
		expect(settings.effectRanges.glitch).toEqual({ min: 64, max: 79 });
		expect(settings.effectRanges.strobe).toEqual({ min: 80, max: 95 });
		expect(settings.effectRanges.reserved).toEqual({ min: 96, max: 127 });
	});
});

describe('BPM Configuration', () => {
	test('BPM settings have correct defaults', () => {
		expect(settings.bpm.default).toBe(120);
		expect(settings.bpm.min).toBe(10);
		expect(settings.bpm.max).toBe(522);
		expect(settings.bpm.controlCC).toBe(0);
	});
});
