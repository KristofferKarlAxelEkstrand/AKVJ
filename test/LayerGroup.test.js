/**
 * Unit tests for LayerGroup - cache behavior, finished clip cleanup, sorting, lifecycle.
 * Complements integration.test.js with direct unit tests for edge cases.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import LayerGroup from '../src/js/visuals/LayerGroup.js';

function createMockClip(id = 'clip') {
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
	let group;

	beforeEach(() => {
		group = new LayerGroup([0, 1, 2, 3]);
	});

	test('hasActiveClips returns false when no clips are active', () => {
		expect(group.hasActiveClips()).toBe(false);
	});

	test('hasActiveClips returns true when clips are active', () => {
		const clip = createMockClip();
		group.setClips({ 0: { 60: { 0: clip } } });
		group.noteOn(0, 60, 127);
		expect(group.hasActiveClips()).toBe(true);
	});

	test('hasActiveClips returns false when all clips are finished', () => {
		const clip = createMockClip();
		clip.isFinished = true;
		group.setClips({ 0: { 60: { 0: clip } } });
		group.noteOn(0, 60, 127);
		// Simulate clip finishing
		clip.isFinished = true;
		expect(group.hasActiveClips()).toBe(false);
	});

	test('getActiveClips filters out finished clips', () => {
		const clip1 = createMockClip('clip1');
		const clip2 = createMockClip('clip2');
		group.setClips({ 0: { 60: { 0: clip1 }, 61: { 0: clip2 } } });

		group.noteOn(0, 60, 127);
		group.noteOn(0, 61, 127);

		// Mark clip1 as finished
		clip1.isFinished = true;

		const active = group.getActiveClips();
		expect(active).toContain(clip2);
		expect(active).not.toContain(clip1);
	});

	test('getActiveClips cleans up finished clips from internal Map', () => {
		const clip1 = createMockClip('clip1');
		group.setClips({ 0: { 60: { 0: clip1 } } });
		group.noteOn(0, 60, 127);
		clip1.isFinished = true;

		// First call triggers cleanup
		group.getActiveClips();
		// Second call should still return empty (clip was cleaned from Map)
		clip1.isFinished = true;
		const active = group.getActiveClips();
		expect(active).toEqual([]);
	});

	test('getActiveClips sorts by channel then note ascending', () => {
		const clip1 = createMockClip('clip1');
		const clip2 = createMockClip('clip2');
		const clip3 = createMockClip('clip3');

		group.setClips({
			0: { 60: { 0: clip1 }, 61: { 0: clip2 } },
			1: { 60: { 0: clip3 } }
		});

		// Activate in non-sorted order
		group.noteOn(0, 61, 127);
		group.noteOn(1, 60, 127);
		group.noteOn(0, 60, 127);

		const active = group.getActiveClips();
		expect(active[0]).toBe(clip1); // channel 0, note 60
		expect(active[1]).toBe(clip2); // channel 0, note 61
		expect(active[2]).toBe(clip3); // channel 1, note 60
	});

	test('noteOn with unmanaged channel returns false', () => {
		const clip = createMockClip();
		group.setClips({ 0: { 60: { 0: clip } } });
		expect(group.noteOn(99, 60, 127)).toBe(false);
	});

	test('noteOff with unmanaged channel returns false', () => {
		expect(group.noteOff(99, 60)).toBe(false);
	});

	test('noteOn with no clip for note returns false', () => {
		group.setClips({ 0: {} });
		expect(group.noteOn(0, 60, 127)).toBe(false);
	});

	test('noteOn stops existing clip on same note before replacing', () => {
		const clip1 = createMockClip('clip1');
		const clip2 = createMockClip('clip2');
		group.setClips({
			0: {
				60: {
					0: clip1,
					64: clip2
				}
			}
		});

		// Activate clip1 (velocity 0)
		group.noteOn(0, 60, 0);
		expect(group.getActiveClips()).toContain(clip1);

		// Replace with clip2 (velocity 64)
		group.noteOn(0, 60, 64);
		expect(clip1.stop).toHaveBeenCalled();
		expect(group.getActiveClips()).toContain(clip2);
		expect(group.getActiveClips()).not.toContain(clip1);
	});

	test('noteOff stops and removes clip', () => {
		const clip = createMockClip();
		group.setClips({ 0: { 60: { 0: clip } } });
		group.noteOn(0, 60, 127);

		const result = group.noteOff(0, 60);
		expect(result).toBe(true);
		expect(clip.stop).toHaveBeenCalled();
		expect(group.getActiveClips()).toEqual([]);
	});

	test('noteOff for non-active note returns false', () => {
		expect(group.noteOff(0, 60)).toBe(false);
	});

	test('clearClips stops all active clips and resets state', () => {
		const clip1 = createMockClip('clip1');
		const clip2 = createMockClip('clip2');
		group.setClips({ 0: { 60: { 0: clip1 }, 61: { 0: clip2 } } });
		group.noteOn(0, 60, 127);
		group.noteOn(0, 61, 127);

		group.clearClips();
		expect(clip1.stop).toHaveBeenCalled();
		expect(clip2.stop).toHaveBeenCalled();
		expect(group.getActiveClips()).toEqual([]);
		expect(group.hasActiveClips()).toBe(false);
	});

	test('clearClips with no active clips does not throw', () => {
		expect(() => group.clearClips()).not.toThrow();
	});

	test('destroy clears clips and velocity cache, and is idempotent', () => {
		const clip = createMockClip();
		group.setClips({ 0: { 60: { 0: clip } } });
		group.noteOn(0, 60, 127);

		group.destroy();
		expect(group.getActiveClips()).toEqual([]);
		expect(group.hasActiveClips()).toBe(false);

		// Second destroy should not throw
		expect(() => group.destroy()).not.toThrow();
	});

	test('getActiveClips returns empty array after destroy', () => {
		group.setClips({ 0: { 60: { 0: createMockClip() } } });
		group.noteOn(0, 60, 127);
		group.destroy();
		expect(group.getActiveClips()).toEqual([]);
	});

	test('setClips rebuilds velocity cache', () => {
		const clip = createMockClip();
		group.setClips({ 0: { 60: { 0: clip } } });
		// Should be able to activate after setClips
		group.noteOn(0, 60, 127);
		expect(group.getActiveClips()).toContain(clip);
	});

	test('setClips with empty object does not throw', () => {
		expect(() => group.setClips({})).not.toThrow();
		expect(group.getActiveClips()).toEqual([]);
	});

	test('cache is invalidated after noteOn/noteOff', () => {
		const clip = createMockClip();
		group.setClips({ 0: { 60: { 0: clip } } });

		// First call builds cache
		group.noteOn(0, 60, 127);
		const active1 = group.getActiveClips();
		expect(active1).toContain(clip);

		// noteOff invalidates cache
		group.noteOff(0, 60);
		const active2 = group.getActiveClips();
		expect(active2).toEqual([]);
	});
});
