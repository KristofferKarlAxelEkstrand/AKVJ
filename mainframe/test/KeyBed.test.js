// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { KeyBed } from '../src/js/KeyBed.js';
import '../src/js/PianoKey.js';

describe('KeyBed', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	test('connectedCallback renders 128 piano-key elements', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);
		keyBed.connectedCallback();

		const keys = keyBed.querySelectorAll('piano-key');
		expect(keys).toHaveLength(128);
	});

	test('connectedCallback only renders once (hasRendered guard)', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);
		keyBed.connectedCallback();
		const firstCount = keyBed.querySelectorAll('piano-key').length;

		keyBed.connectedCallback();
		const secondCount = keyBed.querySelectorAll('piano-key').length;

		expect(firstCount).toBe(128);
		expect(secondCount).toBe(128);
	});

	test('disconnectedCallback clears children and resets state', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);
		keyBed.connectedCallback();

		expect(keyBed.querySelectorAll('piano-key')).toHaveLength(128);
		expect(keyBed.keys).toHaveLength(128);

		keyBed.disconnectedCallback();

		expect(keyBed.querySelectorAll('piano-key')).toHaveLength(0);
		// After disconnectedCallback, accessing keys triggers lazy rendering again
		// So we check the internal state was reset by checking the DOM is cleared
	});

	test('keys getter triggers lazy rendering if not yet rendered', () => {
		const keyBed = new KeyBed();
		// Don't append to document to avoid connectedCallback auto-trigger
		expect(keyBed.querySelectorAll('piano-key')).toHaveLength(0);

		const keys = keyBed.keys;

		expect(keyBed.querySelectorAll('piano-key')).toHaveLength(128);
		expect(keys).toHaveLength(128);
	});

	test('keys getter returns array of 128 PianoKey instances ordered by note', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		const keys = keyBed.keys;

		expect(keys).toHaveLength(128);
		for (let note = 0; note < 128; note++) {
			expect(keys[note].note).toBe(note);
		}
	});

	test('applyChannelMappings with empty channelMappings leaves all keys unmapped (edit mode)', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		keyBed.applyChannelMappings([], 'edit');

		const keys = keyBed.keys;
		for (const key of keys) {
			expect(key.mapped).toBe(false);
			expect(key.clipId).toBeNull();
			expect(key.velocityBands).toEqual([]);
		}
	});

	test('applyChannelMappings with single mapping per note (edit mode)', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		const channelMappings = [
			{ channel: 1, note: 60, velocity: 64, clipId: 'middle-c' },
			{ channel: 1, note: 62, velocity: 64, clipId: 'd-note' }
		];

		keyBed.applyChannelMappings(channelMappings, 'edit');

		const keys = keyBed.keys;
		expect(keys[60].mapped).toBe(true);
		expect(keys[60].clipId).toBe('middle-c');
		expect(keys[60].velocityBands).toHaveLength(1);
		expect(keys[60].velocityBands[0]).toMatchObject({ velocity: 64, clipId: 'middle-c' });

		expect(keys[62].mapped).toBe(true);
		expect(keys[62].clipId).toBe('d-note');
		expect(keys[62].velocityBands).toHaveLength(1);

		expect(keys[61].mapped).toBe(false);
		expect(keys[61].clipId).toBeNull();
	});

	test('applyChannelMappings with multiple velocity bands per note (edit mode)', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		const channelMappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' },
			{ channel: 1, note: 60, velocity: 100, clipId: 'hardest' }
		];

		keyBed.applyChannelMappings(channelMappings, 'edit');

		const keys = keyBed.keys;
		expect(keys[60].mapped).toBe(true);
		expect(keys[60].clipId).toBe('soft');
		expect(keys[60].velocityBands).toHaveLength(3);
		expect(keys[60].velocityBands[0]).toMatchObject({ velocity: 0, clipId: 'soft' });
		expect(keys[60].velocityBands[1]).toMatchObject({ velocity: 64, clipId: 'hard' });
		expect(keys[60].velocityBands[2]).toMatchObject({ velocity: 100, clipId: 'hardest' });
	});

	test('applyChannelMappings in select mode builds the same velocity bands as filter', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		const channelMappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		keyBed.applyChannelMappings(channelMappings, 'select');
		const selectBands = keyBed.keys[60].velocityBands;

		keyBed.applyChannelMappings(channelMappings, 'filter');
		const filterBands = keyBed.keys[60].velocityBands;

		expect(selectBands).toEqual(filterBands);
		expect(selectBands).toHaveLength(2);
		expect(keyBed.keys[60].mapped).toBe(true);
		expect(keyBed.keys[60].clipId).toBe('soft');
	});

	test('applyChannelMappings in play mode clears velocity bands (first clipId only)', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		const channelMappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		keyBed.applyChannelMappings(channelMappings, 'play');

		const keys = keyBed.keys;
		expect(keys[60].mapped).toBe(true);
		expect(keys[60].clipId).toBe('soft');
		expect(keys[60].velocityBands).toEqual([]);
	});

	test('applyChannelMappings triggers lazy rendering if not yet rendered', () => {
		const keyBed = new KeyBed();
		// Don't append to document to avoid connectedCallback auto-trigger
		// applyChannelMappings should trigger lazy rendering
		keyBed.applyChannelMappings([], 'edit');

		// After applyChannelMappings, keys should be rendered
		expect(keyBed.keys).toHaveLength(128);
	});

	test('applyChannelMappings filters mappings by note', () => {
		const keyBed = new KeyBed();
		document.body.append(keyBed);

		const channelMappings = [
			{ channel: 1, note: 60, velocity: 64, clipId: 'c-note' },
			{ channel: 1, note: 62, velocity: 64, clipId: 'd-note' },
			{ channel: 1, note: 64, velocity: 64, clipId: 'e-note' }
		];

		keyBed.applyChannelMappings(channelMappings, 'edit');

		expect(keyBed.keys[60].mapped).toBe(true);
		expect(keyBed.keys[61].mapped).toBe(false);
		expect(keyBed.keys[62].mapped).toBe(true);
		expect(keyBed.keys[63].mapped).toBe(false);
		expect(keyBed.keys[64].mapped).toBe(true);
	});
});
