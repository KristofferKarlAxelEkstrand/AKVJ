// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { redistributeVelocities, insertionIndexForDropVelocity, clipHue, MIN_REGION_VELOCITY } from '../src/js/PianoKey.js';
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

	test('edit mode renders velocity regions proportional to ranges', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 50, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		const regions = key.querySelectorAll('.velocity-region');
		expect(regions.length).toBe(2);
		expect(regions[0].dataset.clipId).toBe('soft');
		expect(regions[0].style.bottom).toBe('0%');
		expect(regions[0].style.height).toBe('39.0625%');
		expect(regions[1].dataset.clipId).toBe('hard');
		expect(regions[1].style.bottom).toBe('39.0625%');
		expect(regions[1].style.height).toBe('60.9375%');
		expect(key.classList.contains('has-regions')).toBe(true);
		expect(key.querySelectorAll('.velocity-handle').length).toBe(1);
	});

	test('edit mode region click selects mapping', () => {
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
		element.mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'only' }];

		const region = element.querySelectorAll('piano-key')[60].querySelector('.velocity-region');
		expect(region.style.bottom).toBe('0%');
		expect(region.style.height).toBe('100%');
		expect(element.querySelectorAll('piano-key')[60].querySelectorAll('.velocity-handle').length).toBe(0);
	});

	test('select mode dispatches keyclick with note and highlights key', () => {
		element.mode = 'select';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		let detail = null;
		element.addEventListener('keyclick', event => {
			detail = event.detail;
		});

		const key = element.querySelectorAll('piano-key')[60];
		press(key);

		expect(key.classList.contains('is-active')).toBe(true);
		expect(element.selectedNote).toBe(60);
		expect(detail.note).toBe(60);
		expect(detail.mode).toBe('select');
		expect(detail.action).toBe('select');
		expect(detail.isActive).toBe(true);
		expect(detail.mappings).toHaveLength(2);
		expect(element.querySelector('.piano-roll-clip-view')).toBeNull();
	});

	test('select mode does not dim non-selected keys', () => {
		element.mode = 'select';
		const keys = element.querySelectorAll('piano-key');
		press(keys[60]);

		expect(keys[60].classList.contains('is-dimmed')).toBe(false);
		expect(keys[61].classList.contains('is-dimmed')).toBe(false);
	});

	test('select mode toggles off on re-click and switches keys', () => {
		element.mode = 'select';
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

	test('select mode renders velocity regions like filter', () => {
		element.mode = 'select';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 50, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		expect(key.querySelectorAll('.velocity-region').length).toBe(2);
		expect(key.classList.contains('is-mapped')).toBe(true);
	});

	test('mode="select" lights Filter button and shows filter view', () => {
		element.mode = 'select';

		const filterButton = element.querySelector('.piano-roll-mode-button[data-mode="filter"]');
		expect(filterButton.classList.contains('is-active')).toBe(true);
		expect(filterButton.getAttribute('aria-selected')).toBe('true');
		expect(element.querySelector('.piano-roll-filter-view').hidden).toBe(false);
		expect(element.querySelector('.piano-roll-edit-view').hidden).toBe(true);
		expect(element.querySelector('.piano-roll-play-view').hidden).toBe(true);
	});

	test('select mode dims non-matching velocity regions like filter', () => {
		element.mode = 'select';
		element.channel = 1;
		element.clips = [
			{ clipId: 'soft', meta: { triggerType: 'momentary' } },
			{ clipId: 'hard', meta: { triggerType: 'latch' } }
		];
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		element.filters = { triggerType: 'latch' };

		const regions = key.querySelectorAll('.velocity-region');
		const hardRegion = [...regions].find(region => region.dataset.clipId === 'hard');
		const softRegion = [...regions].find(region => region.dataset.clipId === 'soft');

		expect(hardRegion.classList.contains('is-filtered-out')).toBe(false);
		expect(softRegion.classList.contains('is-filtered-out')).toBe(true);
	});

	test('highlights mapped notes for current channel', () => {
		element.mode = 'select';
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
		element.mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }];

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

	test('clearSelection removes active highlights in select mode', () => {
		element.mode = 'select';
		element.channel = 1;
		element.mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }];
		const key = element.querySelectorAll('piano-key')[60];
		press(key);
		expect(key.classList.contains('is-active')).toBe(true);

		element.clearSelection();
		expect(key.classList.contains('is-active')).toBe(false);
		expect(element.selectedNote).toBeNull();
	});

	test('incremental mapping update does not recreate keys', () => {
		element.mappings = [];
		const firstKey = element.querySelector('piano-key');
		element.mappings = [{ channel: 1, note: 0, velocity: 0, clipId: 'c1-n0-v0' }];
		expect(element.querySelector('piano-key')).toBe(firstKey);
		expect(firstKey.classList.contains('is-mapped')).toBe(true);
	});

	test('select mode class applied without is-compact', () => {
		element.mode = 'select';
		expect(element.classList.contains('is-select')).toBe(true);
		expect(element.classList.contains('is-compact')).toBe(false);
		element.mode = 'edit';
		expect(element.classList.contains('is-select')).toBe(false);
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

	test('redistributeVelocities places even breakpoints', () => {
		expect(redistributeVelocities(['a'])).toEqual([{ clipId: 'a', velocity: 0 }]);
		expect(redistributeVelocities(['a', 'b'])).toEqual([
			{ clipId: 'a', velocity: 0 },
			{ clipId: 'b', velocity: 64 }
		]);
		expect(redistributeVelocities(['a', 'b', 'c'])).toEqual([
			{ clipId: 'a', velocity: 0 },
			{ clipId: 'b', velocity: 43 },
			{ clipId: 'c', velocity: 85 }
		]);
	});

	test('edit mode handle drag dispatches mappingchange with channel', () => {
		element.mode = 'edit';
		element.channel = 3;
		element.mappings = [
			{ channel: 3, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 3, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		vi.spyOn(key, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 128,
			right: 20,
			width: 20,
			height: 128,
			toJSON() {
				return {};
			}
		});

		let detail = null;
		element.addEventListener('mappingchange', event => {
			detail = event.detail;
		});

		const handle = key.querySelector('.velocity-handle');
		handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientY: 64 }));
		handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'mouse', clientY: 48 }));
		handle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientY: 48 }));

		expect(detail).toEqual({
			channel: 3,
			note: 60,
			oldVelocity: 64,
			newVelocity: 80,
			clipId: 'hard'
		});
	});

	test('pointercancel commits the drag just like pointerup', () => {
		element.mode = 'edit';
		element.channel = 3;
		element.mappings = [
			{ channel: 3, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 3, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		vi.spyOn(key, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 128,
			right: 20,
			width: 20,
			height: 128,
			toJSON() {
				return {};
			}
		});

		let detail = null;
		element.addEventListener('mappingchange', event => {
			detail = event.detail;
		});

		const handle = key.querySelector('.velocity-handle');
		handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientY: 64 }));
		handle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'mouse', clientY: 48 }));
		handle.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1, pointerType: 'mouse' }));

		expect(detail).toEqual({
			channel: 3,
			note: 60,
			oldVelocity: 64,
			newVelocity: 80,
			clipId: 'hard'
		});
	});

	test('disconnectedCallback mid-drag tears down drag listeners and clears drag classes', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		vi.spyOn(key, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 128,
			right: 20,
			width: 20,
			height: 128,
			toJSON() {
				return {};
			}
		});

		const handle = key.querySelector('.velocity-handle');
		const removeSpy = vi.spyOn(handle, 'removeEventListener');

		handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientY: 64 }));
		expect(key.classList.contains('is-dragging-handle')).toBe(true);
		expect(handle.querySelector('.velocity-handle-readout')).toBeTruthy();

		key.remove();

		expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));
		expect(key.classList.contains('is-dragging-handle')).toBe(false);
	});

	test('dragover accepts a clip-id payload: preventDefault + dropEffect copy', () => {
		const key = element.querySelectorAll('piano-key')[60];
		const dataTransfer = { types: ['application/x-akvj-clip-id', 'text/plain'], dropEffect: 'none' };
		const event = new Event('dragover', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });

		key.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(dataTransfer.dropEffect).toBe('copy');
	});

	test('dragover accepts a text/plain-only payload as a clip-id fallback', () => {
		const key = element.querySelectorAll('piano-key')[60];
		const dataTransfer = { types: ['text/plain'], dropEffect: 'none' };
		const event = new Event('dragover', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });

		key.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(dataTransfer.dropEffect).toBe('copy');
	});

	test('dragover ignores a payload without a clip-id type', () => {
		const key = element.querySelectorAll('piano-key')[60];
		const dataTransfer = { types: ['text/html'], dropEffect: 'none' };
		const event = new Event('dragover', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });

		key.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
		expect(dataTransfer.dropEffect).toBe('none');
	});

	test('clipHue derives a deterministic hue in [0, 360) from a clip id', () => {
		expect(clipHue('a')).toBe(97);
		expect(clipHue('ab')).toBe(225);
		expect(clipHue('soft')).toBe(354);
		expect(clipHue('hard')).toBe(115);
		expect(clipHue('')).toBe(0);
		expect(clipHue('some-clip-id')).toBe(clipHue('some-clip-id'));
	});

	test('edit mode handle drag is a no-op when neighboring breakpoints leave no valid gap', () => {
		element.mode = 'edit';
		element.channel = 1;
		// Dense key: lower and next bands are 1 velocity unit apart, so the handle between
		// them (index 1) has minVelocity=31 > maxVelocity=30 — no legal value to drag to.
		element.mappings = [
			{ channel: 1, note: 60, velocity: 30, clipId: 'a' },
			{ channel: 1, note: 60, velocity: 31, clipId: 'b' },
			{ channel: 1, note: 60, velocity: 31, clipId: 'c' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		vi.spyOn(key, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 128,
			right: 20,
			width: 20,
			height: 128,
			toJSON() {
				return {};
			}
		});

		let changeFired = false;
		element.addEventListener('mappingchange', () => {
			changeFired = true;
		});

		const handles = key.querySelectorAll('.velocity-handle');
		const brokenHandle = [...handles].find(handle => handle.dataset.handleIndex === '1');
		expect(brokenHandle).toBeTruthy();

		brokenHandle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientY: 64 }));
		brokenHandle.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, pointerType: 'mouse', clientY: 48 }));
		brokenHandle.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, clientY: 48 }));

		expect(changeFired).toBe(false);
		expect(key.classList.contains('is-dragging-handle')).toBe(false);
		expect(brokenHandle.classList.contains('is-dragging')).toBe(false);
		expect(brokenHandle.querySelector('.velocity-handle-readout')).toBeNull();
	});

	test('drop is rejected when key has too many clips (would violate MIN_REGION_VELOCITY)', () => {
		element.mode = 'edit';
		element.channel = 1;

		// With MIN_REGION_VELOCITY=2 and VELOCITY_RANGE=128, max clips = 64
		expect(MIN_REGION_VELOCITY).toBe(2);
		// Create 64 clips already mapped to the key
		const existingMappings = [];
		for (let i = 0; i < 64; i++) {
			existingMappings.push({ channel: 1, note: 60, velocity: i * 2, clipId: `clip-${i}` });
		}
		element.mappings = existingMappings;

		const key = element.querySelectorAll('piano-key')[60];
		let addFired = false;
		element.addEventListener('mappingadd', () => {
			addFired = true;
		});

		const dataTransfer = {
			types: ['application/x-akvj-clip-id'],
			getData: () => 'new-clip'
		};
		const event = new Event('drop', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });

		key.dispatchEvent(event);

		// Drop should be rejected since adding another clip would exceed the limit
		expect(addFired).toBe(false);
	});

	test('drop succeeds when key is below the clip limit', () => {
		element.mode = 'edit';
		element.channel = 1;

		// Create 63 clips (one below the limit of 64)
		const existingMappings = [];
		for (let i = 0; i < 63; i++) {
			existingMappings.push({ channel: 1, note: 60, velocity: Math.round((128 * i) / 63), clipId: `clip-${i}` });
		}
		element.mappings = existingMappings;

		const key = element.querySelectorAll('piano-key')[60];
		let addDetail = null;
		element.addEventListener('mappingadd', event => {
			addDetail = event.detail;
		});

		const dataTransfer = {
			types: ['application/x-akvj-clip-id'],
			getData: () => 'new-clip'
		};
		const event = new Event('drop', { bubbles: true, cancelable: true });
		Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });

		key.dispatchEvent(event);

		// Drop should succeed
		expect(addDetail).not.toBeNull();
		expect(addDetail.clipId).toBe('new-clip');
		expect(addDetail.mappings).toHaveLength(64);
	});

	test('edit mode right-click region dispatches mappingremove with redistributed mappings', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		let detail = null;
		element.addEventListener('mappingremove', event => {
			detail = event.detail;
		});

		const region = element.querySelectorAll('piano-key')[60].querySelector('[data-clip-id="soft"]');
		region.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));

		expect(detail.channel).toBe(1);
		expect(detail.note).toBe(60);
		expect(detail.clipId).toBe('soft');
		expect(detail.velocity).toBe(0);
		expect(detail.mappings).toEqual([{ clipId: 'hard', velocity: 0 }]);
	});

	test('edit mode double-click region dispatches mappingremove with redistributed mappings', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		let detail = null;
		element.addEventListener('mappingremove', event => {
			detail = event.detail;
		});

		const region = element.querySelectorAll('piano-key')[60].querySelector('[data-clip-id="soft"]');
		region.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));

		expect(detail.channel).toBe(1);
		expect(detail.note).toBe(60);
		expect(detail.clipId).toBe('soft');
		expect(detail.velocity).toBe(0);
		expect(detail.mappings).toEqual([{ clipId: 'hard', velocity: 0 }]);
	});

	test('insertionIndexForDropVelocity inserts by region midpoint', () => {
		const bands = [
			{ start: 0, end: 64 },
			{ start: 64, end: 128 }
		];
		expect(insertionIndexForDropVelocity(10, bands)).toBe(0);
		expect(insertionIndexForDropVelocity(70, bands)).toBe(1);
		expect(insertionIndexForDropVelocity(120, bands)).toBe(2);
	});

	test('edit mode drop inserts clip and dispatches mappingadd with redistributed mappings', () => {
		element.mode = 'edit';
		element.channel = 2;
		element.mappings = [{ channel: 2, note: 60, velocity: 0, clipId: 'soft' }];

		const key = element.querySelectorAll('piano-key')[60];
		vi.spyOn(key, 'getBoundingClientRect').mockReturnValue({
			x: 0,
			y: 0,
			top: 0,
			left: 0,
			bottom: 128,
			right: 20,
			width: 20,
			height: 128,
			toJSON() {
				return {};
			}
		});

		let detail = null;
		element.addEventListener('mappingadd', event => {
			detail = event.detail;
		});

		const dataTransfer = {
			types: ['application/x-akvj-clip-id', 'text/plain'],
			getData: type => (type === 'application/x-akvj-clip-id' || type === 'text/plain' ? 'hard' : ''),
			dropEffect: 'none'
		};
		const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
		Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
		Object.defineProperty(dropEvent, 'clientY', { value: 16 }); // near top → high-velocity end
		key.dispatchEvent(dropEvent);

		expect(detail.channel).toBe(2);
		expect(detail.note).toBe(60);
		expect(detail.clipId).toBe('hard');
		expect(detail.mappings).toEqual([
			{ clipId: 'soft', velocity: 0 },
			{ clipId: 'hard', velocity: 64 }
		]);
		expect(detail.velocity).toBe(64);
	});

	test('keydown Enter/Space dispatches keyclickrequest and disconnecting removes the listener', () => {
		const key = element.querySelectorAll('piano-key')[60];
		const handler = vi.fn();
		key.addEventListener('keyclickrequest', handler);

		key.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		expect(handler).toHaveBeenCalledTimes(1);

		key.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
		expect(handler).toHaveBeenCalledTimes(2);

		key.remove();

		key.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		expect(handler).toHaveBeenCalledTimes(2);
	});

	test('renders mode selector buttons Edit, Filter, Play left of channel picker', () => {
		element.channelSelect = true;
		const buttons = element.querySelectorAll('.piano-roll-mode-button');
		expect(buttons.length).toBe(3);
		expect([...buttons].map(button => button.textContent)).toEqual(['Edit', 'Filter', 'Play']);

		const toolbar = element.querySelector('.piano-roll-toolbar');
		const modeGroup = toolbar.querySelector('.piano-roll-mode-group');
		const channelBar = toolbar.querySelector('.piano-roll-channel-bar');
		expect(toolbar.firstElementChild).toBe(modeGroup);
		expect(toolbar.lastElementChild).toBe(channelBar);
	});

	test('clicking a mode button changes mode and dispatches pianoroll:mode-changed', () => {
		element.mode = 'edit';
		const events = [];
		element.addEventListener('pianoroll:mode-changed', event => events.push(event.detail.mode));

		const filterButton = element.querySelector('.piano-roll-mode-button[data-mode="filter"]');
		filterButton.click();

		expect(element.mode).toBe('filter');
		expect(events).toEqual(['filter']);
	});

	test('active mode button has is-active class and aria-selected', () => {
		element.mode = 'play';
		const activeButton = element.querySelector('.piano-roll-mode-button.is-active');
		expect(activeButton.dataset.mode).toBe('play');
		expect(activeButton.getAttribute('aria-selected')).toBe('true');

		const editButton = element.querySelector('.piano-roll-mode-button[data-mode="edit"]');
		expect(editButton.classList.contains('is-active')).toBe(false);
		expect(editButton.getAttribute('aria-selected')).toBe('false');
	});

	test('mode change toggles view container visibility', () => {
		element.mode = 'edit';
		expect(element.querySelector('.piano-roll-edit-view').hidden).toBe(false);
		expect(element.querySelector('.piano-roll-filter-view').hidden).toBe(true);
		expect(element.querySelector('.piano-roll-play-view').hidden).toBe(true);

		element.mode = 'filter';
		expect(element.querySelector('.piano-roll-edit-view').hidden).toBe(true);
		expect(element.querySelector('.piano-roll-filter-view').hidden).toBe(false);
		expect(element.querySelector('.piano-roll-play-view').hidden).toBe(true);

		element.mode = 'play';
		expect(element.querySelector('.piano-roll-edit-view').hidden).toBe(true);
		expect(element.querySelector('.piano-roll-filter-view').hidden).toBe(true);
		expect(element.querySelector('.piano-roll-play-view').hidden).toBe(false);
	});

	test('edit mode tooltip shows clip metadata on velocity region hover', () => {
		element.mode = 'edit';
		element.channel = 1;
		element.clips = [{ clipId: 'soft', meta: { name: 'Soft kick', triggerType: 'momentary' } }];
		element.mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'soft' }];

		const key = element.querySelectorAll('piano-key')[60];
		const region = key.querySelector('.velocity-region');
		const tooltip = element.querySelector('.piano-roll-tooltip');

		region.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 0, clientY: 0 }));

		expect(tooltip.hidden).toBe(false);
		expect(tooltip.innerHTML).toContain('soft');
		expect(tooltip.innerHTML).toContain('Soft kick');
		expect(tooltip.innerHTML).toContain('momentary');

		region.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
		expect(tooltip.hidden).toBe(true);
	});

	test('filter mode renders filter controls and summary', () => {
		element.mode = 'filter';
		expect(element.querySelector('.piano-roll-filter-controls')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-clip-id')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-trigger')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-role')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-layer-group')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-populated input')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-clear')).not.toBeNull();
		expect(element.querySelector('.piano-roll-filter-summary').textContent).toBe('No active filters');
	});

	test('setting filters dispatches pianoroll:filter-changed and updates summary', () => {
		element.mode = 'filter';
		let detail = null;
		element.addEventListener('pianoroll:filter-changed', event => {
			detail = event.detail;
		});

		element.filters = { clipId: 'kick' };

		expect(detail.filters.clipId).toBe('kick');
		expect(element.querySelector('.piano-roll-filter-summary').textContent).toContain('clipId: kick');
		expect(element.querySelector('.piano-roll-filter-clip-id').value).toBe('kick');
	});

	test('filter mode dims non-matching velocity regions', () => {
		element.mode = 'filter';
		element.channel = 1;
		element.clips = [
			{ clipId: 'soft', meta: { triggerType: 'momentary' } },
			{ clipId: 'hard', meta: { triggerType: 'latch' } }
		];
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		element.filters = { triggerType: 'latch' };

		const regions = key.querySelectorAll('.velocity-region');
		const hardRegion = [...regions].find(region => region.dataset.clipId === 'hard');
		const softRegion = [...regions].find(region => region.dataset.clipId === 'soft');

		expect(hardRegion.classList.contains('is-filtered-out')).toBe(false);
		expect(softRegion.classList.contains('is-filtered-out')).toBe(true);
	});

	test('filter mode layerGroup B on channel 1 (A) dims regions and key; A does not', () => {
		element.mode = 'filter';
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];

		element.filters = { layerGroup: 'B' };
		const regionsWhenB = key.querySelectorAll('.velocity-region');
		expect([...regionsWhenB].every(region => region.classList.contains('is-filtered-out'))).toBe(true);
		expect(key.classList.contains('is-dimmed')).toBe(true);

		element.filters = { layerGroup: 'A' };
		const regionsWhenA = key.querySelectorAll('.velocity-region');
		expect([...regionsWhenA].every(region => !region.classList.contains('is-filtered-out'))).toBe(true);
		expect(key.classList.contains('is-dimmed')).toBe(false);
	});

	test('filter summary includes layer: A and layer: B', () => {
		element.mode = 'filter';

		element.filters = { layerGroup: 'A' };
		expect(element.querySelector('.piano-roll-filter-summary').textContent).toContain('layer: A');

		element.filters = { layerGroup: 'B' };
		expect(element.querySelector('.piano-roll-filter-summary').textContent).toContain('layer: B');
	});

	test('filter mode dims non-matching regions by role bitmask', () => {
		element.mode = 'filter';
		element.channel = 1;
		element.clips = [
			{ clipId: 'soft', meta: { role: 'bitmask' } },
			{ clipId: 'hard', meta: {} }
		];
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'soft' },
			{ channel: 1, note: 60, velocity: 64, clipId: 'hard' }
		];

		const key = element.querySelectorAll('piano-key')[60];
		element.filters = { role: 'bitmask' };

		const regions = key.querySelectorAll('.velocity-region');
		const softRegion = [...regions].find(region => region.dataset.clipId === 'soft');
		const hardRegion = [...regions].find(region => region.dataset.clipId === 'hard');

		expect(softRegion.classList.contains('is-filtered-out')).toBe(false);
		expect(hardRegion.classList.contains('is-filtered-out')).toBe(true);
	});

	test('filter mode dims unmapped keys when showOnlyPopulated is true', () => {
		element.mode = 'filter';
		element.channel = 1;
		element.mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'only' }];

		element.filters = { showOnlyPopulated: true };

		const keys = element.querySelectorAll('piano-key');
		expect(keys[60].classList.contains('is-dimmed')).toBe(false);
		expect(keys[61].classList.contains('is-dimmed')).toBe(true);
	});

	test('clear filters resets state and controls', () => {
		element.mode = 'filter';
		element.filters = { clipId: 'kick', triggerType: 'momentary' };
		expect(element.querySelector('.piano-roll-filter-summary').textContent).not.toBe('No active filters');

		element.resetFilters();

		expect(element.filters.clipId).toBe('');
		expect(element.querySelector('.piano-roll-filter-clip-id').value).toBe('');
		expect(element.querySelector('.piano-roll-filter-summary').textContent).toBe('No active filters');
	});

	test('mode switch to filter and back preserves channel and mappings', () => {
		element.mode = 'edit';
		element.channel = 3;
		element.mappings = [{ channel: 3, note: 48, velocity: 0, clipId: 'kick' }];

		element.mode = 'filter';
		expect(element.channel).toBe(3);
		expect(element.mappings).toEqual([{ channel: 3, note: 48, velocity: 0, clipId: 'kick' }]);

		element.mode = 'edit';
		expect(element.channel).toBe(3);
	});
});
