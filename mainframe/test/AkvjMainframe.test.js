// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import mainframeHtmlRaw from '../src/index.html?raw';
import '../src/js/AkvjMainframe.js';
import { ClipEditorController } from '../src/js/ClipEditorController.js';
import mainframeState, { EVENT_USER_MESSAGE } from '../src/js/mainframeState.js';

const MAINFRAME_MATCH = mainframeHtmlRaw.match(/<akvj-mainframe>([\s\S]*?)<\/akvj-mainframe>/);
const MAINFRAME_HTML = MAINFRAME_MATCH ? MAINFRAME_MATCH[1] : '';

function flushPromises() {
	return new Promise(resolve => setTimeout(resolve, 0));
}

function createMock2dContext() {
	return {
		imageSmoothingEnabled: false,
		clearRect: vi.fn(),
		fillRect: vi.fn(),
		drawImage: vi.fn(),
		getImageData: vi.fn((x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) })),
		putImageData: vi.fn(),
		createPattern: vi.fn(() => null),
		beginPath: vi.fn(),
		closePath: vi.fn(),
		moveTo: vi.fn(),
		lineTo: vi.fn(),
		stroke: vi.fn(),
		fill: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		translate: vi.fn(),
		scale: vi.fn(),
		clip: vi.fn()
	};
}

function createMockFetch(overrides = {}) {
	const clips = overrides.clips ?? [
		{ clipId: 'kick', meta: { name: 'Kick', frames: 10, role: 'clip' }, hasSprite: true, pipelineReady: true },
		{ clipId: 'snare', meta: { name: 'Snare', frames: 5, role: 'clip' }, hasSprite: true, pipelineReady: false }
	];
	const projects = overrides.projects ?? [
		{ id: 'default', name: 'Default' },
		{ id: 'gig-show', name: 'Gig Show' }
	];
	const activeProjectId = overrides.activeProjectId ?? 'default';
	const mapping = overrides.mapping ?? [{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }];

	return vi.fn(async (url, options = {}) => {
		const method = options.method || 'GET';
		if (url === '/api/clips') {
			return { ok: true, status: 200, json: async () => ({ clips }) };
		}
		if (url === '/api/projects') {
			if (method === 'POST') {
				return { ok: true, status: 200, json: async () => ({ project: { id: 'new-proj', name: 'New Project' } }) };
			}
			return { ok: true, status: 200, json: async () => ({ projects }) };
		}
		if (url === '/api/projects/active') {
			return { ok: true, status: 200, json: async () => ({ project: activeProjectId }) };
		}

		const keyMapMatch = url.match(/^\/api\/projects\/([^/]+)\/key-map$/);
		if (keyMapMatch) {
			if (method === 'PUT') {
				return { ok: true, status: 200, json: async () => ({}) };
			}
			return { ok: true, status: 200, json: async () => ({ mapping }) };
		}

		const activateMatch = url.match(/^\/api\/projects\/([^/]+)\/activate$/);
		if (activateMatch) {
			return { ok: true, status: 200, json: async () => ({ project: activateMatch[1] }) };
		}

		const projectMatch = url.match(/^\/api\/projects\/([^/]+)$/);
		if (projectMatch) {
			if (method === 'PUT') {
				return { ok: true, status: 200, json: async () => ({}) };
			}
			if (method === 'DELETE') {
				return { ok: true, status: 200, json: async () => ({}) };
			}
		}

		const clipMatch = url.match(/^\/api\/clips\/(.+)$/);
		if (clipMatch) {
			if (method === 'DELETE') {
				return { ok: true, status: 200, json: async () => ({}) };
			}
		}

		if (url === '/api/pipeline') {
			return { ok: true, status: 200, json: async () => ({ ok: overrides.pipelineOk ?? false }) };
		}

		return { ok: true, status: 200, json: async () => ({}) };
	});
}

