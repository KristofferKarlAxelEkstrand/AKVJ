/**
 * Integration tests for the AKVJ multi-layer-group architecture
 * Tests the full pipeline: MIDI → LayerManager → Renderer → Effects
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import LayerManager from '../src/js/visuals/LayerManager.js';
import LayerGroup from '../src/js/visuals/LayerGroup.js';
import MaskManager from '../src/js/visuals/MaskManager.js';
import EffectsManager from '../src/js/visuals/EffectsManager.js';
import settings from '../src/js/core/settings.js';

/**
 * Create a mock animation clip with spied methods
 * @param {string} id - Unique identifier for the animation clip
 * @returns {Object} Mock animation clip with vi.fn() spies for all methods
 */
function createMockAnimationClip(id = 'mock') {
	return {
		id,
		play: vi.fn(),
		renderToContext: vi.fn(),
		stop: vi.fn(),
		reset: vi.fn(),
		dispose: vi.fn(),
		isFinished: false
	};
}

describe('LayerGroup', () => {
	test('manages clip slots correctly', () => {
		// LayerGroup expects an array of channels
		const group = new LayerGroup([0, 1, 2, 3]);
		const animationClip1 = createMockAnimationClip('animationClip1');
		const animationClip2 = createMockAnimationClip('animationClip2');

		// Create animations map keyed by channel, then note, then velocity
		const animations = {
			0: {
				60: { 0: animationClip1 },
				61: { 0: animationClip2 }
			}
		};
		group.setAnimations(animations);

		// Trigger note on for channel 0
		group.noteOn(0, 60, 127);
		expect(group.getActiveClips()).toContain(animationClip1);

		group.noteOn(0, 61, 127);
		expect(group.getActiveClips()).toContain(animationClip1);
		expect(group.getActiveClips()).toContain(animationClip2);

		// Note off should deactivate
		group.noteOff(0, 60);
		expect(group.getActiveClips()).not.toContain(animationClip1);
		expect(group.getActiveClips()).toContain(animationClip2);
	});

	test('velocity clip selection', () => {
		const group = new LayerGroup([0]);
		const lowVelocityAnimationClip = createMockAnimationClip('low');
		const highVelocityAnimationClip = createMockAnimationClip('high');

		const animations = {
			0: {
				60: {
					0: lowVelocityAnimationClip, // velocity 0-63
					64: highVelocityAnimationClip // velocity 64-127
				}
			}
		};
		group.setAnimations(animations);

		// Low velocity should get the lowVelocityAnimationClip
		group.noteOn(0, 60, 32);
		expect(group.getActiveClips()).toContain(lowVelocityAnimationClip);

		group.noteOff(0, 60);

		// High velocity should get the highVelocityAnimationClip
		group.noteOn(0, 60, 100);
		expect(group.getActiveClips()).toContain(highVelocityAnimationClip);
	});

	test('active clips have renderToContext method for off-screen rendering', () => {
		const group = new LayerGroup([0]);
		const animationClip = createMockAnimationClip('animationClip');

		const animations = { 0: { 60: { 0: animationClip } } };
		group.setAnimations(animations);

		group.noteOn(0, 60, 127);
		const activeClips = group.getActiveClips();

		// Verify renderToContext is available on active clips (used by Renderer for off-screen compositing)
		expect(activeClips.length).toBe(1);
		expect(activeClips[0].renderToContext).toBeDefined();
		expect(typeof activeClips[0].renderToContext).toBe('function');
	});
});

