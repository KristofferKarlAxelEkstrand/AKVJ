// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/PianoKey.js';
import '../src/js/PianoRoll.js';

/**
 * @param {Element} target
 */
function press(target) {
	target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', button: 0 }));
}

/**
 * @param {Element} target
 */
function touchPress(target) {
	target.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch', button: 0 }));
}

describe('PianoRoll', () => {
	/** @type {import('../src/js/PianoRoll.js').PianoRoll} */
	let element;

	beforeEach(() => {
		element = document.createElement('piano-roll');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('renders 128 piano-key children on connect', () => {
		expect(element.querySelectorAll('piano-key').length).toBe(128);
	});

	test('creates white and black keys', () => {
		const keys = element.querySelectorAll('piano-key');
		expect(keys[0].classList.contains('is-white')).toBe(true);
		expect(keys[1].classList.contains('is-black')).toBe(true);
	});

	test('sets dataset.note on each key', () => {
		const keys = element.querySelectorAll('piano-key');
		for (let i = 0; i < 128; i++) {
			expect(keys[i].dataset.note).toBe(String(i));
		}
	});

	test('adds labels on C keys only', () => {
		const keys = element.querySelectorAll('piano-key');
		expect(keys[0].querySelector('.piano-key-label')).not.toBeNull();
		expect(keys[1].querySelector('.piano-key-label')).toBeNull();
	});

	test('default mode is edit', () => {
		expect(element.mode).toBe('edit');
	});

	test('edit mode dispatches keyclick with note', () => {
		element.mode = 'edit';
		let detail = null;
		element.addEventListener('keyclick', event => {
			detail = event.detail;
		});

		press(element.querySelectorAll('piano-key')[60]);
		expect(detail.note).toBe(60);
		expect(detail.mode).toBe('edit');
		expect(detail.action).toBe('assign');
		expect(detail.isActive).toBe(true);
	});

	test('edit mode renders velocity bands proportional to ranges', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 50, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		const bands = key.querySelectorAll('.velocity-band');
		expect(bands.length).toBe(2);
		expect(bands[0].dataset.clipId).toBe('soft');
		expect(bands[0].style.bottom).toBe('0%');
		expect(bands[0].style.height).toBe('39.0625%');
		expect(bands[1].dataset.clipId).toBe('hard');
		expect(bands[1].style.bottom).toBe('39.0625%');
		expect(bands[1].style.height).toBe('60.9375%');
		expect(key.classList.contains('has-bands')).toBe(true);
	});

	test('edit mode band click selects mapping', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		let detail = null;
		element.addEventListener('keyclick', event => {
			detail = event.detail;
		});

		press(element.querySelectorAll('piano-key')[60].querySelector('[data-clip-id="hard"]'));
		expect(detail.action).toBe('select');
		expect(detail.note).toBe(60);
		expect(detail.velocity).toBe(64);
		expect(detail.clipId).toBe('hard');
	});

	test('edit mode single mapping fills the full key', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'only' }
		];

		const band = element.querySelectorAll('piano-key')[60].querySelector('.velocity-band');
		expect(band.style.bottom).toBe('0%');
		expect(band.style.height).toBe('100%');
	});

	test('category mode selects key and shows clip list', () => {
		element.mode = 'category';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		press(key);

		expect(key.classList.contains('is-active')).toBe(true);
		expect(element.selectedNote).toBe(60);
		const items = element.querySelectorAll('.piano-roll-clip-item');
		expect(items.length).toBe(2);
		expect(items[0].textContent).toContain('soft');
		expect(items[1].textContent).toContain('hard');
	});

	test('category mode shows empty state for unmapped key', () => {
		element.mode = 'category';
		element.channel = 1;
		element.mappings = [];

		press(element.querySelectorAll('piano-key')[60]);
		expect(element.querySelector('.piano-roll-clip-view-empty').textContent).toBe('No clips mapped');
	});

	test('category mode dims non-selected keys', () => {
		element.mode = 'category';
		const keys = element.querySelectorAll('piano-key');
		press(keys[60]);

		expect(keys[60].classList.contains('is-dimmed')).toBe(false);
		expect(keys[61].classList.contains('is-dimmed')).toBe(true);
	});

	test('category mode toggles off on re-click and switches keys', () => {
		element.mode = 'category';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' },
			{ channel: 1, note: 64, velocity: 0, clipId: 'c1-n64-v0' }
		];

		const keys = element.querySelectorAll('piano-key');
		press(keys[60]);
		expect(element.selectedNote).toBe(60);

		press(keys[60]);
		expect(element.selectedNote).toBeNull();
		expect(keys[60].classList.contains('is-active')).toBe(false);

		press(keys[60]);
		press(keys[64]);
		expect(element.selectedNote).toBe(64);
		expect(keys[60].classList.contains('is-active')).toBe(false);
		expect(keys[64].classList.contains('is-active')).toBe(true);
	});

	test('category mode does not render velocity bands', () => {
		element.mode = 'category';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 50, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		expect(key.querySelectorAll('.velocity-band').length).toBe(0);
		expect(key.classList.contains('is-mapped')).toBe(true);
	});

	test('highlights mapped notes for current channel', () => {
		element.mode = 'category';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' },
			{ channel: 2, note: 64, velocity: 0, clipId: 'c2-n64-v0' }
		];

		const keys = element.querySelectorAll('piano-key');
		expect(keys[60].classList.contains('is-mapped')).toBe(true);
		expect(keys[64].classList.contains('is-mapped')).toBe(false);
	});

	test('play mode supports multi sticky keys', () => {
		element.mode = 'play';
		const keys = element.querySelectorAll('piano-key');

		press(keys[60]);
		press(keys[64]);
		expect(keys[60].classList.contains('is-active')).toBe(true);
		expect(keys[64].classList.contains('is-active')).toBe(true);

		press(keys[60]);
		expect(keys[60].classList.contains('is-active')).toBe(false);
		expect(keys[64].classList.contains('is-active')).toBe(true);
	});

	test('play mode dispatches noteon and noteoff', () => {
		element.mode = 'play';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }
		];

		const events = [];
		element.addEventListener('noteon', event => events.push(['on', event.detail]));
		element.addEventListener('noteoff', event => events.push(['off', event.detail]));

		const key = element.querySelectorAll('piano-key')[60];
		press(key);
		press(key);

		expect(events[0][0]).toBe('on');
		expect(events[0][1].note).toBe(60);
		expect(events[0][1].clipId).toBe('kick');
		expect(events[1][0]).toBe('off');
		expect(events[1][1].note).toBe(60);
	});

	test('play mode supports touch pointer events', () => {
		element.mode = 'play';
		const key = element.querySelectorAll('piano-key')[60];
		touchPress(key);
		expect(key.classList.contains('is-active')).toBe(true);
		touchPress(key);
		expect(key.classList.contains('is-active')).toBe(false);
	});

	test('play mode clearSelection turns off all notes', () => {
		element.mode = 'play';
		const keys = element.querySelectorAll('piano-key');
		const offs = [];
		element.addEventListener('noteoff', event => offs.push(event.detail.note));

		press(keys[60]);
		press(keys[64]);
		element.clearSelection();

		expect(keys[60].classList.contains('is-active')).toBe(false);
		expect(keys[64].classList.contains('is-active')).toBe(false);
		expect(offs).toEqual([60, 64]);
	});

	test('clearSelection removes active highlights and clip view', () => {
		element.mode = 'category';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];
		const key = element.querySelectorAll('piano-key')[60];
		press(key);
		expect(key.classList.contains('is-active')).toBe(true);
		expect(element.querySelector('.piano-roll-clip-view').hidden).toBe(false);

		element.clearSelection();
		expect(key.classList.contains('is-active')).toBe(false);
		expect(element.querySelector('.piano-roll-clip-view').hidden).toBe(true);
	});

	test('incremental mapping update does not recreate keys', () => {
		element.mappings = [];
		const firstKey = element.querySelector('piano-key');
		element.mappings = [
			{ channel: 1, note: 0, velocity: 0, clipId: 'c1-n0-v0' }
		];
		expect(element.querySelector('piano-key')).toBe(firstKey);
		expect(firstKey.classList.contains('is-mapped')).toBe(true);
	});

	test('compact class applied in category mode', () => {
		element.mode = 'category';
		expect(element.classList.contains('is-compact')).toBe(true);
		element.mode = 'edit';
		expect(element.classList.contains('is-compact')).toBe(false);
	});

	test('cleans up on disconnect', () => {
		element.remove();
		expect(element.children.length).toBe(0);
	});

	test('channel-select renders a per-instance channel selector', () => {
		element.channelSelect = true;
		const select = element.querySelector('select.piano-roll-channel');
		expect(select).not.toBeNull();
		expect(select.options.length).toBe(16);
		expect(select.value).toBe('1');
	});

	test('channel selector dispatches channelchange for this instance only', () => {
		element.channelSelect = true;
		let detail = null;
		element.addEventListener('channelchange', event => {
			detail = event.detail;
		});

		const select = element.querySelector('select.piano-roll-channel');
		select.value = '5';
		select.dispatchEvent(new Event('change', { bubbles: true }));

		expect(element.channel).toBe(5);
		expect(detail.channel).toBe(5);
	});

	test('multiple instances keep independent channel and selection state', () => {
		const second = document.createElement('piano-roll');
		document.body.append(second);
		second.mode = 'play';
		second.channel = 2;
		element.mode = 'play';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'ch1' },
			{ channel: 2, note: 64, velocity: 0, clipId: 'ch2' }
		];
		second.mappings = element.mappings;

		press(element.querySelectorAll('piano-key')[60]);
		press(second.querySelectorAll('piano-key')[64]);

		expect(element.querySelectorAll('piano-key')[60].classList.contains('is-active')).toBe(true);
		expect(element.querySelectorAll('piano-key')[64].classList.contains('is-active')).toBe(false);
		expect(second.querySelectorAll('piano-key')[64].classList.contains('is-active')).toBe(true);
		expect(second.querySelectorAll('piano-key')[60].classList.contains('is-active')).toBe(false);

		expect(element.querySelectorAll('piano-key')[60].classList.contains('is-mapped')).toBe(true);
		expect(element.querySelectorAll('piano-key')[64].classList.contains('is-mapped')).toBe(false);
		expect(second.querySelectorAll('piano-key')[64].classList.contains('is-mapped')).toBe(true);
		expect(second.querySelectorAll('piano-key')[60].classList.contains('is-mapped')).toBe(false);

		second.channel = 1;
		expect(second.querySelectorAll('piano-key')[60].classList.contains('is-mapped')).toBe(true);
		expect(second.querySelectorAll('piano-key')[64].classList.contains('is-mapped')).toBe(false);

		second.remove();
	});
});
