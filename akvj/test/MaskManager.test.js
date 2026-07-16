/**
 * Unit tests for MaskManager - latching behavior, bit depth, lifecycle, edge cases.
 * Complements integration.test.js with direct unit tests.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import MaskManager from '../src/js/visuals/MaskManager.js';
import settings from '../src/js/core/settings.js';

function createMockMaskClip(bitDepth = 1) {
	return {
		bitDepth,
		reset: vi.fn(),
		stop: vi.fn(),
		renderToContext: vi.fn(),
		isFinished: false
	};
}

describe('MaskManager', () => {
	let mm;

	beforeEach(() => {
		mm = new MaskManager();
	});

	test('getCurrentMask returns null before any trigger', () => {
		expect(mm.getCurrentMask()).toBeNull();
	});

	test('getBitDepth returns null before any trigger', () => {
		expect(mm.getBitDepth()).toBeNull();
	});

	test('handlesChannel returns true for mixer channel only', () => {
		expect(mm.handlesChannel(settings.channelMapping.mixer)).toBe(true);
		expect(mm.handlesChannel(0)).toBe(false);
		expect(mm.handlesChannel(99)).toBe(false);
	});

	test('noteOn with wrong channel returns false', () => {
		const clip = createMockMaskClip();
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });
		expect(mm.noteOn(0, 60, 127)).toBe(false);
	});

	test('noteOn activates mask and latches', () => {
		const clip = createMockMaskClip(1);
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });

		expect(mm.noteOn(settings.channelMapping.mixer, 60, 127)).toBe(true);
		expect(mm.getCurrentMask()).toBe(clip);
		expect(mm.getBitDepth()).toBe(1);
		expect(clip.reset).toHaveBeenCalled();
	});

	test('noteOn replaces previous mask and stops it', () => {
		const clip1 = createMockMaskClip(1);
		const clip2 = createMockMaskClip(8);
		mm.setClips({
			[settings.channelMapping.mixer]: {
				60: { 0: clip1 },
				61: { 0: clip2 }
			}
		});

		mm.noteOn(settings.channelMapping.mixer, 60, 127);
		expect(mm.getCurrentMask()).toBe(clip1);

		mm.noteOn(settings.channelMapping.mixer, 61, 127);
		expect(mm.getCurrentMask()).toBe(clip2);
		expect(mm.getBitDepth()).toBe(8);
		expect(clip1.stop).toHaveBeenCalled();
	});

	test('noteOn with same clip does not stop it', () => {
		const clip = createMockMaskClip(1);
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });

		mm.noteOn(settings.channelMapping.mixer, 60, 127);
		mm.noteOn(settings.channelMapping.mixer, 60, 127);

		// stop should NOT be called because it's the same clip
		expect(clip.stop).not.toHaveBeenCalled();
	});

	test('noteOff is ignored (latching behavior)', () => {
		const clip = createMockMaskClip(1);
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });

		mm.noteOn(settings.channelMapping.mixer, 60, 127);
		const result = mm.noteOff(settings.channelMapping.mixer, 60);
		expect(result).toBe(false);
		expect(mm.getCurrentMask()).toBe(clip);
	});

	test('noteOn with no clip for note returns false', () => {
		mm.setClips({ [settings.channelMapping.mixer]: {} });
		expect(mm.noteOn(settings.channelMapping.mixer, 99, 127)).toBe(false);
	});

	test('noteOn with clip missing reset method returns false', () => {
		const badClip = { bitDepth: 1, stop: vi.fn() };
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: badClip } } });
		expect(mm.noteOn(settings.channelMapping.mixer, 60, 127)).toBe(false);
	});

	test('bitDepth defaults to 1 when clip has no bitDepth property', () => {
		const clip = { reset: vi.fn(), stop: vi.fn(), renderToContext: vi.fn(), isFinished: false };
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });

		mm.noteOn(settings.channelMapping.mixer, 60, 127);
		expect(mm.getBitDepth()).toBe(1);
	});

	test('clear stops current mask and resets state', () => {
		const clip = createMockMaskClip(1);
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });
		mm.noteOn(settings.channelMapping.mixer, 60, 127);

		mm.clear();
		expect(mm.getCurrentMask()).toBeNull();
		expect(mm.getBitDepth()).toBeNull();
		expect(clip.stop).toHaveBeenCalled();
	});

	test('clear with no active mask does not throw', () => {
		expect(() => mm.clear()).not.toThrow();
	});

	test('destroy clears mask and clips, and is idempotent', () => {
		const clip = createMockMaskClip(1);
		mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });
		mm.noteOn(settings.channelMapping.mixer, 60, 127);

		mm.destroy();
		expect(mm.getCurrentMask()).toBeNull();
		expect(mm.getBitDepth()).toBeNull();
		expect(clip.stop).toHaveBeenCalled();

		// Second destroy should not throw
		expect(() => mm.destroy()).not.toThrow();
	});

	test('setClips with empty clips object does not throw', () => {
		expect(() => mm.setClips({})).not.toThrow();
		expect(() => mm.setClips({ [settings.channelMapping.mixer]: {} })).not.toThrow();
	});

	describe('setScrubPosition', () => {
		test('calls setScrubPosition on current mask when playbackMode is scrub', () => {
			const clip = createMockMaskClip(1);
			clip.playbackMode = 'scrub';
			clip.setScrubPosition = vi.fn();
			mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });
			mm.noteOn(settings.channelMapping.mixer, 60, 127);

			mm.setScrubPosition(0.5);
			expect(clip.setScrubPosition).toHaveBeenCalledWith(0.5);
		});

		test('does not call setScrubPosition when playbackMode is not scrub', () => {
			const clip = createMockMaskClip(1);
			clip.playbackMode = 'loop';
			clip.setScrubPosition = vi.fn();
			mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });
			mm.noteOn(settings.channelMapping.mixer, 60, 127);

			mm.setScrubPosition(0.5);
			expect(clip.setScrubPosition).not.toHaveBeenCalled();
		});

		test('does not throw when no mask is active', () => {
			expect(() => mm.setScrubPosition(0.5)).not.toThrow();
		});

		test('does not call setScrubPosition when mask is finished', () => {
			const clip = createMockMaskClip(1);
			clip.playbackMode = 'scrub';
			clip.setScrubPosition = vi.fn();
			clip.isFinished = true;
			mm.setClips({ [settings.channelMapping.mixer]: { 60: { 0: clip } } });
			mm.noteOn(settings.channelMapping.mixer, 60, 127);
			clip.isFinished = true;

			mm.setScrubPosition(0.5);
			expect(clip.setScrubPosition).not.toHaveBeenCalled();
		});
	});
});
