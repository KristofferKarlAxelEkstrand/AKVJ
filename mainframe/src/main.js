import './js/PianoKeyboard.js';
import './js/StickyPianoRoll.js';
import './js/ClipList.js';
import './js/ClipEditor.js';
import './js/MappingTable.js';
import './js/StagingPreview.js';
import { api } from './js/apiClient.js';
import mainframeState, { EVENT_CLIPS_CHANGED, EVENT_MAPPINGS_CHANGED, EVENT_CHANNEL_CHANGED, EVENT_SEARCH_CHANGED, EVENT_ROLE_FILTER_CHANGED, EVENT_SORT_MODE_CHANGED } from './js/mainframeState.js';

const panels = {
	library: document.getElementById('panel-library'),
	upload: document.getElementById('panel-upload'),
	mapping: document.getElementById('panel-mapping')
};

const PIANO_CHANNEL_LABELS = {
	1: 'Layer Group A',
	2: 'Layer Group A',
	3: 'Layer Group A',
	4: 'Layer Group A',
	5: 'Mixer',
	6: 'Layer Group B',
	7: 'Layer Group B',
	8: 'Layer Group B',
	9: 'Layer Group B',
	10: 'Mixed output effects',
	11: 'Layer Group C',
	12: 'Layer Group C',
	13: 'Global effects',
	14: 'Reserved',
	15: 'Reserved',
	16: 'Reserved'
};

const pianoChannelSelect = document.getElementById('piano-channel');
pianoChannelSelect.addEventListener('change', () => {
	mainframeState.channel = Number(pianoChannelSelect.value);
});

function populatePianoChannelSelect() {
	pianoChannelSelect.replaceChildren();
	for (let channel = 1; channel <= 16; channel++) {
		const option = document.createElement('option');
		option.value = String(channel);
		option.textContent = `Ch ${channel} — ${PIANO_CHANNEL_LABELS[channel]}`;
		pianoChannelSelect.append(option);
	}
	pianoChannelSelect.value = String(mainframeState.channel);
}

const clipListElement = document.getElementById('clip-list');
const mappingTableElement = document.getElementById('mapping-table');
const stickyPianoRoll = document.getElementById('sticky-piano-roll');

const clipSearchInput = document.getElementById('clip-search');
clipSearchInput.addEventListener('input', () => {
	stickyPianoRoll.clearFilter();
	mainframeState.searchQuery = clipSearchInput.value.trim().toLowerCase();
});

const clipRoleFilterSelect = document.getElementById('clip-role-filter');
clipRoleFilterSelect.addEventListener('change', () => {
	mainframeState.roleFilter = clipRoleFilterSelect.value;
});

const clipSortSelect = document.getElementById('clip-sort');
clipSortSelect.addEventListener('change', () => {
	mainframeState.sortMode = clipSortSelect.value;
});

const clearFiltersButton = document.getElementById('clear-filters');
clearFiltersButton.addEventListener('click', () => {
	mainframeState.searchQuery = '';
	mainframeState.roleFilter = '';
	mainframeState.sortMode = 'name';
	clipSearchInput.value = '';
	clipRoleFilterSelect.value = '';
	clipSortSelect.value = 'name';
	stickyPianoRoll.clearFilter();
});

