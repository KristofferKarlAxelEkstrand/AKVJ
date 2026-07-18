import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
	createMainframeState,
	EVENT_CLIPS_CHANGED,
	EVENT_MAPPINGS_CHANGED,
	EVENT_CHANNEL_CHANGED,
	EVENT_SEARCH_CHANGED,
	EVENT_ROLE_FILTER_CHANGED,
	EVENT_SORT_MODE_CHANGED,
	EVENT_CATEGORY_CHANGED,
	EVENT_PROJECTS_CHANGED,
	EVENT_ACTIVE_PROJECT_CHANGED
} from '../src/js/mainframeState.js';

describe('MainframeState', () => {
	/** @type {import('../src/js/mainframeState.js').MainframeState} */
	let state;

	beforeEach(() => {
		state = createMainframeState();
	});

	afterEach(() => {
		state.reset();
	});

	test('initializes with default values', () => {
		expect(state.clips).toEqual([]);
		expect(state.mappings).toEqual([]);
		expect(state.projects).toEqual([]);
		expect(state.activeProjectId).toBe('default');
		expect(state.channel).toBe(1);
		expect(state.searchQuery).toBe('');
		expect(state.roleFilter).toBe('');
		expect(state.sortMode).toBe('name');
		expect(state.category).toBe('');
	});

	test('set clips dispatches clipsChanged event', () => {
		let eventDetail = null;
		state.subscribe(EVENT_CLIPS_CHANGED, event => {
			eventDetail = event.detail;
		});

		const mockClips = [{ clipId: 'c1-n0-v0', meta: {}, hasSprite: true }];
		state.clips = mockClips;

		expect(eventDetail.clips).toBe(mockClips);
		expect(state.clips).toBe(mockClips);
	});

	test('set mappings dispatches mappingsChanged event', () => {
		let eventDetail = null;
		state.subscribe(EVENT_MAPPINGS_CHANGED, event => {
			eventDetail = event.detail;
		});

		const mockMappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'c1-n60-v0' }];
		state.mappings = mockMappings;

		expect(eventDetail.mappings).toBe(mockMappings);
		expect(state.mappings).toBe(mockMappings);
	});

	test('set channel dispatches channelChanged event only on change', () => {
		let callCount = 0;
		state.subscribe(EVENT_CHANNEL_CHANGED, () => {
			callCount++;
		});

		state.channel = 5;
		expect(callCount).toBe(1);
		expect(state.channel).toBe(5);

		state.channel = 5;
		expect(callCount).toBe(1);
	});

	test('set searchQuery dispatches searchChanged event only on change', () => {
		let callCount = 0;
		state.subscribe(EVENT_SEARCH_CHANGED, () => {
			callCount++;
		});

		state.searchQuery = 'test';
		expect(callCount).toBe(1);
		expect(state.searchQuery).toBe('test');

		state.searchQuery = 'test';
		expect(callCount).toBe(1);
	});

	test('set roleFilter dispatches roleFilterChanged event only on change', () => {
		let callCount = 0;
		state.subscribe(EVENT_ROLE_FILTER_CHANGED, () => {
			callCount++;
		});

		state.roleFilter = 'bitmask';
		expect(callCount).toBe(1);
		expect(state.roleFilter).toBe('bitmask');

		state.roleFilter = 'bitmask';
		expect(callCount).toBe(1);
	});

	test('set sortMode dispatches sortModeChanged event only on change', () => {
		let callCount = 0;
		state.subscribe(EVENT_SORT_MODE_CHANGED, () => {
			callCount++;
		});

		state.sortMode = 'clipId';
		expect(callCount).toBe(1);
		expect(state.sortMode).toBe('clipId');

		state.sortMode = 'clipId';
		expect(callCount).toBe(1);
	});

	test('set category dispatches categoryChanged event only on change', () => {
		let callCount = 0;
		state.subscribe(EVENT_CATEGORY_CHANGED, () => {
			callCount++;
		});

		state.category = 'effects';
		expect(callCount).toBe(1);
		expect(state.category).toBe('effects');

		state.category = 'effects';
		expect(callCount).toBe(1);
	});

	test('subscribe returns unsubscribe function', () => {
		let callCount = 0;
		const unsubscribe = state.subscribe(EVENT_CLIPS_CHANGED, () => {
			callCount++;
		});

		state.clips = [{ clipId: 'a', meta: {}, hasSprite: false }];
		expect(callCount).toBe(1);

		unsubscribe();

		state.clips = [{ clipId: 'b', meta: {}, hasSprite: false }];
		expect(callCount).toBe(1);
	});

	test('reset restores default values without dispatching events', () => {
		let callCount = 0;
		state.subscribe(EVENT_CLIPS_CHANGED, () => {
			callCount++;
		});

		state.clips = [{ clipId: 'a', meta: {}, hasSprite: false }];
		state.channel = 5;
		state.searchQuery = 'test';
		state.roleFilter = 'bitmask';
		state.sortMode = 'clipId';
		state.category = 'effects';
		state.projects = [{ id: 'gig', name: 'Gig' }];
		state.activeProjectId = 'gig';

		state.reset();

		expect(state.clips).toEqual([]);
		expect(state.projects).toEqual([]);
		expect(state.activeProjectId).toBe('default');
		expect(state.channel).toBe(1);
		expect(state.searchQuery).toBe('');
		expect(state.roleFilter).toBe('');
		expect(state.sortMode).toBe('name');
		expect(state.category).toBe('');
		expect(callCount).toBe(1);
	});

	test('set projects dispatches projectsChanged event', () => {
		let eventDetail = null;
		state.subscribe(EVENT_PROJECTS_CHANGED, event => {
			eventDetail = event.detail;
		});

		const projects = [{ id: 'default', name: 'Default' }];
		state.projects = projects;

		expect(eventDetail.projects).toEqual(projects);
		expect(state.projects).toEqual(projects);
	});

	test('set activeProjectId dispatches only on change', () => {
		let callCount = 0;
		state.subscribe(EVENT_ACTIVE_PROJECT_CHANGED, () => {
			callCount++;
		});

		state.activeProjectId = 'gig-show';
		expect(callCount).toBe(1);
		expect(state.activeProjectId).toBe('gig-show');

		state.activeProjectId = 'gig-show';
		expect(callCount).toBe(1);
	});

	test('extends EventTarget — addEventListener works directly', () => {
		let heard = false;
		state.addEventListener(EVENT_CHANNEL_CHANGED, () => {
			heard = true;
		});

		state.channel = 3;
		expect(heard).toBe(true);
	});
});