describe('MaskManager', () => {
	test('latches to last triggered mask animation', () => {
		const mask = new MaskManager();
		const maskAnimationClip1 = createMockAnimationClip('mask1');
		const maskAnimationClip2 = createMockAnimationClip('mask2');

		// MaskManager expects full animations object keyed by channel
		// The mixer channel is 4 (from settings.channelMapping.mixer)
		const mixerChannel = settings.channelMapping.mixer;
		const animations = {
			[mixerChannel]: {
				60: { 0: maskAnimationClip1 },
				61: { 0: maskAnimationClip2 }
			}
		};
		mask.setAnimations(animations);

		// Trigger first mask
		mask.noteOn(mixerChannel, 60, 127);
		expect(mask.getCurrentMask()).toBe(maskAnimationClip1);

		// Trigger second mask - should replace first
		mask.noteOn(mixerChannel, 61, 127);
		expect(mask.getCurrentMask()).toBe(maskAnimationClip2);

		// Note off is ignored - mask stays latched
		mask.noteOff(mixerChannel, 61);
		expect(mask.getCurrentMask()).toBe(maskAnimationClip2);
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

		// Should handle mixed output effects channel (9)
		expect(effects.handlesChannel(settings.channelMapping.mixedOutputEffects)).toBe(true);
		// Should handle effects global channel (12)
		expect(effects.handlesChannel(settings.channelMapping.globalEffects)).toBe(true);
		// Should not handle other channels
		expect(effects.handlesChannel(0)).toBe(false);
	});

	test('activates effects based on note ranges', () => {
		const effects = new EffectsManager();

		// Color effect (notes 48-63)
		effects.noteOn(settings.channelMapping.mixedOutputEffects, 50, 127);
		expect(effects.hasMixedOutputEffects()).toBe(true);
		const colorEffect = effects.getActiveMixedOutputEffects().find(e => e.type === 'color');
		expect(colorEffect).toBeDefined();
		expect(colorEffect.velocity).toBe(127);

		// Note off should deactivate
		effects.noteOff(settings.channelMapping.mixedOutputEffects, 50);
		expect(effects.hasMixedOutputEffects()).toBe(false);
	});

	test('effects are NOT latched - note off disables immediately', () => {
		const effects = new EffectsManager();

		// Activate glitch effect (notes 64-79)
		effects.noteOn(settings.channelMapping.globalEffects, 70, 100);
		expect(effects.hasGlobalEffects()).toBe(true);

		// Note off immediately disables
		effects.noteOff(settings.channelMapping.globalEffects, 70);
		expect(effects.hasGlobalEffects()).toBe(false);
	});

	test('multiple effect types can be active simultaneously', () => {
		const effects = new EffectsManager();
		const channel = settings.channelMapping.mixedOutputEffects;

		// Activate color effect (48-63)
		effects.noteOn(channel, 50, 100);
		// Activate offset effect (32-47)
		effects.noteOn(channel, 40, 80);

		expect(effects.getActiveMixedOutputEffects().length).toBe(2);
		expect(effects.getActiveMixedOutputEffects().find(e => e.type === 'color')).toBeDefined();
		expect(effects.getActiveMixedOutputEffects().find(e => e.type === 'offset')).toBeDefined();
	});

	test('within same type, only last note wins', () => {
		const effects = new EffectsManager();
		const channel = settings.channelMapping.mixedOutputEffects;

		// Activate color effect with note 50
		effects.noteOn(channel, 50, 100);
		expect(effects.getActiveMixedOutputEffects().find(e => e.type === 'color').note).toBe(50);

		// Activate color effect with note 55 - should replace
		effects.noteOn(channel, 55, 80);
		const colorEffect = effects.getActiveMixedOutputEffects().find(e => e.type === 'color');
		expect(colorEffect.note).toBe(55);
		expect(colorEffect.velocity).toBe(80);
	});

	test('ignores out-of-range and invalid notes', () => {
		const effects = new EffectsManager();
		const channel = settings.channelMapping.mixedOutputEffects;

		// Out of MIDI range
		expect(effects.noteOn(channel, 200, 100)).toBe(false);
		// Negative / non-numeric values
		expect(effects.noteOn(channel, -1, 100)).toBe(false);
		expect(effects.noteOn(channel, NaN, 100)).toBe(false);
		expect(effects.hasMixedOutputEffects()).toBe(false);
	});

	test('ignores reserved notes', () => {
		const effects = new EffectsManager();
		const channel = settings.channelMapping.mixedOutputEffects;

		// Reserved note range 96-127
		effects.noteOn(channel, 100, 100);
		expect(effects.hasMixedOutputEffects()).toBe(false);
		expect(effects.noteOff(channel, 100)).toBe(false);
	});
});

