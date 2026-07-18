import './scss/main.scss';
import './js/PianoKey.js';
import './js/PianoRoll.js';
import './js/ClipList.js';
import { ClipEditorController } from './js/ClipEditorController.js';
import './js/MappingTable.js';
import './js/StagingPreview.js';
import './js/ClipFrame.js';
import './js/ClipFrames.js';
import './js/UserMessage.js';
import './js/UserMessages.js';
import './js/ClipNameInput.js';
import './js/SortChoice.js';
import './js/SortChoices.js';
import './js/RoleChoice.js';
import './js/RoleChoices.js';
import './js/ProjectChooser.js';
import { api } from './js/apiClient.js';
import { SimpleRouter } from './js/SimpleRouter.js';
import { editClipPath } from './js/clipEditorRoute.js';
import mainframeState, {
	EVENT_CLIPS_CHANGED,
	EVENT_MAPPINGS_CHANGED,
	EVENT_CHANNEL_CHANGED,
	EVENT_SEARCH_CHANGED,
	EVENT_ROLE_FILTER_CHANGED,
	EVENT_SORT_MODE_CHANGED,
	EVENT_PROJECTS_CHANGED,
	EVENT_ACTIVE_PROJECT_CHANGED
} from './js/mainframeState.js';
import { reportBootApiError, reportFailedClipDelete, reportFailedClipOpen } from './js/shellUserFeedback.js';

/** @type {import('./js/ClipEditorController.js').ClipEditorController|null} */
let clipEditor = null;

const panels = {
	library: document.getElementById('panel-library'),
	upload: document.getElementById('panel-upload'),
	mapping: document.getElementById('panel-mapping'),
	projects: document.getElementById('panel-projects')
};

const clipListElement = document.getElementById('clip-list');
const mappingTableElement = document.getElementById('mapping-table');
const libraryPianoRoll = document.getElementById('library-piano-roll');
const mappingPianoRoll = document.getElementById('mapping-piano-roll');
const playPianoRoll = document.getElementById('play-piano-roll');

const clipSearchInput = document.getElementById('clip-search');
clipSearchInput.addEventListener('input', () => {
	libraryPianoRoll.clearSelection();
	mainframeState.searchQuery = clipSearchInput.value.trim().toLowerCase();
});

const clipRoleChoices = document.getElementById('clip-role-filter');
clipRoleChoices.choices = [
	{ value: '', label: 'All' },
	{ value: 'clip', label: 'Clip' },
	{ value: 'bitmask', label: 'Bitmask' }
];
clipRoleChoices.addEventListener('rolechange', event => {
	mainframeState.roleFilter = event.detail.roleFilter;
});

const clipSortChoices = document.getElementById('clip-sort');
clipSortChoices.choices = [
	{ value: 'name', label: 'Name' },
	{ value: 'clipId', label: 'ID' },
	{ value: 'role', label: 'Role' },
	{ value: 'frames', label: 'Frames' }
];
clipSortChoices.addEventListener('sortchange', event => {
	mainframeState.sortMode = event.detail.sortMode;
});

const clearFiltersButton = document.getElementById('clear-filters');
clearFiltersButton.addEventListener('click', () => {
	mainframeState.searchQuery = '';
	mainframeState.roleFilter = '';
	mainframeState.sortMode = 'name';
	clipSearchInput.value = '';
	clipRoleChoices.roleFilter = '';
	clipSortChoices.sortMode = 'name';
	libraryPianoRoll.clearSelection();
});

clipListElement.addEventListener('clipsaved', _event => {
	loadLibrary().catch(error => console.error(error));
});

clipListElement.addEventListener('clipdelete', event => {
	deleteClip(event.detail.clipId);
});

clipListElement.addEventListener('clipmap', event => {
	mapClipFromLibrary(event.detail.clipId);
});

function updateFilterVisibility() {
	const hasActiveFilter = mainframeState.searchQuery !== '' || mainframeState.roleFilter !== '';
	clearFiltersButton.hidden = !hasActiveFilter;
}

function setStatus(statusElement, message, kind = '') {
	statusElement.textContent = message;
	statusElement.classList.remove('is-ok', 'is-err');
	if (kind) {
		statusElement.classList.add(kind);
	}
}

const TAB_TO_ROUTE = {
	library: '/library',
	upload: '/clip/edit',
	mapping: '/key-map',
	projects: '/projects'
};

const router = new SimpleRouter();

function showView(tabName) {
	for (const [name, panel] of Object.entries(panels)) {
		const active = name === tabName;
		panel.hidden = !active;
		panel.classList.toggle('is-active', active);
	}
	for (const btn of document.querySelectorAll('.tab')) {
		const active = btn.dataset.tab === tabName;
		btn.classList.toggle('is-active', active);
		btn.setAttribute('aria-selected', active ? 'true' : 'false');
	}
}

