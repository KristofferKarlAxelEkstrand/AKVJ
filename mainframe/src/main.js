import './js/PianoKeyboard.js';
import './js/ClipList.js';
import './js/ClipEditor.js';
import './js/MappingTable.js';
import './js/StagingPreview.js';

const API = '/api';

const panels = {
	library: document.getElementById('panel-library'),
	upload: document.getElementById('panel-upload'),
	mapping: document.getElementById('panel-mapping')
};

/** @type {Array<{channel: number, note: number, velocity: number, clipId: string}>} */
let mappingState = [];
/** @type {Array<{clipId: string, meta: object, hasSprite: boolean}>} */
let clipCatalog = [];
let clipSearchQuery = '';
let clipRoleFilter = '';
let clipSortMode = 'name';
let pianoChannel = 1;

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
	pianoChannel = Number(pianoChannelSelect.value);
	renderMapping();
});

function populatePianoChannelSelect() {
	pianoChannelSelect.replaceChildren();
	for (let channel = 1; channel <= 16; channel++) {
		const option = document.createElement('option');
		option.value = String(channel);
		option.textContent = `Ch ${channel} — ${PIANO_CHANNEL_LABELS[channel]}`;
		pianoChannelSelect.append(option);
	}
	pianoChannelSelect.value = String(pianoChannel);
}

const clipListElement = document.getElementById('clip-list');
const mappingTableElement = document.getElementById('mapping-table');

const clipSearchInput = document.getElementById('clip-search');
clipSearchInput.addEventListener('input', () => {
	clipSearchQuery = clipSearchInput.value.trim().toLowerCase();
	clipListElement.searchQuery = clipSearchQuery;
	updateFilterVisibility();
});

const clipRoleFilterSelect = document.getElementById('clip-role-filter');
clipRoleFilterSelect.addEventListener('change', () => {
	clipRoleFilter = clipRoleFilterSelect.value;
	clipListElement.roleFilter = clipRoleFilter;
	updateFilterVisibility();
});

const clipSortSelect = document.getElementById('clip-sort');
clipSortSelect.addEventListener('change', () => {
	clipSortMode = clipSortSelect.value;
	clipListElement.sortMode = clipSortMode;
});

const clearFiltersButton = document.getElementById('clear-filters');
clearFiltersButton.addEventListener('click', () => {
	clipSearchQuery = '';
	clipRoleFilter = '';
	clipSortMode = 'name';
	clipSearchInput.value = '';
	clipRoleFilterSelect.value = '';
	clipSortSelect.value = 'name';
	clipListElement.searchQuery = '';
	clipListElement.roleFilter = '';
	clipListElement.sortMode = 'name';
	updateFilterVisibility();
});

clipListElement.addEventListener('clipedit', event => {
	const { clip, listItem } = event.detail;
	const existingForm = listItem.querySelector('.clip-edit-form');
	if (existingForm) {
		existingForm.remove();
		return;
	}
	const editor = document.createElement('akvj-clip-editor');
	editor.clip = clip;
	listItem.append(editor);
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
	const hasActiveFilter = clipSearchQuery !== '' || clipRoleFilter !== '';
	clearFiltersButton.hidden = !hasActiveFilter;
}

function setStatus(statusElement, message, kind = '') {
	statusElement.textContent = message;
	statusElement.classList.remove('is-ok', 'is-err');
	if (kind) {
		statusElement.classList.add(kind);
	}
}

async function api(path, options = {}) {
	const response = await fetch(`${API}${path}`, {
		headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
		...options
	});
	const responseBody = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(responseBody.error || `HTTP ${response.status}`);
	}
	return responseBody;
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
	clipListElement.clips = clipCatalog;
	updateClipSummary();
	updateFilterVisibility();
}

function populateRoleFilter() {
	const roles = [...new Set(clipCatalog.map(clip => clip.meta.role || '').filter(Boolean))].sort();
	const currentValue = clipRoleFilter;
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
		clipRoleFilter = '';
	}
}

function updateClipSummary() {
	const summary = document.getElementById('clip-summary');
	const total = clipCatalog.length;
	const ready = clipCatalog.filter(clip => clip.pipelineReady).length;
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
	for (const clip of clipCatalog.filter(clip => clip.pipelineReady !== false && clip.hasSprite)) {
		const option = document.createElement('option');
		option.value = clip.clipId;
		option.textContent = clip.clipId;
		select.append(option);
	}
}

function renderMapping() {
	mappingTableElement.mappings = mappingState;
	mappingTableElement.clipCatalog = clipCatalog;
	updatePianoKeyboard();
}

mappingTableElement.addEventListener('mappingremove', event => {
	const { channel, note, velocity } = event.detail;
	mappingState = mappingState.filter(existingEntry => !(existingEntry.channel === channel && existingEntry.note === note && existingEntry.velocity === velocity));
	renderMapping();
});

const pianoKeyboard = document.getElementById('piano-keyboard');

pianoKeyboard.addEventListener('pianokeyclick', event => {
	const { note } = event.detail;
	const clipId = document.getElementById('map-clip-id').value;
	if (!clipId) {
		setStatus(document.getElementById('mapping-status'), 'Select a clip first', 'is-err');
		return;
	}
	mappingState = mappingState.filter(existingEntry => !(existingEntry.channel === pianoChannel && existingEntry.note === note && existingEntry.velocity === 0));
	mappingState.push({ channel: pianoChannel, note, velocity: 0, clipId });
	renderMapping();
});

function updatePianoKeyboard() {
	pianoKeyboard.channel = pianoChannel;
	pianoKeyboard.mappings = mappingState;
}

async function loadLibrary() {
	const libraryResponse = await api('/clips');
	clipCatalog = libraryResponse.clips;
	populateRoleFilter();
	renderLibrary();
	fillClipSelect();
}

async function loadMapping() {
	const mappingResponse = await api('/mapping');
	mappingState = mappingResponse.mapping;
	renderMapping();
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
	mappingState = mappingState.filter(existingEntry => !(existingEntry.channel === channel && existingEntry.note === note && existingEntry.velocity === velocity));
	mappingState.push({ channel, note, velocity, clipId });
	renderMapping();
});

document.getElementById('reload-mapping').addEventListener('click', () => {
	loadMapping().catch(error => setStatus(document.getElementById('mapping-status'), error.message, 'is-err'));
});

document.getElementById('save-mapping').addEventListener('click', async () => {
	const status = document.getElementById('mapping-status');
	setStatus(status, 'Saving…');
	try {
		await api('/mapping', { method: 'PUT', body: JSON.stringify({ mapping: mappingState }) });
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