clipListElement.addEventListener('clipedit', event => {
	const { clip, clipId } = event.detail;
	const editor = document.createElement('akvj-clip-editor');
	editor.clip = clip;
	clipListElement.attachEditForm(clipId, editor);
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

function switchTab(tabName) {
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

function populateRoleFilter() {
	const roles = [...new Set(mainframeState.clips.map(clip => clip.meta.role || '').filter(Boolean))].sort();
	const currentValue = mainframeState.roleFilter;
	clipRoleFilterSelect.replaceChildren();
	const allOption = document.createElement('option');
	allOption.value = '';
	allOption.textContent = 'All roles';
	clipRoleFilterSelect.append(allOption);
	for (const role of roles) {
		const option = document.createElement('option');
		option.value = role;
		option.textContent = role;
		clipRoleFilterSelect.append(option);
	}
	if (roles.includes(currentValue)) {
		clipRoleFilterSelect.value = currentValue;
	} else {
		mainframeState.roleFilter = '';
	}
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
		alert(`Failed to delete clip "${clipId}": ${error.message}`);
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
	updatePianoKeyboard();
}

mappingTableElement.addEventListener('mappingremove', event => {
	const { channel, note, velocity } = event.detail;
	mainframeState.mappings = mainframeState.mappings.filter(existingEntry => !(existingEntry.channel === channel && existingEntry.note === note && existingEntry.velocity === velocity));
});

const pianoKeyboard = document.getElementById('piano-keyboard');

pianoKeyboard.addEventListener('pianokeyclick', event => {
	const { note } = event.detail;
	const clipId = document.getElementById('map-clip-id').value;
	if (!clipId) {
		setStatus(document.getElementById('mapping-status'), 'Select a clip first', 'is-err');
		return;
	}
	const updatedMappings = mainframeState.mappings.filter(existingEntry => !(existingEntry.channel === mainframeState.channel && existingEntry.note === note && existingEntry.velocity === 0)).concat([{ channel: mainframeState.channel, note, velocity: 0, clipId }]);
	mainframeState.mappings = updatedMappings;
});

stickyPianoRoll.addEventListener('stickykeyclick', event => {
	const { clipId, isActive } = event.detail;
	if (isActive && clipId) {
		clipListElement.searchQuery = clipId;
	} else {
		clipListElement.searchQuery = mainframeState.searchQuery;
	}
});

function updatePianoKeyboard() {
	pianoKeyboard.channel = mainframeState.channel;
	pianoKeyboard.mappings = mainframeState.mappings;
	stickyPianoRoll.channel = mainframeState.channel;
	stickyPianoRoll.mappings = mainframeState.mappings;
}

mainframeState.subscribe(EVENT_CLIPS_CHANGED, () => {
	renderLibrary();
	populateRoleFilter();
	fillClipSelect();
});

mainframeState.subscribe(EVENT_MAPPINGS_CHANGED, () => {
	renderMapping();
});

mainframeState.subscribe(EVENT_CHANNEL_CHANGED, event => {
	pianoChannelSelect.value = String(event.detail.channel);
	updatePianoKeyboard();
});

mainframeState.subscribe(EVENT_SEARCH_CHANGED, event => {
	clipListElement.searchQuery = event.detail.searchQuery;
	updateFilterVisibility();
});

mainframeState.subscribe(EVENT_ROLE_FILTER_CHANGED, event => {
	clipListElement.roleFilter = event.detail.roleFilter;
	updateFilterVisibility();
});

mainframeState.subscribe(EVENT_SORT_MODE_CHANGED, event => {
	clipListElement.sortMode = event.detail.sortMode;
});

async function loadLibrary() {
	const libraryResponse = await api('/clips');
	mainframeState.clips = libraryResponse.clips;
}

async function loadMapping() {
	const mappingResponse = await api('/mapping');
	mainframeState.mappings = mappingResponse.mapping;
}

document.querySelectorAll('.tab').forEach(btn => {
	btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('refresh-library').addEventListener('click', () => {
	loadLibrary().catch(error => console.error(error));
});

const uploadForm = document.getElementById('upload-form');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('upload-files');
const fileListContainer = document.getElementById('file-list');
let stagedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', event => {
	if (event.key === 'Enter' || event.key === ' ') {
		event.preventDefault();
		fileInput.click();
	}
});

dropZone.addEventListener('dragover', event => {
	event.preventDefault();
	dropZone.classList.add('is-dragover');
});

dropZone.addEventListener('dragleave', () => {
	dropZone.classList.remove('is-dragover');
});

dropZone.addEventListener('drop', event => {
	event.preventDefault();
	dropZone.classList.remove('is-dragover');
	const pngFiles = [...event.dataTransfer.files].filter(file => file.type === 'image/png');
	if (pngFiles.length > 0) {
		stagedFiles = pngFiles;
		renderFileList();
	}
});

fileInput.addEventListener('change', () => {
	stagedFiles = [...fileInput.files].filter(file => file.type === 'image/png');
	renderFileList();
});

const stagingPreview = document.getElementById('staging-preview');

function renderFileList() {
	fileListContainer.replaceChildren();
	if (stagedFiles.length === 0) {
		stagingPreview.loadFrames([]);
		return;
	}
	for (const file of stagedFiles) {
		const item = document.createElement('div');
		item.className = 'file-list-item';
		const name = document.createElement('span');
		name.textContent = file.name;
		const size = document.createElement('span');
		size.textContent = `${(file.size / 1024).toFixed(1)} KB`;
		item.append(name, size);
		fileListContainer.append(item);
	}
	const count = document.createElement('p');
	count.className = 'file-list-item';
	count.style.fontWeight = 'bold';
	count.textContent = `${stagedFiles.length} frame${stagedFiles.length === 1 ? '' : 's'} staged`;
	fileListContainer.append(count);
	updateStagingPreview();
}

function updateStagingPreview() {
	const targetWidth = Number(document.getElementById('upload-target-width').value) || 240;
	const targetHeight = Number(document.getElementById('upload-target-height').value) || 135;
	const frameRate = Number(document.getElementById('upload-frame-rate').value) || 12;
	const playback = document.getElementById('upload-playback').value;
	stagingPreview.loadFrames(stagedFiles, targetWidth, targetHeight, frameRate, playback);
}

document.getElementById('upload-target-width').addEventListener('change', updateStagingPreview);
document.getElementById('upload-target-height').addEventListener('change', updateStagingPreview);
document.getElementById('upload-frame-rate').addEventListener('change', updateStagingPreview);
document.getElementById('upload-playback').addEventListener('change', updateStagingPreview);

uploadForm.addEventListener('submit', async event => {
	event.preventDefault();
	const status = document.getElementById('upload-status');
	if (stagedFiles.length === 0) {
		setStatus(status, 'Select at least one PNG frame', 'is-err');
		return;
	}
	setStatus(status, 'Uploading…');
	try {
		const clipId = document.getElementById('upload-clip-id').value.trim();
		const name = document.getElementById('upload-name').value.trim() || undefined;
		const role = document.getElementById('upload-role').value || undefined;
		const targetWidth = Number(document.getElementById('upload-target-width').value) || undefined;
		const targetHeight = Number(document.getElementById('upload-target-height').value) || undefined;
		const playback = document.getElementById('upload-playback').value;
		const frameRate = Number(document.getElementById('upload-frame-rate').value) || undefined;
		const frames = await readFilesAsDataURLs(stagedFiles);
		await api('/clips', {
			method: 'POST',
			body: JSON.stringify({ clipId, name, role, frames, targetWidth, targetHeight, playback, frameRate })
		});
		setStatus(status, `Saved clip ${clipId}`, 'is-ok');
		uploadForm.reset();
		stagedFiles = [];
		renderFileList();
		await loadLibrary();
	} catch (error) {
		setStatus(status, error.message, 'is-err');
	}
});

function readFilesAsDataURLs(files) {
	return Promise.all(
		files.map(
			file =>
				new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(String(reader.result));
					reader.onerror = () => reject(reader.error);
					reader.readAsDataURL(file);
				})
		)
	);
}

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
		await api('/mapping', { method: 'PUT', body: JSON.stringify({ mapping: mainframeState.mappings }) });
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

populatePianoChannelSelect();
Promise.all([loadLibrary(), loadMapping()]).catch(error => {
	console.error(error);
	setStatus(document.getElementById('upload-status'), `API error: ${error.message}`, 'is-err');
});