describe('LayerManager - Multi-Layer-Group Architecture', () => {
	let lm;

	beforeEach(() => {
		lm = new LayerManager();
	});

	test('getLayerGroupA, getLayerGroupB, and getLayerGroupC return LayerGroup instances', () => {
		expect(lm.getLayerGroupA()).toBeInstanceOf(LayerGroup);
		expect(lm.getLayerGroupB()).toBeInstanceOf(LayerGroup);
		expect(lm.getLayerGroupC()).toBeInstanceOf(LayerGroup);
	});

	test('getMaskManager returns MaskManager instance', () => {
		expect(lm.getMaskManager()).toBeInstanceOf(MaskManager);
	});

	test('getEffectsManager returns EffectsManager instance', () => {
		expect(lm.getEffectsManager()).toBeInstanceOf(EffectsManager);
	});

	test('routes MIDI to correct layer group based on channel', () => {
		const animationClipA = createMockAnimationClip('animationClipA');
		const animationClipB = createMockAnimationClip('animationClipB');
		const animationClipC = createMockAnimationClip('animationClipC');

		const animations = {
			0: { 60: { 0: animationClipA } }, // Channel 0 -> Layer Group A
			5: { 60: { 0: animationClipB } }, // Channel 5 -> Layer Group B
			10: { 60: { 0: animationClipC } } // Channel 10 -> Layer Group C
		};
		lm.setAnimations(animations);

		// Trigger on Layer Group A channel
		lm.noteOn(0, 60, 127);
		expect(lm.getLayerGroupA().getActiveClips()).toContain(animationClipA);

		// Trigger on Layer Group B channel
		lm.noteOn(5, 60, 127);
		expect(lm.getLayerGroupB().getActiveClips()).toContain(animationClipB);

		// Trigger on Layer Group C channel
		lm.noteOn(10, 60, 127);
		expect(lm.getLayerGroupC().getActiveClips()).toContain(animationClipC);
	});

	test('routes channel 4 to MaskManager', () => {
		const maskAnimationClip = createMockAnimationClip('mask');
		const animations = {
			4: { 60: { 0: maskAnimationClip } } // Channel 4 -> Mixer/Mask
		};
		lm.setAnimations(animations);

		lm.noteOn(4, 60, 127);
		expect(lm.getMaskManager().getCurrentMask()).toBe(maskAnimationClip);
	});

	test('routes effect channels to EffectsManager', () => {
		const animations = {};
		lm.setAnimations(animations);

		// Effect on channel 9 (mixedOutputEffects)
		lm.noteOn(9, 50, 100); // Color effect
		expect(lm.getEffectsManager().hasMixedOutputEffects()).toBe(true);

		// Effect on channel 12 (globalEffects)
		lm.noteOn(12, 70, 80);
		expect(lm.getEffectsManager().hasGlobalEffects()).toBe(true);
	});
});

describe('Channel Mapping from Settings', () => {
	test('channel mapping matches expected configuration', () => {
		// Verify the channel mapping from settings
		expect(settings.channelMapping.layerGroupA).toEqual([0, 1, 2, 3]);
		expect(settings.channelMapping.mixer).toBe(4);
		expect(settings.channelMapping.layerGroupB).toEqual([5, 6, 7, 8]);
		expect(settings.channelMapping.mixedOutputEffects).toBe(9);
		expect(settings.channelMapping.layerGroupC).toEqual([10, 11]);
		expect(settings.channelMapping.globalEffects).toBe(12);
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
