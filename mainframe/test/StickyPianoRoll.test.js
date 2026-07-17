// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/StickyPianoRoll.js';

describe('AkvjStickyPianoRoll', () => {
	/** @type {import('../src/js/StickyPianoRoll.js').default} */
	let element;

	beforeEach(() => {
		element = document.createElement('akvj-sticky-piano-roll');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('renders 128 keys on connect', () => {
		expect(element.children.length).toBe(128);
	});

	test('creates white and black keys with correct classes', () => {
		const firstKey = element.children[0];
		expect(firstKey.classList.contains('sticky-key')).toBe(true);
		expect(firstKey.classList.contains('sticky-key--white')).toBe(true);

		const cSharp = element.children[1];
		expect(cSharp.classList.contains('sticky-key--black')).toBe(true);
	});

	test('sets dataset.note on each key', () => {
		for (let i = 0; i < 128; i++) {
			expect(element.children[i].dataset.note).toBe(String(i));
		}
	});

	test('adds labels on C keys only', () => {
		const c0 = element.children[0];
		expect(c0.querySelector('.sticky-key-label')).not.toBeNull();

		const cSharp = element.children[1];
		expect(cSharp.querySelector('.sticky-key-label')).toBeNull();
	});

	test('dispatches stickykeyclick event with note and clipId on click', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];

		let eventDetail = null;
		element.addEventListener('stickykeyclick', event => {
			eventDetail = event.detail;
		});

		element.children[60].click();
		expect(eventDetail.note).toBe(60);
		expect(eventDetail.clipId).toBe('c1-n60-v0');
		expect(eventDetail.isActive).toBe(true);
	});

	test('second click on same note deactivates filter', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];

		let eventDetail = null;
		element.addEventListener('stickykeyclick', event => {
			eventDetail = event.detail;
		});

		element.children[60].click();
		expect(eventDetail.isActive).toBe(true);
		expect(element.children[60].classList.contains('sticky-key--active')).toBe(true);

		element.children[60].click();
		expect(eventDetail.isActive).toBe(false);
		expect(element.children[60].classList.contains('sticky-key--active')).toBe(false);
	});

	test('dispatches null clipId for unmapped notes', () => {
		element.channel = 1;
		element.mappings = [];

		let eventDetail = null;
		element.addEventListener('stickykeyclick', event => {
			eventDetail = event.detail;
		});

		element.children[60].click();
		expect(eventDetail.clipId).toBeNull();
	});

	test('highlights mapped notes for current channel', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' },
			{ channel: 2, note: 64, velocity: 0, clipId: 'c2-n64-v0' }
		];

		expect(element.children[60].classList.contains('sticky-key--mapped')).toBe(true);
		expect(element.children[64].classList.contains('sticky-key--mapped')).toBe(false);
	});

	test('updates highlights when channel changes', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' },
			{ channel: 2, note: 64, velocity: 0, clipId: 'c2-n64-v0' }
		];

		element.channel = 2;
		expect(element.children[60].classList.contains('sticky-key--mapped')).toBe(false);
		expect(element.children[64].classList.contains('sticky-key--mapped')).toBe(true);
	});

	test('clearFilter removes active highlight', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];

		element.children[60].click();
		expect(element.children[60].classList.contains('sticky-key--active')).toBe(true);

		element.clearFilter();
		expect(element.children[60].classList.contains('sticky-key--active')).toBe(false);
	});

	test('cleans up on disconnect', () => {
		element.remove();
		expect(element.children.length).toBe(0);
	});
});
