// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/ClipList.js';
import '../src/js/ClipCategory.js';
import '../src/js/ClipInstance.js';

describe('AkvjClipList — grouped category rendering', () => {
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

	test('renders all clips when no category filter is set', () => {
		element.clips = [
			{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { category: 'transitions', name: 'B' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'c', meta: { name: 'C' }, hasSprite: false, pipelineReady: true }
		];

		expect(element.querySelectorAll('clip-instance').length).toBe(3);
	});

	test('filters to single category when category is set', () => {
		element.clips = [
			{ clipId: 'a', meta: { category: 'effects', name: 'A' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'b', meta: { category: 'transitions', name: 'B' }, hasSprite: false, pipelineReady: true },
			{ clipId: 'c', meta: { category: 'effects', name: 'C' }, hasSprite: false, pipelineReady: true }
		];
		element.category = 'effects';

		const categories = element.querySelectorAll('clip-category');
		expect(categories.length).toBe(1);
		expect(categories[0].categoryName).toBe('effects');
		expect(element.querySelectorAll('clip-instance').length).toBe(2);
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
});
