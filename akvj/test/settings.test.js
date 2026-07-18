/**
 * Unit tests for settings.js — validates the centralized configuration object.
 * Ensures structural integrity, value constraints, and channel mapping correctness.
 */
import { describe, test, expect } from 'vitest';
import settings from '../src/js/core/settings.js';

describe('settings', () => {
	describe('canvas', () => {
		test('has fixed 240x135 pixel dimensions', () => {
			expect(settings.canvas.width).toBe(240);
			expect(settings.canvas.height).toBe(135);
		});
	});

	describe('midi', () => {
		test('defines correct MIDI command codes', () => {
			expect(settings.midi.commands.noteOff).toBe(8);
			expect(settings.midi.commands.noteOn).toBe(9);
			expect(settings.midi.commands.controlChange).toBe(11);
		});

		test('defines system real-time messages', () => {
			expect(settings.midi.systemRealTime.clock).toBe(0xf8);
			expect(settings.midi.systemRealTime.start).toBe(0xfa);
			expect(settings.midi.systemRealTime.continue).toBe(0xfb);
			expect(settings.midi.systemRealTime.stop).toBe(0xfc);
		});

		test('uses standard 24 PPQN', () => {
			expect(settings.midi.ppqn).toBe(24);
		});

		test('requires at least 3 bytes for channel messages', () => {
			expect(settings.midi.channelMessageMinLength).toBeGreaterThanOrEqual(3);
		});
	});

	describe('bpm', () => {
		test('has a sensible default BPM', () => {
			expect(settings.bpm.default).toBeGreaterThanOrEqual(60);
			expect(settings.bpm.default).toBeLessThanOrEqual(300);
		});

		test('min BPM is positive to prevent division by zero', () => {
			expect(settings.bpm.min).toBeGreaterThan(0);
		});

		test('max BPM is greater than min BPM', () => {
			expect(settings.bpm.max).toBeGreaterThan(settings.bpm.min);
		});

		test('has a clock timeout in milliseconds', () => {
			expect(settings.bpm.clockTimeoutMs).toBeGreaterThan(0);
		});
	});

	describe('channelMapping', () => {
		test('layer group A covers channels 0-3', () => {
			expect(settings.channelMapping.layerGroupA).toEqual([0, 1, 2, 3]);
		});

		test('mixer is on channel 4', () => {
			expect(settings.channelMapping.mixer).toBe(4);
		});

		test('layer group B covers channels 5-8', () => {
			expect(settings.channelMapping.layerGroupB).toEqual([5, 6, 7, 8]);
		});

		test('mixed output effects on channel 9', () => {
			expect(settings.channelMapping.mixedOutputEffects).toBe(9);
		});

		test('layer group C covers channels 10-11', () => {
			expect(settings.channelMapping.layerGroupC).toEqual([10, 11]);
		});

		test('global effects on channel 12', () => {
			expect(settings.channelMapping.globalEffects).toBe(12);
		});

		test('project selection on channel 13', () => {
			expect(settings.channelMapping.projectSelection).toBe(13);
		});

		test('reserved channels are 14-15', () => {
			expect(settings.channelMapping.reserved).toEqual([14, 15]);
		});

		test('all channels 0-15 are accounted for with no overlaps', () => {
			const allMapped = [...settings.channelMapping.layerGroupA, settings.channelMapping.mixer, ...settings.channelMapping.layerGroupB, settings.channelMapping.mixedOutputEffects, ...settings.channelMapping.layerGroupC, settings.channelMapping.globalEffects, settings.channelMapping.projectSelection, ...settings.channelMapping.reserved];
			expect(allMapped).toHaveLength(16);
			expect(new Set(allMapped).size).toBe(16);
			for (let ch = 0; ch < 16; ch++) {
				expect(allMapped).toContain(ch);
			}
		});
	});

	describe('scrub', () => {
		test('defines unique CC numbers for each layer group and mixer', () => {
			const ccValues = [settings.scrub.layerGroupA_CC, settings.scrub.layerGroupB_CC, settings.scrub.layerGroupC_CC, settings.scrub.mixer_CC];
			expect(new Set(ccValues).size).toBe(ccValues.length);
		});

		test('all scrub CCs are in valid MIDI CC range (0-127)', () => {
			for (const cc of Object.values(settings.scrub)) {
				expect(cc).toBeGreaterThanOrEqual(0);
				expect(cc).toBeLessThanOrEqual(127);
			}
		});
	});

	describe('effectRanges', () => {
		test('each range has min <= max', () => {
			for (const range of Object.values(settings.effectRanges)) {
				expect(range.min).toBeLessThanOrEqual(range.max);
			}
		});

		test('all ranges fit within 0-127', () => {
			for (const range of Object.values(settings.effectRanges)) {
				expect(range.min).toBeGreaterThanOrEqual(0);
				expect(range.max).toBeLessThanOrEqual(127);
			}
		});

		test('ranges are contiguous and non-overlapping', () => {
			const ranges = Object.values(settings.effectRanges).sort((a, b) => a.min - b.min);
			for (let i = 1; i < ranges.length; i++) {
				expect(ranges[i].min).toBe(ranges[i - 1].max + 1);
			}
			expect(ranges[0].min).toBe(0);
			expect(ranges.at(-1).max).toBe(127);
		});
	});

	describe('effectParams', () => {
		test('effectVariantThreshold is within the 16-note range', () => {
			expect(settings.effectParams.effectVariantThreshold).toBeGreaterThanOrEqual(0);
			expect(settings.effectParams.effectVariantThreshold).toBeLessThanOrEqual(15);
		});

		test('glitchMaxDisplacement is positive', () => {
			expect(settings.effectParams.glitchMaxDisplacement).toBeGreaterThan(0);
		});

		test('glitchPixelProbability is between 0 and 1', () => {
			expect(settings.effectParams.glitchPixelProbability).toBeGreaterThan(0);
			expect(settings.effectParams.glitchPixelProbability).toBeLessThanOrEqual(1);
		});

		test('splitMin is less than or equal to splitMax', () => {
			expect(settings.effectParams.splitMin).toBeLessThanOrEqual(settings.effectParams.splitMax);
		});
	});

	describe('performance', () => {
		test('defines clips JSON URL', () => {
			expect(settings.performance.clipsJsonUrl).toBeTruthy();
		});

		test('defines key map JSON URL', () => {
			expect(settings.performance.keyMapJsonUrl).toBeTruthy();
		});

		test('maxConcurrentClipLoads is a positive integer', () => {
			expect(settings.performance.maxConcurrentClipLoads).toBeGreaterThan(0);
			expect(Number.isInteger(settings.performance.maxConcurrentClipLoads)).toBe(true);
		});
	});

	describe('rendering', () => {
		test('imageSmoothingEnabled is false for pixel-perfect rendering', () => {
			expect(settings.rendering.imageSmoothingEnabled).toBe(false);
		});

		test('backgroundColor is a valid hex color', () => {
			expect(settings.rendering.backgroundColor).toMatch(/^#[0-9a-fA-F]{6}$/);
		});
	});
});
