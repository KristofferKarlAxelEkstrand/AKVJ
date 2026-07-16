import './js/PianoKeyboard.js';

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

const clipSearchInput = document.getElementById('clip-search');
clipSearchInput.addEventListener('input', () => {
	clipSearchQuery = clipSearchInput.value.trim().toLowerCase();
	renderLibrary();
});

const clipRoleFilterSelect = document.getElementById('clip-role-filter');
clipRoleFilterSelect.addEventListener('change', () => {
	clipRoleFilter = clipRoleFilterSelect.value;
	renderLibrary();
});

const clearFiltersButton = document.getElementById('clear-filters');
clearFiltersButton.addEventListener('click', () => {
	clipSearchQuery = '';
	clipRoleFilter = '';
	clipSearchInput.value = '';
	clipRoleFilterSelect.value = '';
	renderLibrary();
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
	const list = document.getElementById('clip-list');
	list.replaceChildren();
	updateClipSummary();
	updateFilterVisibility();
	if (clipCatalog.length === 0) {
		const empty = document.createElement('li');
		empty.textContent = 'No clips in the bucket yet.';
		list.append(empty);
		return;
	}
	const filteredClips = filterClipsBySearch(clipCatalog);
	if (filteredClips.length === 0) {
		const noMatch = document.createElement('li');
		noMatch.textContent = `No clips match "${clipSearchQuery}".`;
		list.append(noMatch);
		return;
	}
	for (const clip of filteredClips) {
		list.append(createClipListItem(clip));
	}
}

function filterClipsBySearch(clips) {
	return clips.filter(clip => {
		const clipRole = clip.meta.role || '';
		if (clipRoleFilter && clipRole !== clipRoleFilter) {
			return false;
		}
		if (!clipSearchQuery) {
			return true;
		}
		const clipIdMatch = clip.clipId.toLowerCase().includes(clipSearchQuery);
		const roleMatch = clipRole.toLowerCase().includes(clipSearchQuery);
		return clipIdMatch || roleMatch;
	});
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

function createClipListItem(clip) {
	const li = document.createElement('li');
	const img = document.createElement('img');
	img.alt = clip.clipId;
	img.src = clip.hasSprite ? `${API}/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}` : '';
	const clipInfo = document.createElement('p');
	clipInfo.className = 'clip-meta';
	const title = document.createElement('strong');
	title.textContent = clip.meta.name || clip.clipId;
	clipInfo.append(title);
	if (clip.meta.name && clip.meta.name !== clip.clipId) {
		const clipIdLabel = document.createElement('span');
		clipIdLabel.className = 'clip-id-label';
		clipIdLabel.textContent = ` (${clip.clipId})`;
		clipInfo.append(clipIdLabel);
	}
	clipInfo.append(document.createTextNode(` · frames: ${clip.meta.frames ?? clip.meta.numberOfFrames ?? '?'} · role: ${clip.meta.role || 'clip'}${clip.meta.bitDepth ? ` · ${clip.meta.bitDepth}-bit` : ''}${clip.pipelineReady === false ? ' · incomplete' : ''}`));
	const actions = document.createElement('div');
	actions.className = 'clip-actions';
	const previewButton = document.createElement('button');
	previewButton.type = 'button';
	previewButton.className = 'clip-preview';
	previewButton.textContent = 'Preview';
	previewButton.disabled = !clip.hasSprite;
	previewButton.addEventListener('click', () => toggleClipPreview(li, clip));
	const editButton = document.createElement('button');
	editButton.type = 'button';
	editButton.className = 'clip-edit';
	editButton.textContent = 'Edit';
	editButton.addEventListener('click', () => toggleClipEditForm(li, clip));
	const deleteButton = document.createElement('button');
	deleteButton.type = 'button';
	deleteButton.className = 'clip-delete';
	deleteButton.textContent = 'Delete';
	deleteButton.addEventListener('click', () => deleteClip(clip.clipId));
	const mapButton = document.createElement('button');
	mapButton.type = 'button';
	mapButton.className = 'clip-map';
	mapButton.textContent = 'Map';
	mapButton.disabled = !clip.pipelineReady;
	mapButton.addEventListener('click', () => mapClipFromLibrary(clip.clipId));
	actions.append(previewButton, editButton, mapButton, deleteButton);
	li.append(img, clipInfo, actions);
	return li;
}

function toggleClipEditForm(li, clip) {
	const existingForm = li.querySelector('.clip-edit-form');
	if (existingForm) {
		existingForm.remove();
		return;
	}
	const form = createClipEditForm(clip);
	li.append(form);
}

const activePreviewPlayers = new Map();

function toggleClipPreview(li, clip) {
	const existingPlayer = li.querySelector('.clip-preview-player');
	if (existingPlayer) {
		stopPreviewPlayer(clip.clipId);
		existingPlayer.remove();
		return;
	}
	const player = createClipPreviewPlayer(clip);
	li.append(player);
}

function stopPreviewPlayer(clipId) {
	const player = activePreviewPlayers.get(clipId);
	if (player) {
		player.stop();
		activePreviewPlayers.delete(clipId);
	}
}

function createClipPreviewPlayer(clip) {
	const container = document.createElement('div');
	container.className = 'clip-preview-player';

	const canvas = document.createElement('canvas');
	canvas.width = 240;
	canvas.height = 135;
	canvas.className = 'clip-preview-canvas';
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	const controls = document.createElement('div');
	controls.className = 'clip-preview-controls';

	const frameLabel = document.createElement('span');
	frameLabel.className = 'clip-preview-frame-label';
	frameLabel.textContent = 'Loading…';

	const playPauseButton = document.createElement('button');
	playPauseButton.type = 'button';
	playPauseButton.className = 'clip-preview-play';
	playPauseButton.textContent = 'Pause';

	const stopButton = document.createElement('button');
	stopButton.type = 'button';
	stopButton.textContent = 'Stop';
	stopButton.addEventListener('click', () => {
		stopPreviewPlayer(clip.clipId);
		container.remove();
	});

	const scrubSlider = document.createElement('input');
	scrubSlider.type = 'range';
	scrubSlider.className = 'clip-preview-scrub';
	scrubSlider.min = 0;
	scrubSlider.max = 0;
	scrubSlider.value = 0;
	scrubSlider.disabled = true;

	const speedSelect = document.createElement('select');
	speedSelect.className = 'clip-preview-speed';
	for (const speed of [0.25, 0.5, 1, 2, 4]) {
		const option = document.createElement('option');
		option.value = String(speed);
		option.textContent = `${speed}×`;
		if (speed === 1) {
			option.selected = true;
		}
		speedSelect.append(option);
	}

	controls.append(frameLabel, playPauseButton, stopButton, speedSelect);
	container.append(canvas, controls, scrubSlider);

	const clipMetadata = clip.meta;
	const frameCount = clipMetadata.frames ?? clipMetadata.numberOfFrames ?? 1;
	const framesPerRow = clipMetadata.framesPerRow ?? 1;
	const playbackMode = clipMetadata.playback ?? (clipMetadata.loop === false ? 'once' : 'loop');
	const frameRatesForFrames = clipMetadata.frameRatesForFrames || { 0: 15 };
	const defaultFrameRate = frameRatesForFrames[0] ?? 15;

	const spriteUrl = `${API}/clips/${encodeURIComponent(clip.clipId)}/sprite?t=${performance.now()}`;
	const spriteImage = new Image();
	spriteImage.crossOrigin = 'anonymous';

	let currentFrame = 0;
	let lastFrameTime = 0;
	let animationFrameId = null;
	let isPlaying = false;
	let playbackSpeed = 1;
	let isScrubbing = false;

	function getFrameInterval(frameIndex) {
		const fps = frameRatesForFrames[frameIndex] ?? defaultFrameRate;
		return 1000 / fps / playbackSpeed;
	}

	function drawCurrentFrame() {
		if (!spriteImage.complete || !spriteImage.naturalWidth) {
			return;
		}
		const frameWidth = spriteImage.naturalWidth / framesPerRow;
		const frameHeight = spriteImage.naturalHeight / Math.ceil(frameCount / framesPerRow);
		const col = currentFrame % framesPerRow;
		const row = Math.floor(currentFrame / framesPerRow);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(spriteImage, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);
		frameLabel.textContent = `Frame ${currentFrame + 1} / ${frameCount}`;
		if (!isScrubbing) {
			scrubSlider.value = String(currentFrame);
		}
	}

	function setPlaying(playing) {
		isPlaying = playing;
		playPauseButton.textContent = playing ? 'Pause' : 'Play';
		if (playing) {
			lastFrameTime = 0;
			if (animationFrameId === null) {
				animationFrameId = requestAnimationFrame(animate);
			}
		}
	}

	function animate(timestamp) {
		if (!isPlaying) {
			animationFrameId = null;
			return;
		}
		if (lastFrameTime === 0) {
			lastFrameTime = timestamp;
		}
		const elapsed = timestamp - lastFrameTime;
		if (elapsed >= getFrameInterval(currentFrame)) {
			lastFrameTime = timestamp;
			currentFrame++;
			if (currentFrame >= frameCount) {
				if (playbackMode !== 'once') {
					currentFrame = 0;
				} else {
					currentFrame = frameCount - 1;
					setPlaying(false);
					frameLabel.textContent = `Frame ${currentFrame + 1} / ${frameCount} (finished)`;
					drawCurrentFrame();
					return;
				}
			}
			drawCurrentFrame();
		}
		animationFrameId = requestAnimationFrame(animate);
	}

	playPauseButton.addEventListener('click', () => {
		if (isPlaying) {
			setPlaying(false);
		} else {
			if (currentFrame >= frameCount - 1 && playbackMode === 'once') {
				currentFrame = 0;
			}
			setPlaying(true);
		}
	});

	scrubSlider.addEventListener('input', () => {
		isScrubbing = true;
		currentFrame = Number(scrubSlider.value);
		drawCurrentFrame();
	});

	scrubSlider.addEventListener('change', () => {
		isScrubbing = false;
	});

	speedSelect.addEventListener('change', () => {
		playbackSpeed = Number(speedSelect.value);
	});

	spriteImage.onload = () => {
		scrubSlider.max = String(Math.max(0, frameCount - 1));
		scrubSlider.disabled = false;
		setPlaying(true);
		drawCurrentFrame();
	};

	spriteImage.onerror = () => {
		frameLabel.textContent = 'Failed to load sprite';
		scrubSlider.disabled = true;
	};

	spriteImage.src = spriteUrl;

	const player = {
		stop() {
			isPlaying = false;
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	};
	activePreviewPlayers.set(clip.clipId, player);

	return container;
}

function createClipEditForm(clip) {
	const form = document.createElement('div');
	form.className = 'clip-edit-form';
	const clipMetadata = clip.meta;

	const nameInput = createTextInput('name', clipMetadata.name || '');
	const numberFramesInput = createNumberInput('frames', clipMetadata.frames ?? clipMetadata.numberOfFrames, 1);
	const framesPerRowInput = createNumberInput('framesPerRow', clipMetadata.framesPerRow, 1);
	const playbackInput = document.createElement('select');
	playbackInput.name = 'playback';
	for (const mode of ['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']) {
		const option = document.createElement('option');
		option.value = mode;
		option.textContent = mode;
		if ((clipMetadata.playback ?? (clipMetadata.loop === false ? 'once' : 'loop')) === mode) {
			option.selected = true;
		}
		playbackInput.append(option);
	}
	const retriggerInput = createCheckbox('retrigger', clipMetadata.retrigger);
	const roleInput = createTextInput('role', clipMetadata.role || '');
	const bitDepthInput = createNumberInput('bitDepth', clipMetadata.bitDepth, 0);
	const triggerTypeInput = document.createElement('select');
	triggerTypeInput.name = 'triggerType';
	for (const type of ['momentary', 'latch', 'one-shot']) {
		const option = document.createElement('option');
		option.value = type;
		option.textContent = type;
		if (clipMetadata.triggerType === type) {
			option.selected = true;
		}
		triggerTypeInput.append(option);
	}
	const triggerGroupInput = createTextInput('triggerGroup', clipMetadata.triggerGroup || '');

	const frameRatesTextarea = document.createElement('textarea');
	frameRatesTextarea.className = 'clip-edit-textarea';
	frameRatesTextarea.name = 'frameRatesForFrames';
	frameRatesTextarea.rows = 2;
	frameRatesTextarea.placeholder = '{"0": 15}';
	frameRatesTextarea.value = clipMetadata.frameRatesForFrames ? JSON.stringify(clipMetadata.frameRatesForFrames) : '';

	const frameRatesHint = document.createElement('span');
	frameRatesHint.className = 'clip-edit-hint';

	function validateFrameRatesForFrames() {
		const raw = frameRatesTextarea.value.trim();
		if (!raw) {
			frameRatesHint.textContent = '';
			frameRatesHint.className = 'clip-edit-hint';
			return true;
		}
		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch {
			frameRatesHint.textContent = 'Invalid JSON';
			frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
			frameRatesHint.textContent = 'Must be a JSON object like {"0": 15}';
			frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		const expectedFrames = Number(numberFramesInput.value);
		const keys = Object.keys(parsed).map(Number);
		const outOfRange = keys.filter(key => !Number.isInteger(key) || key < 0 || key >= expectedFrames);
		if (outOfRange.length > 0) {
			frameRatesHint.textContent = `Keys must be 0–${expectedFrames - 1}. Invalid: ${outOfRange.join(', ')}`;
			frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		const values = Object.values(parsed);
		const invalidValues = values.filter(value => typeof value !== 'number' || !Number.isFinite(value) || value <= 0);
		if (invalidValues.length > 0) {
			frameRatesHint.textContent = `Values must be positive numbers. Invalid: ${invalidValues.join(', ')}`;
			frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		frameRatesHint.textContent = '';
		frameRatesHint.className = 'clip-edit-hint';
		return true;
	}

	const frameDurationBeatsTextarea = document.createElement('textarea');
	frameDurationBeatsTextarea.className = 'clip-edit-textarea';
	frameDurationBeatsTextarea.name = 'frameDurationBeats';
	frameDurationBeatsTextarea.rows = 2;
	frameDurationBeatsTextarea.placeholder = '0.25 or [0.25, 0.5, 0.25]';
	frameDurationBeatsTextarea.value = clipMetadata.frameDurationBeats !== null && clipMetadata.frameDurationBeats !== undefined ? JSON.stringify(clipMetadata.frameDurationBeats) : '';

	const frameDurationBeatsHint = document.createElement('span');
	frameDurationBeatsHint.className = 'clip-edit-hint';

	function validateFrameDurationBeats() {
		const raw = frameDurationBeatsTextarea.value.trim();
		if (!raw) {
			frameDurationBeatsHint.textContent = '';
			frameDurationBeatsHint.className = 'clip-edit-hint';
			return true;
		}
		let parsed;
		try {
			parsed = JSON.parse(raw);
		} catch {
			frameDurationBeatsHint.textContent = 'Invalid JSON';
			frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		const values = Array.isArray(parsed) ? parsed : [parsed];
		if (!Array.isArray(parsed) && typeof parsed !== 'number') {
			frameDurationBeatsHint.textContent = 'Must be a number or array of numbers';
			frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		if (Array.isArray(parsed)) {
			const expectedLength = Number(numberFramesInput.value);
			if (parsed.length !== expectedLength) {
				frameDurationBeatsHint.textContent = `Array length ${parsed.length} must equal frames (${expectedLength})`;
				frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
		}
		const invalidValues = values.filter(value => typeof value !== 'number' || !Number.isFinite(value) || value <= 0);
		if (invalidValues.length > 0) {
			frameDurationBeatsHint.textContent = `Values must be positive numbers. Invalid: ${invalidValues.join(', ')}`;
			frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
			return false;
		}
		frameDurationBeatsHint.textContent = '';
		frameDurationBeatsHint.className = 'clip-edit-hint';
		return true;
	}

	frameDurationBeatsTextarea.addEventListener('input', validateFrameDurationBeats);
	frameRatesTextarea.addEventListener('input', validateFrameRatesForFrames);
	numberFramesInput.addEventListener('input', validateFrameDurationBeats);
	numberFramesInput.addEventListener('input', validateFrameRatesForFrames);

	form.append(createField('Name', nameInput), createField('Frames', numberFramesInput), createField('Frames/row', framesPerRowInput), createField('Playback', playbackInput), createField('Retrigger', retriggerInput), createField('Role', roleInput), createField('Bit depth', bitDepthInput), createField('Trigger type', triggerTypeInput), createField('Trigger group', triggerGroupInput), createField('Frame rates (JSON)', frameRatesTextarea), frameRatesHint, createField('Duration beats (JSON)', frameDurationBeatsTextarea), frameDurationBeatsHint);

	const saveButton = document.createElement('button');
	saveButton.type = 'button';
	saveButton.textContent = 'Save metadata';
	const statusSpan = document.createElement('span');
	statusSpan.className = 'status';
	saveButton.addEventListener('click', async () => {
		if (!validateFrameRatesForFrames()) {
			setStatus(statusSpan, 'Fix frameRatesForFrames errors first', 'is-err');
			return;
		}
		if (!validateFrameDurationBeats()) {
			setStatus(statusSpan, 'Fix frameDurationBeats errors first', 'is-err');
			return;
		}
		setStatus(statusSpan, 'Saving…');
		try {
			const updates = {
				name: nameInput.value.trim() || undefined,
				frames: Number(numberFramesInput.value),
				framesPerRow: Number(framesPerRowInput.value),
				playback: playbackInput.value,
				retrigger: retriggerInput.checked,
				bitDepth: bitDepthInput.value ? Number(bitDepthInput.value) : undefined
			};
			if (roleInput.value.trim()) {
				updates.role = roleInput.value.trim();
			}
			updates.triggerType = triggerTypeInput.value;
			if (triggerGroupInput.value.trim()) {
				updates.triggerGroup = triggerGroupInput.value.trim();
			}
			const frameRatesRaw = frameRatesTextarea.value.trim();
			if (frameRatesRaw) {
				updates.frameRatesForFrames = JSON.parse(frameRatesRaw);
			}
			const frameDurationBeatsRaw = frameDurationBeatsTextarea.value.trim();
			if (frameDurationBeatsRaw) {
				updates.frameDurationBeats = JSON.parse(frameDurationBeatsRaw);
			}
			await api(`/clips/${encodeURIComponent(clip.clipId)}`, { method: 'PUT', body: JSON.stringify(updates) });
			setStatus(statusSpan, 'Saved', 'is-ok');
			await loadLibrary();
		} catch (error) {
			setStatus(statusSpan, error.message, 'is-err');
		}
	});

	const actionsRow = document.createElement('div');
	actionsRow.className = 'clip-edit-actions';
	actionsRow.append(saveButton, statusSpan);
	form.append(actionsRow);

	return form;
}

function createField(labelText, input) {
	const label = document.createElement('label');
	label.className = 'clip-edit-field';
	label.append(labelText, input);
	return label;
}

function createNumberInput(name, value, min) {
	const input = document.createElement('input');
	input.type = 'number';
	input.name = name;
	input.min = min;
	if (value !== null && value !== undefined) {
		input.value = value;
	}
	return input;
}

function createCheckbox(name, checked) {
	const input = document.createElement('input');
	input.type = 'checkbox';
	input.name = name;
	input.checked = !!checked;
	return input;
}

function createTextInput(name, value) {
	const input = document.createElement('input');
	input.type = 'text';
	input.name = name;
	input.value = value;
	return input;
}

async function deleteClip(clipId) {
	if (!confirm(`Delete clip "${clipId}"? This removes it from the bucket.`)) {
		return;
	}
	try {
		await api(`/clips/${encodeURIComponent(clipId)}`, { method: 'DELETE' });
		await loadLibrary();
	} catch (error) {
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
	const body = document.getElementById('mapping-body');
	body.replaceChildren();
	updateMappingSummary();
	updatePianoKeyboard();
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

function updateMappingSummary() {
	const summary = document.getElementById('mapping-summary');
	summary.replaceChildren();
	const mappedClipIds = new Set(mappingState.map(entry => entry.clipId));
	const readyClips = clipCatalog.filter(clip => clip.pipelineReady);
	const unmappedClips = readyClips.filter(clip => !mappedClipIds.has(clip.clipId));

	const slotCount = document.createElement('span');
	slotCount.className = 'mapping-summary-count';
	slotCount.textContent = `${mappingState.length} mapped slot${mappingState.length === 1 ? '' : 's'}`;
	summary.append(slotCount);

	if (unmappedClips.length > 0) {
		const unmappedLabel = document.createElement('span');
		unmappedLabel.className = 'mapping-summary-unmapped';
		const clipNames = unmappedClips.map(clip => clip.clipId).sort();
		unmappedLabel.textContent = `Unmapped: ${clipNames.join(', ')}`;
		summary.append(unmappedLabel);
	}
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