describe('AkvjMainframe', () => {
	/** @type {import('../src/js/AkvjMainframe.js').default} */
	let element;
	let fetchSpy;
	let confirmSpy;

	beforeEach(async () => {
		mainframeState.reset();
		window.history.replaceState({}, '', '/');

		fetchSpy = createMockFetch();
		vi.stubGlobal('fetch', fetchSpy);

		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(type => {
			if (type === '2d') {
				return createMock2dContext();
			}
			return null;
		});

		confirmSpy = vi.fn(() => true);
		vi.stubGlobal('confirm', confirmSpy);

		document.body.innerHTML = '';
		element = document.createElement('akvj-mainframe');
		element.innerHTML = MAINFRAME_HTML;
		document.body.append(element);

		await flushPromises();
	});

	afterEach(() => {
		element.remove();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		mainframeState.reset();
		window.history.replaceState({}, '', '/');
	});

	test('connectedCallback initializes once and loads library/projects/mapping', async () => {
		expect(document.querySelector('akvj-mainframe')).toBe(element);
		const clipList = element.querySelector('#clip-list');
		const mappingTable = element.querySelector('#mapping-table');
		expect(clipList.clips.length).toBe(2);
		expect(mappingTable.mappings).toEqual([{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }]);
		expect(window.location.pathname).toBe('/library');
	});

	test('connectedCallback guard prevents re-initialization on the same attachment', () => {
		const startSpy = vi.spyOn(ClipEditorController.prototype, 'bindEventListeners');
		element.connectedCallback();
		expect(startSpy).not.toHaveBeenCalled();
	});

	test('disconnectedCallback unsubscribes state listeners and resets router', () => {
		const projectChooser = element.querySelector('#project-chooser');
		element.remove();
		mainframeState.projects = [{ id: 'changed', name: 'Changed' }];
		expect(projectChooser.projects).toEqual([
			{ id: 'default', name: 'Default' },
			{ id: 'gig-show', name: 'Gig Show' }
		]);
	});

	test('tab navigation switches panels and updates aria-selected', async () => {
		const mappingTab = element.querySelector('.tab[data-tab="mapping"]');
		mappingTab.click();
		await flushPromises();

		const libraryPanel = element.querySelector('#panel-library');
		const mappingPanel = element.querySelector('#panel-mapping');
		expect(libraryPanel.hidden).toBe(true);
		expect(mappingPanel.hidden).toBe(false);
		expect(mappingTab.classList.contains('is-active')).toBe(true);
		expect(mappingTab.getAttribute('aria-selected')).toBe('true');
	});

	test('header renders with brand and navigation tabs', () => {
		const header = element.querySelector('.mainframe-header');
		const brand = element.querySelector('.mainframe-brand');
		const tabs = element.querySelectorAll('.mainframe-header .tab');
		expect(header).not.toBeNull();
		expect(brand).not.toBeNull();
		expect(tabs.length).toBeGreaterThanOrEqual(4);
	});

	test('/settings route shows the settings panel', async () => {
		window.history.pushState({}, '', '/settings');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await flushPromises();

		expect(window.location.pathname).toBe('/settings');
		expect(element.querySelector('#panel-settings').hidden).toBe(false);
		expect(element.querySelector('#panel-library').hidden).toBe(true);
	});

	test('/clip/edit route resets the clip editor', async () => {
		const resetSpy = vi.spyOn(ClipEditorController.prototype, 'reset');
		window.history.pushState({}, '', '/clip/edit');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await flushPromises();
		expect(window.location.pathname).toBe('/clip/edit');
		expect(resetSpy).toHaveBeenCalled();
	});

	test('/clip/edit/:clipId calls clipEditor.hydrate', async () => {
		const hydrateSpy = vi.spyOn(ClipEditorController.prototype, 'hydrate').mockImplementation(async () => {});
		window.history.pushState({}, '', '/clip/edit/bad%2Fid');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await flushPromises();
		expect(window.location.pathname).toBe('/clip/edit/bad%2Fid');
		expect(hydrateSpy).toHaveBeenCalledWith('bad/id');
	});

	test('/clip/new/:clipId redirects and hydrates', async () => {
		const hydrateSpy = vi.spyOn(ClipEditorController.prototype, 'hydrate').mockImplementation(async () => {});
		window.history.pushState({}, '', '/clip/new/bad%2Fid');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await flushPromises();
		expect(window.location.pathname).toBe('/clip/edit/bad%2Fid');
		expect(hydrateSpy).toHaveBeenCalledWith('bad/id');
	});

	test('library search/role/sort inputs propagate to mainframeState', () => {
		const searchInput = element.querySelector('#clip-search');
		searchInput.value = 'kick';
		searchInput.dispatchEvent(new Event('input'));
		expect(mainframeState.searchQuery).toBe('kick');

		const roleChoices = element.querySelector('#clip-role-filter');
		const clipRoleChoice = [...roleChoices.children].find(child => child.textContent === 'Clip');
		clipRoleChoice?.click();
		expect(mainframeState.roleFilter).toBe('clip');

		const sortChoices = element.querySelector('#clip-sort');
		const idSortChoice = [...sortChoices.children].find(child => child.textContent === 'ID');
		idSortChoice?.click();
		expect(mainframeState.sortMode).toBe('clipId');
	});

	test('renderLibrary reflects pipelineReady counts and incomplete class', async () => {
		const summary = element.querySelector('#clip-summary');
		expect(summary.textContent).toBe('2 clips · 1 ready · 1 incomplete');
		expect(summary.classList.contains('clip-summary--has-incomplete')).toBe(true);
	});

	test('fillClipSelect only includes clips with hasSprite and pipelineReady', () => {
		const select = element.querySelector('#map-clip-id');
		const options = [...select.options].map(option => option.value);
		expect(options).toContain('kick');
		expect(options).not.toContain('snare');
	});

	test('mappingPianoRoll channelchange updates mainframeState and form', () => {
		const pianoRoll = element.querySelector('#mapping-piano-roll');
		const channelSelect = pianoRoll.querySelector('select.piano-roll-channel');
		channelSelect.value = '5';
		channelSelect.dispatchEvent(new Event('change'));
		expect(mainframeState.channel).toBe(5);
		expect(element.querySelector('#map-channel').value).toBe('5');
	});

	test('mappingPianoRoll keyclick select populates the mapping form', () => {
		const pianoRoll = element.querySelector('#mapping-piano-roll');
		pianoRoll.dispatchEvent(
			new CustomEvent('keyclick', {
				bubbles: true,
				detail: { note: 60, velocity: 64, clipId: 'kick', action: 'select', isActive: true, mode: 'edit', mappings: [] }
			})
		);
		expect(element.querySelector('#map-note').value).toBe('60');
		expect(element.querySelector('#map-velocity').value).toBe('64');
		expect(element.querySelector('#map-clip-id').value).toBe('kick');
	});

	test('mappingPianoRoll mappingadd updates mainframeState.mappings', () => {
		mainframeState.mappings = [];
		const pianoRoll = element.querySelector('#mapping-piano-roll');
		pianoRoll.dispatchEvent(
			new CustomEvent('mappingadd', {
				bubbles: true,
				detail: { channel: 1, note: 62, clipId: 'kick', velocity: 0, mappings: [{ clipId: 'kick', velocity: 0 }] }
			})
		);
		expect(mainframeState.mappings).toContainEqual({ channel: 1, note: 62, clipId: 'kick', velocity: 0 });
		const status = element.querySelector('#mapping-status');
		expect(status.textContent).toContain('Dropped kick @ note 62');
		expect(status.classList.contains('is-ok')).toBe(true);
	});

	test('mappingTable mappingremove removes the mapping', () => {
		const mappingTable = element.querySelector('#mapping-table');
		mappingTable.dispatchEvent(
			new CustomEvent('mappingremove', {
				bubbles: true,
				detail: { channel: 1, note: 60, velocity: 0, clipId: 'kick' }
			})
		);
		expect(mainframeState.mappings).toHaveLength(0);
	});

	test('libraryPianoRoll keyclick active with one mapping filters clip list', () => {
		mainframeState.mappings = [{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }];
		const clipList = element.querySelector('#clip-list');
		clipList.clips = mainframeState.clips;
		const libraryPianoRoll = element.querySelector('#library-piano-roll');
		libraryPianoRoll.dispatchEvent(
			new CustomEvent('keyclick', {
				bubbles: true,
				detail: { note: 60, isActive: true, mappings: [{ clipId: 'kick' }] }
			})
		);
		expect(clipList.searchQuery).toBe('kick');
	});

	test('libraryPianoRoll pianoroll:filter-changed updates clip list filters', () => {
		mainframeState.mappings = [];
		mainframeState.clips = [
			{ clipId: 'kick', meta: { triggerType: 'momentary' }, hasSprite: true, pipelineReady: true },
			{ clipId: 'snare', meta: { triggerType: 'latch' }, hasSprite: true, pipelineReady: true }
		];
		const clipList = element.querySelector('#clip-list');
		clipList.clips = mainframeState.clips;
		const libraryPianoRoll = element.querySelector('#library-piano-roll');
		libraryPianoRoll.dispatchEvent(
			new CustomEvent('pianoroll:filter-changed', {
				bubbles: true,
				detail: { filters: { triggerType: 'momentary' } }
			})
		);
		expect(mainframeState.pianorollFilters.triggerType).toBe('momentary');
		expect(clipList.pianorollFilters.triggerType).toBe('momentary');
	});

	test('add-mapping button adds a mapping', () => {
		mainframeState.mappings = [];
		element.querySelector('#map-clip-id').value = 'kick';
		element.querySelector('#map-channel').value = '3';
		element.querySelector('#map-note').value = '48';
		element.querySelector('#map-velocity').value = '10';
		element.querySelector('#add-mapping').click();
		expect(mainframeState.mappings).toContainEqual({ channel: 3, note: 48, velocity: 10, clipId: 'kick' });
	});

	test('save-mapping button PUTs the mapping and updates status', async () => {
		const saveButton = element.querySelector('#save-mapping');
		saveButton.click();
		await flushPromises();
		const status = element.querySelector('#mapping-status');
		expect(status.textContent).toBe('Mapping saved');
		expect(status.classList.contains('is-ok')).toBe(true);
		expect(fetchSpy).toHaveBeenCalledWith('/api/projects/default/key-map', expect.objectContaining({ method: 'PUT' }));
	});

	test('reload-mapping button reloads the mapping', async () => {
		mainframeState.mappings = [];
		element.querySelector('#reload-mapping').click();
		await flushPromises();
		expect(mainframeState.mappings).toEqual([{ channel: 1, note: 60, velocity: 0, clipId: 'kick' }]);
	});

	test('run-pipeline button confirms and posts to /api/pipeline', async () => {
		const status = element.querySelector('#mapping-status');
		element.querySelector('#run-pipeline').click();
		await flushPromises();
		expect(confirmSpy).toHaveBeenCalled();
		expect(fetchSpy).toHaveBeenCalledWith('/api/pipeline', expect.objectContaining({ method: 'POST' }));
		expect(status.textContent).toBe('Pipeline failed');
		expect(status.classList.contains('is-err')).toBe(true);
	});

	test('refresh-library button reloads clips', async () => {
		fetchSpy.mockClear();
		element.querySelector('#refresh-library').click();
		await flushPromises();
		expect(fetchSpy).toHaveBeenCalledWith('/api/clips', expect.any(Object));
	});

	test('clipdelete event deletes the clip and reloads the library', async () => {
		const clipList = element.querySelector('#clip-list');
		clipList.dispatchEvent(new CustomEvent('clipdelete', { bubbles: true, detail: { clipId: 'kick' } }));
		await flushPromises();
		expect(confirmSpy).toHaveBeenCalledWith('Delete clip "kick"? This removes it from the bucket.');
		expect(fetchSpy).toHaveBeenCalledWith('/api/clips/kick', expect.objectContaining({ method: 'DELETE' }));
		expect(fetchSpy).toHaveBeenCalledWith('/api/clips', expect.any(Object));
	});

	test('clipmap event switches to mapping tab and selects the clip', async () => {
		const clipList = element.querySelector('#clip-list');
		clipList.dispatchEvent(new CustomEvent('clipmap', { bubbles: true, detail: { clipId: 'kick' } }));
		await flushPromises();
		expect(window.location.pathname).toBe('/key-map');
		expect(element.querySelector('#panel-mapping').hidden).toBe(false);
		expect(element.querySelector('#map-clip-id').value).toBe('kick');
	});

	test('clipedit event opens the clip editor for the given clip', async () => {
		const hydrateSpy = vi.spyOn(ClipEditorController.prototype, 'hydrate').mockImplementation(async () => {});
		const clipList = element.querySelector('#clip-list');
		clipList.dispatchEvent(new CustomEvent('clipedit', { bubbles: true, detail: { clipId: 'bad/id' } }));
		await flushPromises();
		expect(window.location.pathname).toBe('/clip/edit/bad%2Fid');
		expect(hydrateSpy).toHaveBeenCalledWith('bad/id');
	});

	test('projectChooser projectactivate activates project and reloads mapping', async () => {
		const projectChooser = element.querySelector('#project-chooser');
		projectChooser.dispatchEvent(new CustomEvent('projectactivate', { bubbles: true, detail: { projectId: 'gig-show' } }));
		await flushPromises();
		expect(fetchSpy).toHaveBeenCalledWith('/api/projects/gig-show/activate', expect.objectContaining({ method: 'POST' }));
		expect(mainframeState.activeProjectId).toBe('gig-show');
		const status = element.querySelector('#projects-status');
		expect(status.textContent).toBe('Active project: gig-show');
		expect(status.classList.contains('is-ok')).toBe(true);
	});

	test('projectChooser projectcreate posts and activates the new project', async () => {
		const projectChooser = element.querySelector('#project-chooser');
		projectChooser.dispatchEvent(new CustomEvent('projectcreate', { bubbles: true, detail: { name: 'Festival', copyFrom: 'default' } }));
		await flushPromises();
		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/projects',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('"name":"Festival"')
			})
		);
		const status = element.querySelector('#projects-status');
		expect(status.textContent).toBe('Created project new-proj');
	});

	test('projectChooser projectrename PUTs the update', async () => {
		const projectChooser = element.querySelector('#project-chooser');
		projectChooser.dispatchEvent(new CustomEvent('projectrename', { bubbles: true, detail: { projectId: 'gig-show', name: 'Festival' } }));
		await flushPromises();
		expect(fetchSpy).toHaveBeenCalledWith(
			'/api/projects/gig-show',
			expect.objectContaining({
				method: 'PUT',
				body: expect.stringContaining('"name":"Festival"')
			})
		);
		const status = element.querySelector('#projects-status');
		expect(status.textContent).toBe('Renamed project gig-show');
	});

	test('projectChooser projectdelete guards default project', async () => {
		const projectChooser = element.querySelector('#project-chooser');
		projectChooser.dispatchEvent(new CustomEvent('projectdelete', { bubbles: true, detail: { projectId: 'default' } }));
		await flushPromises();
		const status = element.querySelector('#projects-status');
		expect(status.textContent).toBe('Cannot delete the default project');
		expect(status.classList.contains('is-err')).toBe(true);
		expect(confirmSpy).not.toHaveBeenCalled();
	});

	test('projectChooser projectdelete removes non-default project', async () => {
		const projectChooser = element.querySelector('#project-chooser');
		projectChooser.dispatchEvent(new CustomEvent('projectdelete', { bubbles: true, detail: { projectId: 'gig-show' } }));
		await flushPromises();
		expect(confirmSpy).toHaveBeenCalledWith('Delete project "gig-show"? This cannot be undone.');
		expect(fetchSpy).toHaveBeenCalledWith('/api/projects/gig-show', expect.objectContaining({ method: 'DELETE' }));
	});

	test('boot API error reports a user message', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		mainframeState.reset();
		window.history.replaceState({}, '', '/');
		fetchSpy.mockImplementation(async (url, _options = {}) => {
			if (url === '/api/clips') {
				return { ok: false, status: 500, json: async () => ({ error: 'boom' }) };
			}
			return { ok: true, status: 200, json: async () => ({}) };
		});

		let message = null;
		const unsubscribe = mainframeState.subscribe(EVENT_USER_MESSAGE, event => {
			message = event.detail;
		});

		element.remove();
		document.body.innerHTML = '';
		element = document.createElement('akvj-mainframe');
		element.innerHTML = MAINFRAME_HTML;
		document.body.append(element);
		await flushPromises();

		expect(message).not.toBeNull();
		expect(message.text).toContain('API error');
		expect(message.text).toContain('boom');
		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
		unsubscribe();
	});
});
