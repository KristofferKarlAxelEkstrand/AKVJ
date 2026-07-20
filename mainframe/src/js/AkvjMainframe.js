import '../scss/main.scss';
import './PianoKey.js';
import './PianoRoll.js';
import './ClipList.js';
import { ClipEditorController } from './ClipEditorController.js';
import './MappingTable.js';
import './StagingPreview.js';
import './PreviewClip.js';
import './ClipFrame.js';
import './ClipFrames.js';
import './ClipFramesUploadPanel.js';
import './UserMessage.js';
import './UserMessages.js';
import './ClipNameInput.js';
import './SortChoice.js';
import './SortChoices.js';
import './RoleChoice.js';
import './RoleChoices.js';
import './ProjectChooser.js';
import { api } from './apiClient.js';
import { SimpleRouter } from './SimpleRouter.js';
import { editClipPath } from './clipEditorRoute.js';
import mainframeState, { EVENT_CLIPS_CHANGED, EVENT_MAPPINGS_CHANGED, EVENT_CHANNEL_CHANGED, EVENT_SEARCH_CHANGED, EVENT_ROLE_FILTER_CHANGED, EVENT_SORT_MODE_CHANGED, EVENT_PIANOROLL_FILTERS_CHANGED, EVENT_PROJECTS_CHANGED, EVENT_ACTIVE_PROJECT_CHANGED } from './mainframeState.js';
import { reportBootApiError, reportFailedClipDelete, reportFailedClipOpen } from './shellUserFeedback.js';

/**
 * AkvjMainframe — custom element that bootstraps the entire Mainframe UI.
 *
 * All initialization logic (DOM queries, event listeners, router setup,
 * state subscriptions, data loading) lives in `connectedCallback`.
 * Cleanup is handled in `disconnectedCallback`.
 *
 * @extends HTMLElement
 */
class AkvjMainframe extends HTMLElement {
	/** @type {SimpleRouter|null} */
	#router = null;
	/** @type {Array<Function>} */
	#unsubscribers = [];
	#isInitialized = false;

	connectedCallback() {
		if (this.#isInitialized) {
			return;
		}
		this.#isInitialized = true;

		// Ensure nested custom elements are upgraded before we query them.
		if (typeof customElements !== 'undefined' && customElements.upgrade) {
			customElements.upgrade(this);
		}

		const root = this;

		/** @type {import('./ClipEditorController.js').ClipEditorController|null} */
		let clipEditor = null;

		const panels = {
			library: root.querySelector('#panel-library'),
			editor: root.querySelector('#panel-clip-editor'),
			mapping: root.querySelector('#panel-mapping'),
			projects: root.querySelector('#panel-projects'),
			settings: root.querySelector('#panel-settings')
		};

		const clipListElement = root.querySelector('#clip-list');
		const mappingClipListElement = root.querySelector('#mapping-clip-list');
		const mappingTableElement = root.querySelector('#mapping-table');
		const libraryPianoRoll = root.querySelector('#library-piano-roll');
		const mappingPianoRoll = root.querySelector('#mapping-piano-roll');

		const clipSearchInput = root.querySelector('#clip-search');
		clipSearchInput.addEventListener('input', () => {
			libraryPianoRoll.clearSelection();
			mainframeState.searchQuery = clipSearchInput.value.trim().toLowerCase();
		});

		const clipRoleChoices = root.querySelector('#clip-role-filter');
		clipRoleChoices.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];
		clipRoleChoices.addEventListener('rolechange', event => {
			mainframeState.roleFilter = event.detail.roleFilter;
		});

