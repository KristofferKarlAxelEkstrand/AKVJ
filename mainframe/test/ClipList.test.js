// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/ClipList.js';
import '../src/js/ClipCategory.js';
import '../src/js/ClipInstance.js';

describe('ClipList — grouped category rendering', () => {
	/** @type {import('../src/js/ClipList.js').default} */
	let element;

	beforeEach(() => {
		element = document.createElement('akvj-clip-list');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('renders clip-category elements grouped by category', () => {
		element.clips = [
			{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { category: 'transitions', name: 'B' }, hasSprite: false, pipelineReady: true }
		];

		const categories = element.querySelectorAll('clip-category');
		expect(categories.length).toBe(2);
		expect(categories[0].categoryName).toBe('effects');
		expect(categories[1].categoryName).toBe('transitions');
	});

	test('renders clip-instance elements inside each category', () => {
		element.clips = [
			{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { category: 'effects', name: 'B' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'c', meta: { category: 'transitions', name: 'C' }, hasSprite: false, pipelineReady: true }
		];

		const categories = element.querySelectorAll('clip-category');
		expect(categories[0].querySelectorAll('clip-instance').length).toBe(2);
		expect(categories[1].querySelectorAll('clip-instance').length).toBe(1);
	});

	test('clip-instance entries are draggable with clipId in dataTransfer', () => {
		element.clips = [{ clipId: 'kick', meta: { category: 'drums', name: 'Kick' }, hasSprite: false, pipelineReady: true }];

		const instance = element.querySelector('clip-instance');
		expect(instance.draggable).toBe(true);

		const data = new Map();
		const dragEvent = new Event('dragstart', { bubbles: true, cancelable: true });
		Object.defineProperty(dragEvent, 'dataTransfer', {
			value: {
				setData: (type, value) => data.set(type, value),
				effectAllowed: 'none'
			}
		});
		instance.dispatchEvent(dragEvent);
		expect(data.get('application/x-akvj-clip-id')).toBe('kick');
		expect(data.get('text/plain')).toBe('kick');
	});

	test('groups clips without category into uncategorized', () => {
		element.clips = [
			{ clipId: 'a', meta: { name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { category: 'effects', name: 'B' }, hasSprite: false, pipelineReady: true }
		];

		const categories = element.querySelectorAll('clip-category');
		expect(categories.length).toBe(2);
		const uncategorized = [...categories].find(c => c.categoryName === 'uncategorized');
		expect(uncategorized).toBeDefined();
		expect(uncategorized.querySelectorAll('clip-instance').length).toBe(1);
	});

	test('renders all clips when no filters are set', () => {
		element.clips = [
			{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { category: 'transitions', name: 'B' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'c', meta: { name: 'C' }, hasSprite: false, pipelineReady: true }
		];

		expect(element.querySelectorAll('clip-instance').length).toBe(3);
	});

	test('shows empty message when no clips exist', () => {
		element.clips = [];
		expect(element.textContent).toContain('No clips in the bucket yet.');
	});

	test('shows no match message when search yields no results', () => {
		element.clips = [{ clipId: 'a', meta: { name: 'A' }, hasSprite: false, pipelineReady: true }];
		element.searchQuery = 'xyz';
		expect(element.textContent).toContain('No clips match');
	});

	test('renders all clips in single category when all share same category', () => {
		element.clips = [
			{ clipId: 'a', meta: { name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { name: 'B' }, hasSprite: false, pipelineReady: true }
		];

		const categories = element.querySelectorAll('clip-category');
		expect(categories.length).toBe(1);
		expect(categories[0].categoryName).toBe('uncategorized');
		expect(element.querySelectorAll('clip-instance').length).toBe(2);
	});

	test('clip-instance dispatches clipedit event', () => {
		element.clips = [{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true }];

		let eventDetail = null;
		element.addEventListener('clipedit', event => {
			eventDetail = event.detail;
		});

		const editButton = element.querySelector('.clip-edit');
		editButton.click();

		expect(eventDetail.clipId).toBe('a');
	});

	test('clip-instance dispatches clipdelete event', () => {
		element.clips = [{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true }];

		let eventDetail = null;
		element.addEventListener('clipdelete', event => {
			eventDetail = event.detail;
		});

		const deleteButton = element.querySelector('.clip-delete');
		deleteButton.click();

		expect(eventDetail.clipId).toBe('a');
	});

	test('clip-instance dispatches clipmap event', () => {
		element.clips = [{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true }];

		let eventDetail = null;
		element.addEventListener('clipmap', event => {
			eventDetail = event.detail;
		});

		const mapButton = element.querySelector('.clip-map');
		mapButton.click();

		expect(eventDetail.clipId).toBe('a');
	});

	test('pipelineReady false disables Map and shows incomplete in meta', () => {
		element.clips = [{ clipId: 'draft', meta: { name: 'Draft' }, hasSprite: false, pipelineReady: false }];

		const instance = element.querySelector('clip-instance');
		const mapButton = instance.querySelector('.clip-map');
		expect(mapButton.disabled).toBe(true);
		expect(instance.querySelector('.clip-meta').textContent).toContain('incomplete');
	});

	test('dragstart from Edit button is cancelled without clip id in dataTransfer', () => {
		element.clips = [{ clipId: 'kick', meta: { name: 'Kick' }, hasSprite: false, pipelineReady: true }];

		const instance = element.querySelector('clip-instance');
		const editButton = instance.querySelector('.clip-edit');
		const data = new Map();
		const dragEvent = new Event('dragstart', { bubbles: true, cancelable: true });
		Object.defineProperty(dragEvent, 'dataTransfer', {
			value: {
				setData: (type, value) => data.set(type, value),
				effectAllowed: 'none'
			}
		});
		editButton.dispatchEvent(dragEvent);

		expect(dragEvent.defaultPrevented).toBe(true);
		expect(data.size).toBe(0);
	});

	test('shows clip-id-label when meta.name differs from clipId', () => {
		element.clips = [{ clipId: 'kick-01', meta: { name: 'Kick' }, hasSprite: false, pipelineReady: true }];

		const label = element.querySelector('.clip-id-label');
		expect(label).not.toBeNull();
		expect(label.textContent).toBe(' (kick-01)');
	});

	test('hasSprite true sets img src to sprite API URL', () => {
		element.clips = [{ clipId: 'fx/wave', meta: { name: 'Wave' }, hasSprite: true, pipelineReady: true }];

		const img = element.querySelector('.clip-instance-img');
		expect(img.src).toMatch(/\/api\/clips\/fx%2Fwave\/sprite/);
	});

	test('disconnectedCallback removes dragstart listener and clears children', () => {
		element.clips = [{ clipId: 'kick', meta: { name: 'Kick' }, hasSprite: false, pipelineReady: true }];

		const instance = element.querySelector('clip-instance');
		expect(instance.childElementCount).toBeGreaterThan(0);

		instance.remove();

		expect(instance.childElementCount).toBe(0);

		const data = new Map();
		const dragEvent = new Event('dragstart', { bubbles: true, cancelable: true });
		Object.defineProperty(dragEvent, 'dataTransfer', {
			value: {
				setData: (type, value) => data.set(type, value),
				effectAllowed: 'none'
			}
		});
		instance.dispatchEvent(dragEvent);
		expect(data.size).toBe(0);
	});

	test('showMapAction flag hides Map button when set to false', () => {
		element.clips = [{ clipId: 'a', meta: { name: 'A' }, hasSprite: false, pipelineReady: true }];
		element.showMapAction = false;

		const mapButton = element.querySelector('.clip-map');
		expect(mapButton).toBeNull();
	});

	test('showMapAction flag shows Map button by default (true)', () => {
		element.clips = [{ clipId: 'a', meta: { name: 'A' }, hasSprite: false, pipelineReady: true }];

		const mapButton = element.querySelector('.clip-map');
		expect(mapButton).not.toBeNull();
	});

	test('showMapAction flag can be toggled after clips are set', () => {
		element.clips = [{ clipId: 'a', meta: { name: 'A' }, hasSprite: false, pipelineReady: true }];

		// Map button should be visible by default
		let mapButton = element.querySelector('.clip-map');
		expect(mapButton).not.toBeNull();

		// Hide the Map button
		element.showMapAction = false;
		mapButton = element.querySelector('.clip-map');
		expect(mapButton).toBeNull();

		// Show the Map button again
		element.showMapAction = true;
		mapButton = element.querySelector('.clip-map');
		expect(mapButton).not.toBeNull();
	});

	test('pianorollFilters clipId filters clips', () => {
		element.clips = [
			{ clipId: 'kick', meta: { name: 'Kick' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'snare', meta: { name: 'Snare' }, hasSprite: false, pipelineReady: true }
		];
		element.pianorollFilters = { clipId: 'kick' };
		expect(element.querySelectorAll('clip-instance').length).toBe(1);
		expect(element.querySelector('clip-instance').clip.clipId).toBe('kick');
	});

	test('pianorollFilters triggerType filters clips', () => {
		element.clips = [
			{ clipId: 'a', meta: { triggerType: 'momentary' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { triggerType: 'latch' }, hasSprite: false, pipelineReady: true }
		];
		element.pianorollFilters = { triggerType: 'latch' };
		expect(element.querySelectorAll('clip-instance').length).toBe(1);
		expect(element.querySelector('clip-instance').clip.clipId).toBe('b');
	});

	test('pianorollFilters role filters clips', () => {
		element.clips = [
			{ clipId: 'mask', meta: { role: 'bitmask' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'clip', meta: { role: '' }, hasSprite: false, pipelineReady: true }
		];
		element.pianorollFilters = { role: 'bitmask' };
		expect(element.querySelectorAll('clip-instance').length).toBe(1);
		expect(element.querySelector('clip-instance').clip.clipId).toBe('mask');
	});
});
