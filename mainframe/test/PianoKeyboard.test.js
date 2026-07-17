// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/PianoKeyboard.js';

describe('AkvjPianoKeyboard', () => {
	/** @type {import('../src/js/PianoKeyboard.js').default} */
	let element;

	beforeEach(() => {
		element = document.createElement('akvj-piano-keyboard');
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
		expect(firstKey.classList.contains('piano-key')).toBe(true);
		expect(firstKey.classList.contains('piano-key--white')).toBe(true);

		const cSharp = element.children[1];
		expect(cSharp.classList.contains('piano-key--black')).toBe(true);
	});

	test('sets dataset.note on each key', () => {
		for (let i = 0; i < 128; i++) {
			expect(element.children[i].dataset.note).toBe(String(i));
		}
	});

	test('adds labels on C keys (note % 12 === 0)', () => {
		const c0 = element.children[0];
		const label = c0.querySelector('.piano-key-label');
		expect(label).not.toBeNull();
		expect(label.textContent).toBe('C-1');

		const c1 = element.children[12];
		const label1 = c1.querySelector('.piano-key-label');
		expect(label1).not.toBeNull();
		expect(label1.textContent).toBe('C0');
	});

	test('does not add labels on non-C keys', () => {
		const cSharp = element.children[1];
		expect(cSharp.querySelector('.piano-key-label')).toBeNull();
	});

	test('dispatches pianokeyclick event with note on click', () => {
		let dispatchedNote = null;
		element.addEventListener('pianokeyclick', event => {
			dispatchedNote = event.detail.note;
		});

		element.children[60].click();
		expect(dispatchedNote).toBe(60);
	});

	test('highlights mapped notes on the current channel', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' },
			{ channel: 1, note: 72, velocity: 0, clipId: 'c1-n72-v0' }
		];

		expect(element.children[60].classList.contains('piano-key--mapped')).toBe(true);
		expect(element.children[72].classList.contains('piano-key--mapped')).toBe(true);
		expect(element.children[0].classList.contains('piano-key--mapped')).toBe(false);
	});

	test('sets title with clipId for mapped notes', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];

		expect(element.children[60].title).toContain('c1-n60-v0');
	});

	test('sets title without clipId for unmapped notes', () => {
		element.channel = 1;
		element.mappings = [];

		expect(element.children[60].title).not.toContain('→');
	});

	test('only highlights mappings for the current channel', () => {
		element.channel = 2;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' },
			{ channel: 2, note: 64, velocity: 0, clipId: 'c2-n64-v0' }
		];

		expect(element.children[60].classList.contains('piano-key--mapped')).toBe(false);
		expect(element.children[64].classList.contains('piano-key--mapped')).toBe(true);
	});

	test('incremental update does not recreate keys on mapping change', () => {
		element.channel = 1;
		element.mappings = [];

		const firstKeyBefore = element.children[0];
		element.mappings = [
			{ channel: 1, note: 0, velocity: 0, clipId: 'c1-n0-v0' }
		];

		expect(element.children[0]).toBe(firstKeyBefore);
		expect(element.children[0].classList.contains('piano-key--mapped')).toBe(true);
	});

	test('removes mapped class when mapping is cleared', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];
		expect(element.children[60].classList.contains('piano-key--mapped')).toBe(true);

		element.mappings = [];
		expect(element.children[60].classList.contains('piano-key--mapped')).toBe(false);
	});

	test('full re-render on channel change preserves key count', () => {
		element.channel = 1;
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }
		];

		element.channel = 3;
		expect(element.children.length).toBe(128);
		expect(element.children[60].classList.contains('piano-key--mapped')).toBe(false);
	});

	test('cleans up on disconnect', () => {
		element.remove();
		expect(element.children.length).toBe(0);
	});
});
