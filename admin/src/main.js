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
	const responseData = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(responseData.error || `HTTP ${response.status}`);
	}
	return responseData;
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

function renderLibrary() {
	const list = document.getElementById('clip-list');
	list.replaceChildren();
	if (clipCatalog.length === 0) {
		const empty = document.createElement('li');
		empty.textContent = 'No clips in the bucket yet.';
		list.append(empty);
		return;
	}
	for (const clip of clipCatalog) {
		list.append(createClipListItem(clip));
	}
}

function createClipListItem(clip) {
	const li = document.createElement('li');
	const img = document.createElement('img');
	img.alt = clip.clipId;
	img.src = clip.hasSprite ? `${API}/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}` : '';
	const meta = document.createElement('p');
	meta.className = 'clip-meta';
	const title = document.createElement('strong');
	title.textContent = clip.clipId;
	meta.append(title);
	meta.append(document.createTextNode(`frames: ${clip.meta.numberOfFrames ?? '?'} · role: ${clip.meta.role || 'clip'}${clip.meta.bitDepth ? ` · ${clip.meta.bitDepth}-bit` : ''}${clip.pipelineReady === false ? ' · incomplete' : ''}`));
	li.append(img, meta);
	return li;
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
	const body = document.getElementById('mapping-body');
	body.replaceChildren();
	const sorted = [...mappingState].sort((a, b) => a.channel - b.channel || a.note - b.note || a.velocity - b.velocity);
	for (const entry of sorted) {
		const tr = document.createElement('tr');
		tr.innerHTML = `<td>${entry.channel}</td><td>${entry.note}</td><td>${entry.velocity}</td><td>${entry.clipId}</td>`;
		const td = document.createElement('td');
		const remove = document.createElement('button');
		remove.type = 'button';
		remove.textContent = 'Remove';
		remove.addEventListener('click', () => {
			mappingState = mappingState.filter(existingEntry => !(existingEntry.channel === entry.channel && existingEntry.note === entry.note && existingEntry.velocity === entry.velocity));
			renderMapping();
		});
		td.append(remove);
		tr.append(td);
		body.append(tr);
	}
}

async function loadLibrary() {
	const libraryResponse = await api('/clips');
	clipCatalog = libraryResponse.clips;
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

document.getElementById('upload-form').addEventListener('submit', async event => {
	event.preventDefault();
	const status = document.getElementById('upload-status');
	setStatus(status, 'Uploading…');
	try {
		const clipId = document.getElementById('upload-clip-id').value.trim();
		const role = document.getElementById('upload-role').value;
		const files = [...document.getElementById('upload-files').files];
		const frames = await readFilesAsDataURLs(files);
		await api('/clips', {
			method: 'POST',
			body: JSON.stringify({ clipId, role: role || undefined, frames })
		});
		setStatus(status, `Saved clip ${clipId}`, 'is-ok');
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
	setStatus(status, 'Running pipeline…');
	try {
		const result = await api('/pipeline', { method: 'POST', body: '{}' });
		setStatus(status, result.ok ? 'Pipeline finished' : 'Pipeline failed', result.ok ? 'is-ok' : 'is-err');
	} catch (error) {
		setStatus(status, error.message, 'is-err');
	}
});

Promise.all([loadLibrary(), loadMapping()]).catch(error => {
	console.error(error);
	setStatus(document.getElementById('upload-status'), `API error: ${error.message}`, 'is-err');
});