router.add('/library', () => showView('library'));
router.add('/clip/edit', () => {
	showView('upload');
	clipEditor?.reset();
});
router.add('/clip/edit/:clipId', (_path, params) => {
	showView('upload');
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
router.setNotFound(() => router.replace('/library'));

function switchTab(tabName) {
	const route = TAB_TO_ROUTE[tabName] || '/library';
	router.navigate(route);
}

function mapClipFromLibrary(clipId) {
	switchTab('mapping');
	const select = document.getElementById('map-clip-id');
	if ([...select.options].some(option => option.value === clipId)) {
		select.value = clipId;
	}
}

function renderLibrary() {
	clipListElement.clips = mainframeState.clips;
	updateClipSummary();
	updateFilterVisibility();
}

function updateClipSummary() {
	const summary = document.getElementById('clip-summary');
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
	const select = document.getElementById('map-clip-id');
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

mappingPianoRoll.addEventListener('keyclick', event => {
	const { note, velocity, clipId: bandClipId, action } = event.detail;
	const mapChannel = document.getElementById('map-channel');
	const mapNote = document.getElementById('map-note');
	const mapVelocity = document.getElementById('map-velocity');
	const mapClipId = document.getElementById('map-clip-id');
	const status = document.getElementById('mapping-status');

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
	const updatedMappings = mainframeState.mappings
		.filter(existingEntry => !(existingEntry.channel === mainframeState.channel && existingEntry.note === note && existingEntry.velocity === assignVelocity))
		.concat([{ channel: mainframeState.channel, note, velocity: assignVelocity, clipId }]);
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

playPianoRoll.addEventListener('noteon', event => {
	const { note, clipId } = event.detail;
	const label = clipId ? ` → ${clipId}` : '';
	setStatus(document.getElementById('mapping-status'), `Note on ${note}${label}`, 'is-ok');
	if (import.meta.env.DEV) {
		console.log('[play] noteon', event.detail);
	}
});

playPianoRoll.addEventListener('noteoff', event => {
	const { note } = event.detail;
	setStatus(document.getElementById('mapping-status'), `Note off ${note}`, '');
	if (import.meta.env.DEV) {
		console.log('[play] noteoff', event.detail);
	}
});

document.getElementById('clear-play-notes').addEventListener('click', () => {
	playPianoRoll.clearSelection();
});

mappingPianoRoll.addEventListener('channelchange', event => {
	mainframeState.channel = event.detail.channel;
	document.getElementById('map-channel').value = String(event.detail.channel);
});

function updatePianoRolls() {
	// Mappings are shared; each roll keeps its own channel (independent instances).
	libraryPianoRoll.mappings = mainframeState.mappings;
	mappingPianoRoll.mappings = mainframeState.mappings;
	playPianoRoll.mappings = mainframeState.mappings;
}

mainframeState.subscribe(EVENT_CLIPS_CHANGED, () => {
	renderLibrary();
	fillClipSelect();
});

mainframeState.subscribe(EVENT_MAPPINGS_CHANGED, () => {
	renderMapping();
});

mainframeState.subscribe(EVENT_CHANNEL_CHANGED, event => {
	mappingPianoRoll.channel = event.detail.channel;
	document.getElementById('map-channel').value = String(event.detail.channel);
});

mainframeState.subscribe(EVENT_SEARCH_CHANGED, event => {
	clipListElement.searchQuery = event.detail.searchQuery;
	updateFilterVisibility();
});

mainframeState.subscribe(EVENT_ROLE_FILTER_CHANGED, event => {
	clipListElement.roleFilter = event.detail.roleFilter;
	clipRoleChoices.roleFilter = event.detail.roleFilter;
	updateFilterVisibility();
});

mainframeState.subscribe(EVENT_SORT_MODE_CHANGED, event => {
	clipListElement.sortMode = event.detail.sortMode;
});

async function loadLibrary() {
	const libraryResponse = await api('/clips');
	mainframeState.clips = libraryResponse.clips;
}

function projectKeyMapPath(projectId = mainframeState.activeProjectId) {
	return `/projects/${encodeURIComponent(projectId)}/key-map`;
}

function updateMappingProjectLabel() {
	const label = document.getElementById('mapping-project-label');
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

const projectChooser = document.getElementById('project-chooser');
const projectsStatus = document.getElementById('projects-status');

mainframeState.subscribe(EVENT_PROJECTS_CHANGED, event => {
	projectChooser.projects = event.detail.projects;
});

mainframeState.subscribe(EVENT_ACTIVE_PROJECT_CHANGED, event => {
	projectChooser.activeProjectId = event.detail.activeProjectId;
	updateMappingProjectLabel();
});

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

document.querySelectorAll('.tab').forEach(btn => {
	btn.addEventListener('click', event => {
		event.preventDefault();
		switchTab(btn.dataset.tab);
	});
});

document.getElementById('refresh-library').addEventListener('click', () => {
	loadLibrary().catch(error => console.error(error));
});

clipEditor = new ClipEditorController({
	setStatus,
	onLibraryChanged: () => loadLibrary(),
	router
});
clipEditor.bind();

clipListElement.addEventListener('clipedit', event => {
	clipEditor.open(event.detail.clipId);
});

document.getElementById('add-mapping').addEventListener('click', () => {
	const channel = Number(document.getElementById('map-channel').value);
	const note = Number(document.getElementById('map-note').value);
	const velocity = Number(document.getElementById('map-velocity').value);
	const clipId = document.getElementById('map-clip-id').value;
	if (!clipId) {
		return;
	}
	const updatedMappings = mainframeState.mappings.filter(existingEntry => !(existingEntry.channel === channel && existingEntry.note === note && existingEntry.velocity === velocity)).concat([{ channel, note, velocity, clipId }]);
	mainframeState.mappings = updatedMappings;
});

document.getElementById('reload-mapping').addEventListener('click', () => {
	loadMapping().catch(error => setStatus(document.getElementById('mapping-status'), error.message, 'is-err'));
});

document.getElementById('save-mapping').addEventListener('click', async () => {
	const status = document.getElementById('mapping-status');
	setStatus(status, 'Saving…');
	try {
		await api(projectKeyMapPath(), { method: 'PUT', body: JSON.stringify({ mapping: mainframeState.mappings }) });
		setStatus(status, 'Mapping saved', 'is-ok');
	} catch (error) {
		setStatus(status, error.message, 'is-err');
	}
});

document.getElementById('run-pipeline').addEventListener('click', async () => {
	const status = document.getElementById('mapping-status');
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