		const clipSortChoices = root.querySelector('#clip-sort');
		clipSortChoices.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'clipId', label: 'ID' },
			{ value: 'role', label: 'Role' },
			{ value: 'frames', label: 'Frames' }
		];
		clipSortChoices.addEventListener('sortchange', event => {
			mainframeState.sortMode = event.detail.sortMode;
		});

		const clearFiltersButton = root.querySelector('#clear-filters');
		clearFiltersButton.addEventListener('click', () => {
			mainframeState.searchQuery = '';
			mainframeState.roleFilter = '';
			mainframeState.sortMode = 'name';
			mainframeState.pianorollFilters = {};
			clipSearchInput.value = '';
			clipRoleChoices.roleFilter = '';
			clipSortChoices.sortMode = 'name';
			libraryPianoRoll.clearSelection();
			libraryPianoRoll.resetFilters();
		});

		// Mapping clip list - independent filter/search/sort state
		const mappingClipSearchInput = root.querySelector('#mapping-clip-search');
		let mappingSearchQuery = '';
		let mappingRoleFilter = '';
		let mappingSortMode = 'name';

		mappingClipSearchInput.addEventListener('input', () => {
			mappingPianoRoll.clearSelection();
			mappingSearchQuery = mappingClipSearchInput.value.trim().toLowerCase();
			mappingClipListElement.searchQuery = mappingSearchQuery;
			updateMappingFilterVisibility();
		});

		const mappingClipRoleChoices = root.querySelector('#mapping-clip-role-filter');
		mappingClipRoleChoices.choices = [
			{ value: '', label: 'All' },
			{ value: 'clip', label: 'Clip' },
			{ value: 'bitmask', label: 'Bitmask' }
		];
		mappingClipRoleChoices.addEventListener('rolechange', event => {
			mappingRoleFilter = event.detail.roleFilter;
			mappingClipListElement.roleFilter = mappingRoleFilter;
			updateMappingFilterVisibility();
		});

		const mappingClipSortChoices = root.querySelector('#mapping-clip-sort');
		mappingClipSortChoices.choices = [
			{ value: 'name', label: 'Name' },
			{ value: 'clipId', label: 'ID' },
			{ value: 'role', label: 'Role' },
			{ value: 'frames', label: 'Frames' }
		];
		mappingClipSortChoices.addEventListener('sortchange', event => {
			mappingSortMode = event.detail.sortMode;
			mappingClipListElement.sortMode = mappingSortMode;
		});

		const mappingClearFiltersButton = root.querySelector('#mapping-clear-filters');
		mappingClearFiltersButton.addEventListener('click', () => {
			mappingSearchQuery = '';
			mappingRoleFilter = '';
			mappingSortMode = 'name';
			mappingClipSearchInput.value = '';
			mappingClipRoleChoices.roleFilter = '';
			mappingClipSortChoices.sortMode = 'name';
			mappingPianoRoll.clearSelection();
			mappingClipListElement.searchQuery = '';
			mappingClipListElement.roleFilter = '';
			mappingClipListElement.sortMode = 'name';
			updateMappingFilterVisibility();
		});

		function updateMappingFilterVisibility() {
			const hasActiveFilter = mappingSearchQuery !== '' || mappingRoleFilter !== '';
			mappingClearFiltersButton.hidden = !hasActiveFilter;
		}

		clipListElement.addEventListener('clipsaved', _event => {
			loadLibrary().catch(error => console.error(error));
		});

		clipListElement.addEventListener('clipdelete', event => {
			deleteClip(event.detail.clipId);
		});

		clipListElement.addEventListener('clipmap', event => {
			mapClipFromLibrary(event.detail.clipId);
		});

		mappingClipListElement.addEventListener('clipmap', event => {
			mapClipFromLibrary(event.detail.clipId);
		});

		mappingClipListElement.addEventListener('clipedit', event => {
			clipEditor.open(event.detail.clipId);
		});

		mappingClipListElement.addEventListener('clipdelete', event => {
			deleteClip(event.detail.clipId);
		});

		function updateFilterVisibility() {
			const hasPianorollFilters = Object.values(mainframeState.pianorollFilters).some(value => value !== '' && value !== false);
			const hasActiveFilter = mainframeState.searchQuery !== '' || mainframeState.roleFilter !== '' || hasPianorollFilters;
			clearFiltersButton.hidden = !hasActiveFilter;
		}

		function setStatus(statusElement, message, statusClass = '') {
			statusElement.textContent = message;
			statusElement.classList.remove('is-ok', 'is-err');
			if (statusClass) {
				statusElement.classList.add(statusClass);
			}
		}

		const TAB_TO_ROUTE = {
			library: '/library',
			editor: '/clip/edit',
			mapping: '/key-map',
			projects: '/projects',
			settings: '/settings'
		};

		const router = new SimpleRouter();
		this.#router = router;

		function showView(tabName) {
			for (const [name, panel] of Object.entries(panels)) {
				const active = name === tabName;
				panel.hidden = !active;
				panel.classList.toggle('is-active', active);
			}
			for (const btn of root.querySelectorAll('.tab')) {
				const active = btn.dataset.tab === tabName;
				btn.classList.toggle('is-active', active);
				btn.setAttribute('aria-selected', active ? 'true' : 'false');
			}
		}

		router.add('/library', () => showView('library'));
		router.add('/clip/edit', () => {
			showView('editor');
			clipEditor?.reset();
		});
		router.add('/clip/edit/:clipId', (_path, params) => {
			showView('editor');
			clipEditor?.hydrate(params.clipId).catch(error => {
				console.error(error);
				reportFailedClipOpen(error);
			});
		});
		router.add('/clip/new', () => router.replace('/clip/edit'));
		router.add('/clip/new/:clipId', (_path, params) => {
			router.replace(editClipPath(params.clipId));
		});
		router.add('/key-map', () => showView('mapping'));
		router.add('/projects', () => showView('projects'));
		router.add('/settings', () => showView('settings'));
		router.setNotFound(() => router.replace('/library'));

		function switchTab(tabName) {
			const route = TAB_TO_ROUTE[tabName] || '/library';
			router.navigate(route);
		}

		function mapClipFromLibrary(clipId) {
			switchTab('mapping');
			const select = root.querySelector('#map-clip-id');
			if ([...select.options].some(option => option.value === clipId)) {
				select.value = clipId;
			}
		}

		function renderLibrary() {
			clipListElement.clips = mainframeState.clips;
			updateClipSummary();
			updateFilterVisibility();
		}

		function renderMappingClipList() {
			mappingClipListElement.clips = mainframeState.clips;
			mappingClipListElement.showMapAction = false;
		}

		function updateClipSummary() {
			const summary = root.querySelector('#clip-summary');
			const total = mainframeState.clips.length;
			const ready = mainframeState.clips.filter(clip => clip.pipelineReady).length;
			const incomplete = total - ready;
			if (total === 0) {
				summary.textContent = '';
				summary.className = 'clip-summary';
				return;
			}
			summary.textContent = `${total} clip${total === 1 ? '' : 's'} · ${ready} ready${incomplete > 0 ? ` · ${incomplete} incomplete` : ''}`;
			summary.className = `clip-summary ${incomplete > 0 ? 'clip-summary--has-incomplete' : 'clip-summary--all-ready'}`;
		}

		async function deleteClip(clipId) {
			if (!confirm(`Delete clip "${clipId}"? This removes it from the bucket.`)) {
				return;
			}
			try {
				await api(`/clips/${encodeURIComponent(clipId)}`, { method: 'DELETE' });
				await loadLibrary();
			} catch (error) {
				reportFailedClipDelete(clipId, error);
				console.error(error);
			}
		}

		function fillClipSelect() {
			const select = root.querySelector('#map-clip-id');
			select.replaceChildren();
			for (const clip of mainframeState.clips.filter(clip => clip.pipelineReady !== false && clip.hasSprite)) {
				const option = document.createElement('option');
				option.value = clip.clipId;
				option.textContent = clip.clipId;
				select.append(option);
			}
		}

		function renderMapping() {
			mappingTableElement.mappings = mainframeState.mappings;
			mappingTableElement.clipCatalog = mainframeState.clips;
			updatePianoRolls();
		}

		mappingTableElement.addEventListener('mappingremove', event => {
			const { channel, note, velocity } = event.detail;
			mainframeState.mappings = mainframeState.mappings.filter(existingEntry => !(existingEntry.channel === channel && existingEntry.note === note && existingEntry.velocity === velocity));
		});

		mappingPianoRoll.addEventListener('mappingchange', event => {
			const { channel, note, oldVelocity, newVelocity, clipId } = event.detail;
			mainframeState.mappings = mainframeState.mappings.map(entry => {
				if (entry.channel === channel && entry.note === note && entry.velocity === oldVelocity && entry.clipId === clipId) {
					return { ...entry, velocity: newVelocity };
				}
				return entry;
			});
			const status = root.querySelector('#mapping-status');
			setStatus(status, `Breakpoint ${clipId} → vel ${newVelocity}`, 'is-ok');
		});

		mappingPianoRoll.addEventListener('mappingremove', event => {
			const { channel, note, clipId, velocity, mappings } = event.detail;
			const others = mainframeState.mappings.filter(entry => !(entry.channel === channel && entry.note === note));
			mainframeState.mappings = others.concat(
				mappings.map(entry => ({
					channel,
					note,
					clipId: entry.clipId,
					velocity: entry.velocity
				}))
			);
			const status = root.querySelector('#mapping-status');
			setStatus(status, `Removed ${clipId} @ note ${note} vel ${velocity}`, 'is-ok');
		});

		mappingPianoRoll.addEventListener('mappingadd', event => {
			const { channel, note, clipId, velocity, mappings } = event.detail;
			const others = mainframeState.mappings.filter(entry => !(entry.channel === channel && entry.note === note));
			mainframeState.mappings = others.concat(
				mappings.map(entry => ({
					channel,
					note,
					clipId: entry.clipId,
					velocity: entry.velocity
				}))
			);
			const status = root.querySelector('#mapping-status');
			setStatus(status, `Dropped ${clipId} @ note ${note} vel ${velocity}`, 'is-ok');
		});

		mappingPianoRoll.addEventListener('keyclick', event => {
			const { note, velocity, clipId: bandClipId, action } = event.detail;
			const mapChannel = root.querySelector('#map-channel');
			const mapNote = root.querySelector('#map-note');
			const mapVelocity = root.querySelector('#map-velocity');
			const mapClipId = root.querySelector('#map-clip-id');
			const status = root.querySelector('#mapping-status');

			if (action === 'select') {
				mapChannel.value = String(mainframeState.channel);
				mapNote.value = String(note);
				mapVelocity.value = String(velocity ?? 0);
				if (bandClipId && [...mapClipId.options].some(option => option.value === bandClipId)) {
					mapClipId.value = bandClipId;
				}
				setStatus(status, `Selected ${bandClipId} @ note ${note} vel ${velocity}`, 'is-ok');
				return;
			}

			const clipId = mapClipId.value;
			if (!clipId) {
				setStatus(status, 'Select a clip first', 'is-err');
				return;
			}
			const assignVelocity = Number(mapVelocity.value) || 0;
			const updatedMappings = mainframeState.mappings.filter(existingEntry => !(existingEntry.channel === mainframeState.channel && existingEntry.note === note && existingEntry.velocity === assignVelocity)).concat([{ channel: mainframeState.channel, note, velocity: assignVelocity, clipId }]);
			mainframeState.mappings = updatedMappings;
			mapNote.value = String(note);
			mapChannel.value = String(mainframeState.channel);
		});

		libraryPianoRoll.addEventListener('keyclick', event => {
			const { mappings, isActive } = event.detail;
			if (isActive && mappings?.length === 1) {
				clipListElement.searchQuery = mappings[0].clipId;
			} else {
				clipListElement.searchQuery = mainframeState.searchQuery;
			}
		});

		libraryPianoRoll.addEventListener('pianoroll:filter-changed', event => {
			mainframeState.pianorollFilters = event.detail.filters;
		});

		mappingPianoRoll.addEventListener('channelchange', event => {
			mainframeState.channel = event.detail.channel;
			root.querySelector('#map-channel').value = String(event.detail.channel);
		});

		function updatePianoRolls() {
			// Mappings are shared; each roll keeps its own channel.
			libraryPianoRoll.mappings = mainframeState.mappings;
			mappingPianoRoll.mappings = mainframeState.mappings;
		}

		function updatePianoRollClips() {
			libraryPianoRoll.clips = mainframeState.clips;
			mappingPianoRoll.clips = mainframeState.clips;
		}

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_CLIPS_CHANGED, () => {
				renderLibrary();
				renderMappingClipList();
				fillClipSelect();
				updatePianoRollClips();
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_MAPPINGS_CHANGED, () => {
				renderMapping();
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_CHANNEL_CHANGED, event => {
				mappingPianoRoll.channel = event.detail.channel;
				root.querySelector('#map-channel').value = String(event.detail.channel);
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_SEARCH_CHANGED, event => {
				clipListElement.searchQuery = event.detail.searchQuery;
				updateFilterVisibility();
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_ROLE_FILTER_CHANGED, event => {
				clipListElement.roleFilter = event.detail.roleFilter;
				clipRoleChoices.roleFilter = event.detail.roleFilter;
				updateFilterVisibility();
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_SORT_MODE_CHANGED, event => {
				clipListElement.sortMode = event.detail.sortMode;
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_PIANOROLL_FILTERS_CHANGED, event => {
				clipListElement.pianorollFilters = event.detail.filters;
				updateFilterVisibility();
			})
		);

		async function loadLibrary() {
			const libraryResponse = await api('/clips');
			mainframeState.clips = libraryResponse.clips;
		}

		function projectKeyMapPath(projectId = mainframeState.activeProjectId) {
			return `/projects/${encodeURIComponent(projectId)}/key-map`;
		}

		function updateMappingProjectLabel() {
			const label = root.querySelector('#mapping-project-label');
			if (!label) {
				return;
			}
			const active = mainframeState.projects.find(project => project.id === mainframeState.activeProjectId);
			label.textContent = active ? `${active.name} (${active.id})` : mainframeState.activeProjectId;
		}

		async function loadMapping() {
			const mappingResponse = await api(projectKeyMapPath());
			mainframeState.mappings = mappingResponse.mapping;
			updateMappingProjectLabel();
		}

		async function loadProjects() {
			const [listResponse, activeResponse] = await Promise.all([api('/projects'), api('/projects/active')]);
			mainframeState.projects = listResponse.projects;
			mainframeState.activeProjectId = activeResponse.project;
			updateMappingProjectLabel();
		}

		const projectChooser = root.querySelector('#project-chooser');
		const projectsStatus = root.querySelector('#projects-status');

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_PROJECTS_CHANGED, event => {
				projectChooser.projects = event.detail.projects;
			})
		);

		this.#unsubscribers.push(
			mainframeState.subscribe(EVENT_ACTIVE_PROJECT_CHANGED, event => {
				projectChooser.activeProjectId = event.detail.activeProjectId;
				updateMappingProjectLabel();
			})
		);

		projectChooser.addEventListener('projectactivate', event => {
			activateProject(event.detail.projectId).catch(error => setStatus(projectsStatus, error.message, 'is-err'));
		});

		projectChooser.addEventListener('projectcreate', event => {
			createProjectFromUi(event.detail).catch(error => setStatus(projectsStatus, error.message, 'is-err'));
		});

		projectChooser.addEventListener('projectrename', event => {
			renameProject(event.detail.projectId, event.detail.name).catch(error => setStatus(projectsStatus, error.message, 'is-err'));
		});

		projectChooser.addEventListener('projectdelete', event => {
			deleteProjectFromUi(event.detail.projectId).catch(error => setStatus(projectsStatus, error.message, 'is-err'));
		});

		async function activateProject(projectId) {
			setStatus(projectsStatus, 'Switching project…');
			try {
				const result = await api(`/projects/${encodeURIComponent(projectId)}/activate`, {
					method: 'POST',
					body: '{}'
				});
				mainframeState.activeProjectId = result.project;
				await loadMapping();
				setStatus(projectsStatus, `Active project: ${result.project}`, 'is-ok');
			} catch (error) {
				projectChooser.activeProjectId = mainframeState.activeProjectId;
				throw error;
			}
		}

		async function createProjectFromUi({ name, copyFrom }) {
			setStatus(projectsStatus, 'Creating project…');
			const body = { name };
			if (copyFrom === null) {
				body.copyFrom = null;
			} else if (copyFrom) {
				body.copyFrom = copyFrom;
			}
			const result = await api('/projects', {
				method: 'POST',
				body: JSON.stringify(body)
			});
			await loadProjects();
			await activateProject(result.project.id);
			setStatus(projectsStatus, `Created project ${result.project.id}`, 'is-ok');
		}

		async function renameProject(projectId, name) {
			setStatus(projectsStatus, 'Renaming…');
			await api(`/projects/${encodeURIComponent(projectId)}`, {
				method: 'PUT',
				body: JSON.stringify({ name })
			});
			await loadProjects();
			setStatus(projectsStatus, `Renamed project ${projectId}`, 'is-ok');
		}

		async function deleteProjectFromUi(projectId) {
			if (projectId === 'default') {
				setStatus(projectsStatus, 'Cannot delete the default project', 'is-err');
				return;
			}
			if (!confirm(`Delete project "${projectId}"? This cannot be undone.`)) {
				return;
			}
			setStatus(projectsStatus, 'Deleting…');
			await api(`/projects/${encodeURIComponent(projectId)}`, { method: 'DELETE' });
			await loadProjects();
			await loadMapping();
			setStatus(projectsStatus, `Deleted project ${projectId}`, 'is-ok');
		}

		for (const btn of root.querySelectorAll('.tab')) {
			btn.addEventListener('click', event => {
				event.preventDefault();
				switchTab(btn.dataset.tab);
			});
		}

		root.querySelector('#refresh-library').addEventListener('click', () => {
			loadLibrary().catch(error => console.error(error));
		});

		queueMicrotask(() => {
			clipEditor = new ClipEditorController({
				setStatus,
				onLibraryChanged: () => loadLibrary(),
				router
			});
			clipEditor.bindEventListeners();
		});

		clipListElement.addEventListener('clipedit', event => {
			clipEditor?.open(event.detail.clipId);
		});

		root.querySelector('#add-mapping').addEventListener('click', () => {
			const channel = Number(root.querySelector('#map-channel').value);
			const note = Number(root.querySelector('#map-note').value);
			const velocity = Number(root.querySelector('#map-velocity').value);
			const clipId = root.querySelector('#map-clip-id').value;
			if (!clipId) {
				return;
			}
			const updatedMappings = mainframeState.mappings.filter(existingEntry => !(existingEntry.channel === channel && existingEntry.note === note && existingEntry.velocity === velocity)).concat([{ channel, note, velocity, clipId }]);
			mainframeState.mappings = updatedMappings;
		});

		root.querySelector('#reload-mapping').addEventListener('click', () => {
			loadMapping().catch(error => setStatus(root.querySelector('#mapping-status'), error.message, 'is-err'));
		});

		root.querySelector('#save-mapping').addEventListener('click', async () => {
			const status = root.querySelector('#mapping-status');
			setStatus(status, 'Saving…');
			try {
				await api(projectKeyMapPath(), { method: 'PUT', body: JSON.stringify({ mapping: mainframeState.mappings }) });
				setStatus(status, 'Mapping saved', 'is-ok');
			} catch (error) {
				setStatus(status, error.message, 'is-err');
			}
		});

		root.querySelector('#run-pipeline').addEventListener('click', async () => {
			const status = root.querySelector('#mapping-status');
			if (!confirm('Run the clip pipeline now? This will rebuild all clips in the public folder.')) {
				return;
			}
			setStatus(status, 'Running pipeline…');
			try {
				const result = await api('/pipeline', { method: 'POST', body: '{}' });
				setStatus(status, result.ok ? 'Pipeline finished' : 'Pipeline failed', result.ok ? 'is-ok' : 'is-err');
			} catch (error) {
				setStatus(status, error.message, 'is-err');
			}
		});

		router.start();
		Promise.all([loadLibrary(), loadProjects(), loadMapping()]).catch(error => {
			console.error(error);
			reportBootApiError(error);
		});
	}

	disconnectedCallback() {
		for (const unsubscribe of this.#unsubscribers) {
			unsubscribe();
		}
		this.#unsubscribers = [];
		this.#router?.stop();
		this.#router = null;
		this.#isInitialized = false;
	}
}

if (!customElements.get('akvj-mainframe')) {
	customElements.define('akvj-mainframe', AkvjMainframe);
}

export default AkvjMainframe;
