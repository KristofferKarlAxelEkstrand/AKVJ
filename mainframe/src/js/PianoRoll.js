import '../scss/PianoRoll.scss';
import './KeyBed.js';
import './PreviewClip.js';
import { EVENT_PIANOROLL_KEY_CLICK_REQUEST, EVENT_PIANOROLL_MAPPING_CHANGE_REQUEST, EVENT_PIANOROLL_MAPPING_REMOVE_REQUEST, EVENT_PIANOROLL_MAPPING_ADD_REQUEST, EVENT_PIANOROLL_MAPPING_MOVE_REQUEST, MIME_AKVJ_CLIP_ID } from './PianoKey.js';
import { assignCells, cellKey, changedNotes, cloneMappings, deleteCells, movePlacement, noteEntries, replaceNoteMappings } from './pianoRollMappingEdit.js';
import { resolveTriggerType } from './clipSchema.js';

const VALID_MODES = new Set(['edit', 'select', 'filter', 'play']);
const UI_MODES = ['edit', 'filter', 'play'];
const DEFAULT_PREVIEW_VELOCITY = 100;
const PREVIEW_CLIP_TAG = 'preview-clip';
const MAX_UNDO = 40;

/** Public custom events emitted by `<piano-roll>` (namespaced for consistency). */
export const EVENT_PIANOROLL_KEY_CLICK = 'pianoroll:key-click';
export const EVENT_PIANOROLL_CHANNEL_CHANGED = 'pianoroll:channel-changed';
export const EVENT_PIANOROLL_MODE_CHANGED = 'pianoroll:mode-changed';
export const EVENT_PIANOROLL_FILTER_CHANGED = 'pianoroll:filter-changed';
export const EVENT_PIANOROLL_NOTE_ON = 'pianoroll:note-on';
export const EVENT_PIANOROLL_NOTE_OFF = 'pianoroll:note-off';
export const EVENT_PIANOROLL_MAPPING_CHANGED = 'pianoroll:mapping-changed';
export const EVENT_PIANOROLL_MAPPING_REMOVED = 'pianoroll:mapping-removed';
export const EVENT_PIANOROLL_MAPPING_ADDED = 'pianoroll:mapping-added';
export { EVENT_PIANOROLL_KEY_CLICK_REQUEST, EVENT_PIANOROLL_MAPPING_CHANGE_REQUEST, EVENT_PIANOROLL_MAPPING_REMOVE_REQUEST, EVENT_PIANOROLL_MAPPING_ADD_REQUEST, EVENT_PIANOROLL_MAPPING_MOVE_REQUEST };

const MODE_LABELS = {
	edit: 'Edit',
	select: 'Filter',
	filter: 'Filter',
	play: 'Play'
};

const FILTER_DEFAULTS = {
	clipId: '',
	triggerType: '',
	role: '',
	layerGroup: '',
	showOnlyPopulated: false
};

/** localStorage key prefix; suffixed with element `id` or `filter-storage-key`. */
const FILTER_STORAGE_PREFIX = 'akvj:piano-roll:filters:';

/**
 * @param {unknown} value
 * @returns {typeof FILTER_DEFAULTS|null}
 */
function sanitizeFilterState(value) {
	if (!value || typeof value !== 'object') {
		return null;
	}
	const raw = /** @type {Record<string, unknown>} */ (value);
	return {
		clipId: typeof raw.clipId === 'string' ? raw.clipId : FILTER_DEFAULTS.clipId,
		triggerType: typeof raw.triggerType === 'string' ? raw.triggerType : FILTER_DEFAULTS.triggerType,
		role: typeof raw.role === 'string' ? raw.role : FILTER_DEFAULTS.role,
		layerGroup: typeof raw.layerGroup === 'string' ? raw.layerGroup : FILTER_DEFAULTS.layerGroup,
		showOnlyPopulated: Boolean(raw.showOnlyPopulated)
	};
}

/**
 * @param {number} channel - DAW channel (1–16)
 * @returns {string}
 */
function channelLayerGroup(channel) {
	if (channel >= 1 && channel <= 4) {
		return 'A';
	}
	if (channel === 5) {
		return 'Mixer';
	}
	if (channel >= 6 && channel <= 9) {
		return 'B';
	}
	if (channel === 10) {
		return 'Mixed';
	}
	if (channel >= 11 && channel <= 12) {
		return 'C';
	}
	if (channel === 13) {
		return 'Global';
	}
	if (channel === 14) {
		return 'Project';
	}
	return 'Reserved';
}

const CHANNEL_LABELS = {
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
	14: 'Project selection',
	15: 'Reserved',
	16: 'Reserved'
};

/**
 * PianoRoll — unified 128-key piano roll with edit / filter / play modes.
 *
 * - edit: velocity regions with breakpoint handles; empty-key click assigns, region click selects
 * - filter: note selector plus clip/role/trigger/layer filters that dim non-matching cells
 * - select: legacy note selector (kept for API compatibility; maps to the filter view)
 * - play: multi-select sticky keys for trying the mapping
 *
 * Optional `channel-select` attribute renders a per-instance MIDI channel selector.
 *
 * @fires PianoRoll#pianoroll:key-click - `{ detail: { note, clipId, velocity, isActive, mode, action, mappings } }`
 * @fires PianoRoll#pianoroll:channel-changed - `{ detail: { channel } }`
 * @fires PianoRoll#pianoroll:mode-changed - `{ detail: { mode } }`
 * @fires PianoRoll#pianoroll:filter-changed - `{ detail: { filters } }`
 * @fires PianoRoll#pianoroll:note-on - play mode
 * @fires PianoRoll#pianoroll:note-off - play mode
 * @fires PianoRoll#pianoroll:mapping-changed - edit mode breakpoint drag `{ channel, note, oldVelocity, newVelocity, clipId }`
 * @fires PianoRoll#pianoroll:mapping-removed - edit mode region right-click `{ channel, note, clipId, velocity, mappings }`
 * @fires PianoRoll#pianoroll:mapping-added - edit mode clip drop `{ channel, note, clipId, velocity, mappings }`
 */
class PianoRoll extends HTMLElement {
	/** @type {Array<{channel: number, note: number, velocity: number, clipId: string}>} */
	#mappings = [];
	/** @type {Array<{clipId: string, meta: object}>} */
	#clips = [];
	#channel = 1;
	#mode = 'edit';
	/** @type {number|null} */
	#selectedNote = null;
	/** @type {Set<number>} */
	#activeNotes = new Set();
	#hasRenderedKeys = false;
	#keyBed = null;
	#toolbar = null;
	#channelBar = null;
	#channelSelect = null;
	#modeButtons = new Map();
	#viewStack = null;
	#editView = null;
	#filterView = null;
	#playView = null;
	#filterControls = {};
	#filterSummary = null;
	#tooltip = null;
	/** @type {object} */
	#filterState = { ...FILTER_DEFAULTS };
	// Play mode state
	#playVelocity = DEFAULT_PREVIEW_VELOCITY;
	#velocitySlider = null;
	#velocityReadout = null;
	#previewClip = null;
	#previewEmpty = null;
	/** @type {number|null} */
	#lastPreviewNote = null;
	/** @type {Array<Array<{channel: number, note: number, velocity: number, clipId: string}>>} */
	#undoStack = [];
	/** @type {Array<Array<{channel: number, note: number, velocity: number, clipId: string}>>} */
	#redoStack = [];
	#suppressHistoryReset = false;
	/** @type {Set<string>} */
	#selectedCells = new Set();
	#batchDragSelecting = false;
	#editToolbar = null;
	#undoButton = null;
	#redoButton = null;
	#deleteSelectedButton = null;
	#clearSelectionButton = null;
	#assignClipId = '';
	#assignInput = null;
	#boundHandlePreviewEnded = this.#handlePreviewEnded.bind(this);
	#boundHandleKeyClick = this.#handleKeyClick.bind(this);
	#boundHandleMappingChange = this.#handleMappingChange.bind(this);
	#boundHandleMappingRemove = this.#handleMappingRemove.bind(this);
	#boundHandleMappingAdd = this.#handleMappingAdd.bind(this);
	#boundHandleMappingMove = this.#handleMappingMove.bind(this);
	#boundHandleMouseMove = this.#handleMouseMove.bind(this);
	#boundHideTooltip = this.#hideTooltip.bind(this);
	#boundHandleKeyDown = this.#handleEditKeyDown.bind(this);
	#boundBatchPointerDown = this.#handleBatchPointerDown.bind(this);
	#boundBatchPointerMove = this.#handleBatchPointerMove.bind(this);
	#boundBatchPointerUp = this.#handleBatchPointerUp.bind(this);

	static get observedAttributes() {
		return ['channel', 'mode', 'channel-select'];
	}

	attributeChangedCallback(name, oldValue, value) {
		if (oldValue === value) {
			return;
		}
		if (name === 'channel') {
			this.#channel = Number(value) || 1;
			if (this.#channelSelect) {
				this.#channelSelect.value = String(this.#channel);
			}
			this.#updateMappedKeys();
		}
		if (name === 'mode') {
			const previousMode = this.#mode;
			this.#mode = VALID_MODES.has(value) ? value : 'edit';
			this.#selectedNote = null;
			this.#activeNotes.clear();
			this.#clearBatchSelection();
			if (previousMode === 'play' && this.#mode !== 'play') {
				this.#stopPreview();
				this.#lastPreviewNote = null;
			}
			this.#syncModeClasses();
			this.#updateMappedKeys();
			this.#updateActiveKeys();
			this.#syncViewVisibility();
			this.#syncModeButtons();
			this.#syncEditToolbar();
			if (previousMode !== this.#mode) {
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_MODE_CHANGED, {
						bubbles: true,
						detail: { mode: this.#mode }
					})
				);
			}
		}
		if (name === 'channel-select' && this.isConnected) {
			this.#render();
		}
	}

	/**
	 * @param {'edit'|'select'|'filter'|'play'} mode
	 */
	set mode(mode) {
		this.setAttribute('mode', mode);
	}

	get mode() {
		return this.#mode;
	}

	/**
	 * @param {number} channel - DAW channel (1–16)
	 */
	set channel(channel) {
		this.setAttribute('channel', String(channel));
	}

	get channel() {
		return this.#channel;
	}

	/**
	 * @param {boolean} enabled
	 */
	set channelSelect(enabled) {
		if (enabled) {
			this.setAttribute('channel-select', '');
		} else {
			this.removeAttribute('channel-select');
		}
	}

	get channelSelect() {
		return this.hasAttribute('channel-select');
	}

	/**
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} mappings
	 */
	set mappings(mappings) {
		this.#mappings = Array.isArray(mappings) ? mappings : [];
		if (!this.#suppressHistoryReset) {
			this.#undoStack = [];
			this.#redoStack = [];
		}
		if (this.#hasRenderedKeys) {
			this.#updateMappedKeys();
			this.#syncRegionSelection();
		} else {
			this.#render();
		}
	}

	get mappings() {
		return this.#mappings;
	}

	/**
	 * @param {Array<{clipId: string, meta: object}>} clips
	 */
	set clips(clips) {
		this.#clips = Array.isArray(clips) ? clips : [];
	}

	/**
	 * @returns {Array<{clipId: string, meta: object}>}
	 */
	get clips() {
		return this.#clips;
	}

	/**
	 * @returns {number|null}
	 */
	get selectedNote() {
		return this.#selectedNote;
	}

	/**
	 * @param {object} filters
	 */
	set filters(filters) {
		this.#filterState = { ...FILTER_DEFAULTS, ...filters };
		this.#syncFilterControls();
		this.#updateFilterSummary();
		if (this.#hasRenderedKeys) {
			this.#applyFilterMask();
		}
		this.#persistFilters();
		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_FILTER_CHANGED, {
				bubbles: true,
				detail: { filters: { ...this.#filterState } }
			})
		);
	}

	get filters() {
		return { ...this.#filterState };
	}

	resetFilters() {
		this.filters = { ...FILTER_DEFAULTS };
	}

	connectedCallback() {
		if (!this.hasAttribute('mode')) {
			this.setAttribute('mode', this.#mode);
		}
		if (!this.hasAttribute('channel')) {
			this.setAttribute('channel', String(this.#channel));
		}
		this.#syncModeClasses();
		this.tabIndex = 0;
		this.addEventListener(EVENT_PIANOROLL_KEY_CLICK_REQUEST, this.#boundHandleKeyClick);
		this.addEventListener(EVENT_PIANOROLL_MAPPING_CHANGE_REQUEST, this.#boundHandleMappingChange);
		this.addEventListener(EVENT_PIANOROLL_MAPPING_REMOVE_REQUEST, this.#boundHandleMappingRemove);
		this.addEventListener(EVENT_PIANOROLL_MAPPING_ADD_REQUEST, this.#boundHandleMappingAdd);
		this.addEventListener(EVENT_PIANOROLL_MAPPING_MOVE_REQUEST, this.#boundHandleMappingMove);
		this.addEventListener('pointermove', this.#boundHandleMouseMove);
		this.addEventListener('pointerleave', this.#boundHideTooltip);
		this.addEventListener('keydown', this.#boundHandleKeyDown);
		this.addEventListener('pointerdown', this.#boundBatchPointerDown);
		const restored = this.#readPersistedFilters();
		if (restored) {
			this.#filterState = restored;
		}
		this.#render();
		if (restored) {
			this.dispatchEvent(
				new CustomEvent(EVENT_PIANOROLL_FILTER_CHANGED, {
					bubbles: true,
					detail: { filters: { ...this.#filterState } }
				})
			);
		}
	}

	disconnectedCallback() {
		this.removeEventListener(EVENT_PIANOROLL_KEY_CLICK_REQUEST, this.#boundHandleKeyClick);
		this.removeEventListener(EVENT_PIANOROLL_MAPPING_CHANGE_REQUEST, this.#boundHandleMappingChange);
		this.removeEventListener(EVENT_PIANOROLL_MAPPING_REMOVE_REQUEST, this.#boundHandleMappingRemove);
		this.removeEventListener(EVENT_PIANOROLL_MAPPING_ADD_REQUEST, this.#boundHandleMappingAdd);
		this.removeEventListener(EVENT_PIANOROLL_MAPPING_MOVE_REQUEST, this.#boundHandleMappingMove);
		this.removeEventListener('pointermove', this.#boundHandleMouseMove);
		this.removeEventListener('pointerleave', this.#boundHideTooltip);
		this.removeEventListener('keydown', this.#boundHandleKeyDown);
		this.removeEventListener('pointerdown', this.#boundBatchPointerDown);
		window.removeEventListener('pointermove', this.#boundBatchPointerMove);
		window.removeEventListener('pointerup', this.#boundBatchPointerUp);
		this.#stopPreview();
		this.replaceChildren();
		this.#keyBed = null;
		this.#toolbar = null;
		this.#channelBar = null;
		this.#channelSelect = null;
		this.#modeButtons.clear();
		this.#viewStack = null;
		this.#editView = null;
		this.#filterView = null;
		this.#playView = null;
		this.#editToolbar = null;
		this.#undoButton = null;
		this.#redoButton = null;
		this.#deleteSelectedButton = null;
		this.#clearSelectionButton = null;
		this.#assignInput = null;
		this.#filterControls = {};
		this.#filterSummary = null;
		this.#tooltip = null;
		this.#velocitySlider = null;
		this.#velocityReadout = null;
		this.#previewClip = null;
		this.#previewEmpty = null;
		this.#hasRenderedKeys = false;
		this.#selectedNote = null;
		this.#activeNotes.clear();
		this.#selectedCells.clear();
		this.#undoStack = [];
		this.#redoStack = [];
	}

	/**
	 * Clear select/play selection highlights.
	 */
	clearSelection() {
		const notesTurningOff = this.#mode === 'play' ? [...this.#activeNotes] : [];
		this.#selectedNote = null;
		this.#activeNotes.clear();
		if (this.#hasRenderedKeys) {
			this.#updateActiveKeys();
		}
		if (notesTurningOff.length > 0) {
			this.#stopPreview();
			this.#lastPreviewNote = null;
		}
		for (const note of notesTurningOff) {
			const noteMappings = this.#mappingsForNote(note);
			this.dispatchEvent(
				new CustomEvent(EVENT_PIANOROLL_NOTE_OFF, {
					bubbles: true,
					detail: {
						note,
						clipId: noteMappings[0]?.clipId ?? null,
						velocity: 0,
						mappings: noteMappings
					}
				})
			);
		}
	}

	#syncModeClasses() {
		this.classList.toggle('is-edit', this.#mode === 'edit');
		this.classList.toggle('is-select', this.#mode === 'select' || this.#mode === 'filter');
		this.classList.toggle('is-filter', this.#mode === 'filter');
		this.classList.toggle('is-play', this.#mode === 'play');
		this.classList.toggle('has-selection', this.#selectedNote !== null);
	}

	#render() {
		this.replaceChildren();
		this.#toolbar = null;
		this.#channelBar = null;
		this.#channelSelect = null;
		this.#modeButtons.clear();
		this.#viewStack = null;
		this.#editView = null;
		this.#filterView = null;
		this.#playView = null;
		this.#filterControls = {};
		this.#filterSummary = null;
		this.#tooltip = null;
		this.#velocitySlider = null;
		this.#velocityReadout = null;
		this.#previewClip = null;
		this.#previewEmpty = null;
		// Preserve filter state across re-renders so filter changes survive channel/mode switches.

		this.#toolbar = document.createElement('div');
		this.#toolbar.className = 'piano-roll-toolbar';

		this.#renderModeButtons(this.#toolbar);

		if (this.hasAttribute('channel-select')) {
			this.#channelBar = document.createElement('div');
			this.#channelBar.className = 'piano-roll-channel-bar';
			const label = document.createElement('label');
			label.textContent = 'Channel';
			this.#channelSelect = document.createElement('select');
			this.#channelSelect.className = 'piano-roll-channel';
			this.#channelSelect.setAttribute('aria-label', 'MIDI channel');
			for (let channel = 1; channel <= 16; channel++) {
				const option = document.createElement('option');
				option.value = String(channel);
				option.textContent = `Ch ${channel} — ${CHANNEL_LABELS[channel]}`;
				this.#channelSelect.append(option);
			}
			this.#channelSelect.value = String(this.#channel);
			this.#channelSelect.addEventListener('change', () => {
				const channel = Number(this.#channelSelect.value) || 1;
				this.channel = channel;
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_CHANNEL_CHANGED, {
						bubbles: true,
						detail: { channel }
					})
				);
			});
			label.append(this.#channelSelect);
			this.#channelBar.append(label);
			this.#toolbar.append(this.#channelBar);
		}

		this.append(this.#toolbar);

		this.#keyBed = document.createElement('key-bed');
		this.#keyBed.className = 'piano-roll-edit-grid';
		this.append(this.#keyBed);

		this.#renderViewStack();
		this.#renderTooltip();

		this.#hasRenderedKeys = true;
		this.#updateMappedKeys();
		this.#updateActiveKeys();
		this.#syncViewVisibility();
		this.#syncModeButtons();
	}

	#renderModeButtons(container) {
		const group = document.createElement('div');
		group.className = 'piano-roll-mode-group';
		group.setAttribute('role', 'tablist');
		group.setAttribute('aria-label', 'Piano roll mode');

		for (const mode of UI_MODES) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'piano-roll-mode-button';
			button.dataset.mode = mode;
			button.textContent = MODE_LABELS[mode];
			button.setAttribute('role', 'tab');
			button.setAttribute('aria-selected', mode === this.#mode ? 'true' : 'false');
			button.title = `Switch to ${MODE_LABELS[mode]} mode`;
			button.addEventListener('click', () => {
				this.mode = mode;
			});
			this.#modeButtons.set(mode, button);
			group.append(button);
		}

		container.append(group);
	}

	#renderViewStack() {
		this.#viewStack = document.createElement('div');
		this.#viewStack.className = 'piano-roll-view-stack';

		this.#editView = document.createElement('div');
		this.#editView.className = 'piano-roll-view piano-roll-edit-view';
		this.#editView.setAttribute('role', 'tabpanel');
		this.#editView.setAttribute('aria-label', 'Edit mode');
		this.#renderEditControls(this.#editView);

		this.#filterView = document.createElement('div');
		this.#filterView.className = 'piano-roll-view piano-roll-filter-view';
		this.#filterView.setAttribute('role', 'tabpanel');
		this.#filterView.setAttribute('aria-label', 'Filter mode');
		this.#renderFilterControls(this.#filterView);

		this.#playView = document.createElement('div');
		this.#playView.className = 'piano-roll-view piano-roll-play-view';
		this.#playView.setAttribute('role', 'tabpanel');
		this.#playView.setAttribute('aria-label', 'Play mode');
		this.#renderPlayControls(this.#playView);

		this.#viewStack.append(this.#editView, this.#filterView, this.#playView);
		this.append(this.#viewStack);
		this.#syncEditToolbar();
	}

	/**
	 * @param {HTMLElement} container
	 */
	#renderEditControls(container) {
		this.#editToolbar = document.createElement('div');
		this.#editToolbar.className = 'piano-roll-edit-controls';

		this.#undoButton = document.createElement('button');
		this.#undoButton.type = 'button';
		this.#undoButton.className = 'piano-roll-edit-undo';
		this.#undoButton.textContent = 'Undo';
		this.#undoButton.title = 'Undo (Ctrl+Z)';
		this.#undoButton.addEventListener('click', () => this.#undo());

		this.#redoButton = document.createElement('button');
		this.#redoButton.type = 'button';
		this.#redoButton.className = 'piano-roll-edit-redo';
		this.#redoButton.textContent = 'Redo';
		this.#redoButton.title = 'Redo (Ctrl+Shift+Z)';
		this.#redoButton.addEventListener('click', () => this.#redo());

		this.#deleteSelectedButton = document.createElement('button');
		this.#deleteSelectedButton.type = 'button';
		this.#deleteSelectedButton.className = 'piano-roll-edit-delete-selected';
		this.#deleteSelectedButton.textContent = 'Delete selected';
		this.#deleteSelectedButton.addEventListener('click', () => this.#batchDeleteSelected());

		this.#clearSelectionButton = document.createElement('button');
		this.#clearSelectionButton.type = 'button';
		this.#clearSelectionButton.className = 'piano-roll-edit-clear-selection';
		this.#clearSelectionButton.textContent = 'Clear selection';
		this.#clearSelectionButton.addEventListener('click', () => this.#clearBatchSelection());

		const assignLabel = document.createElement('label');
		assignLabel.className = 'piano-roll-edit-assign';
		assignLabel.textContent = 'Assign clip';
		this.#assignInput = document.createElement('input');
		this.#assignInput.type = 'text';
		this.#assignInput.className = 'piano-roll-edit-assign-input';
		this.#assignInput.placeholder = 'clipId';
		this.#assignInput.setAttribute('aria-label', 'Clip id to assign to selection');
		this.#assignInput.addEventListener('input', () => {
			this.#assignClipId = this.#assignInput.value.trim();
		});
		this.#assignInput.addEventListener('dragover', event => {
			if (![...event.dataTransfer.types].includes(MIME_AKVJ_CLIP_ID) && ![...event.dataTransfer.types].includes('text/plain')) {
				return;
			}
			event.preventDefault();
			event.dataTransfer.dropEffect = 'copy';
		});
		this.#assignInput.addEventListener('drop', event => {
			event.preventDefault();
			const clipId = (event.dataTransfer.getData(MIME_AKVJ_CLIP_ID) || event.dataTransfer.getData('text/plain') || '').trim();
			if (!clipId) {
				return;
			}
			this.#assignClipId = clipId;
			this.#assignInput.value = clipId;
			this.#batchAssignSelected(clipId);
		});
		const assignButton = document.createElement('button');
		assignButton.type = 'button';
		assignButton.className = 'piano-roll-edit-assign-button';
		assignButton.textContent = 'Assign';
		assignButton.addEventListener('click', () => {
			if (this.#assignClipId) {
				this.#batchAssignSelected(this.#assignClipId);
			}
		});
		assignLabel.append(this.#assignInput, assignButton);

		this.#editToolbar.append(this.#undoButton, this.#redoButton, this.#deleteSelectedButton, this.#clearSelectionButton, assignLabel);
		container.append(this.#editToolbar);
		this.#syncEditToolbar();
	}

	#syncEditToolbar() {
		const inEdit = this.#mode === 'edit';
		if (this.#editToolbar) {
			this.#editToolbar.hidden = !inEdit;
		}
		if (this.#undoButton) {
			this.#undoButton.disabled = !inEdit || this.#undoStack.length === 0;
		}
		if (this.#redoButton) {
			this.#redoButton.disabled = !inEdit || this.#redoStack.length === 0;
		}
		const hasSelection = this.#selectedCells.size > 0;
		if (this.#deleteSelectedButton) {
			this.#deleteSelectedButton.disabled = !inEdit || !hasSelection;
		}
		if (this.#clearSelectionButton) {
			this.#clearSelectionButton.disabled = !inEdit || !hasSelection;
		}
	}

	#renderPlayControls(container) {
		const controls = document.createElement('div');
		controls.className = 'piano-roll-play-controls';

		const velocityLabel = document.createElement('label');
		velocityLabel.className = 'piano-roll-velocity';
		velocityLabel.textContent = 'Velocity';

		this.#velocitySlider = document.createElement('input');
		this.#velocitySlider.type = 'range';
		this.#velocitySlider.className = 'piano-roll-velocity-slider';
		this.#velocitySlider.min = '0';
		this.#velocitySlider.max = '127';
		this.#velocitySlider.value = String(this.#playVelocity);
		this.#velocitySlider.setAttribute('aria-label', 'Play mode velocity');
		this.#velocitySlider.addEventListener('input', () => {
			this.#playVelocity = Number(this.#velocitySlider.value) || 0;
			this.#syncVelocityReadout();
		});

		this.#velocityReadout = document.createElement('span');
		this.#velocityReadout.className = 'piano-roll-velocity-readout';
		this.#velocityReadout.setAttribute('aria-live', 'polite');
		this.#syncVelocityReadout();

		velocityLabel.append(this.#velocitySlider, this.#velocityReadout);
		controls.append(velocityLabel);

		const previewWrap = document.createElement('div');
		previewWrap.className = 'piano-roll-preview-wrap';

		this.#previewClip = document.createElement(PREVIEW_CLIP_TAG);
		this.#previewClip.className = 'piano-roll-preview-clip';
		this.#previewClip.addEventListener('playbackended', this.#boundHandlePreviewEnded);

		this.#previewEmpty = document.createElement('div');
		this.#previewEmpty.className = 'piano-roll-preview-empty';
		this.#previewEmpty.textContent = 'Trigger a mapped key to preview its clip.';

		previewWrap.append(this.#previewClip, this.#previewEmpty);
		this.#syncPreviewVisibility();

		container.append(controls, previewWrap);
	}

	#syncVelocityReadout() {
		if (this.#velocityReadout) {
			this.#velocityReadout.textContent = String(this.#playVelocity);
		}
	}

	#syncPreviewVisibility() {
		if (!this.#previewEmpty || !this.#previewClip) {
			return;
		}
		const clipId = this.#previewClip.clipId;
		const hasClip = typeof clipId === 'string' && clipId.length > 0;
		this.#previewEmpty.hidden = hasClip;
		this.#previewClip.hidden = !hasClip;
	}

	/**
	 * Stop the inline preview and clear its clip. Called on disconnect and
	 * when the last active note turns off.
	 */
	#stopPreview() {
		if (this.#previewClip) {
			this.#previewClip.removeEventListener('playbackended', this.#boundHandlePreviewEnded);
			this.#previewClip.stop?.();
			this.#previewClip.clipId = '';
			this.#previewClip.hidden = true;
		}
		if (this.#previewEmpty) {
			this.#previewEmpty.hidden = false;
		}
	}

	/**
	 * Load a clip into the inline preview and start playback.
	 *
	 * @param {string} clipId
	 */
	#showPreview(clipId) {
		if (!this.#previewClip) {
			return;
		}
		// Re-attach in case #stopPreview removed the listener.
		this.#previewClip.addEventListener('playbackended', this.#boundHandlePreviewEnded);
		this.#previewClip.hidden = false;
		this.#previewClip.clipId = clipId;
		this.#previewClip.play();
		this.#syncPreviewVisibility();
	}

	/**
	 * `playbackended` from `<preview-clip>` — a non-looping clip finished on its own.
	 * Treat it like a note-off for the most recently triggered note so the cell
	 * indicator clears without requiring a second click.
	 */
	#handlePreviewEnded() {
		const note = this.#lastPreviewNote;
		if (note === null || !this.#activeNotes.has(note)) {
			return;
		}
		this.#activeNotes.delete(note);
		this.#updateActiveKeys();
		const noteMappings = this.#mappingsForNote(note);
		const clipId = this.#clipIdForVelocity(noteMappings, this.#playVelocity);
		if (this.#activeNotes.size === 0) {
			this.#stopPreview();
			this.#lastPreviewNote = null;
		}
		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_NOTE_OFF, {
				bubbles: true,
				detail: {
					note,
					clipId,
					velocity: this.#playVelocity,
					mappings: noteMappings
				}
			})
		);
	}

	/**
	 * Floor-select a clip for a play-mode trigger velocity (highest mapping
	 * threshold ≤ velocity), matching akvj velocity selection.
	 *
	 * @param {Array<{velocity: number, clipId: string}>} noteMappings - sorted low→high
	 * @param {number} velocity
	 * @returns {string|null}
	 */
	#clipIdForVelocity(noteMappings, velocity) {
		let chosen = null;
		for (const mapping of noteMappings) {
			if (mapping.velocity <= velocity) {
				chosen = mapping.clipId;
			} else {
				break;
			}
		}
		return chosen;
	}

	#renderFilterControls(container) {
		const controls = document.createElement('div');
		controls.className = 'piano-roll-filter-controls';

		const clipIdInput = document.createElement('input');
		clipIdInput.type = 'search';
		clipIdInput.className = 'piano-roll-filter-clip-id';
		clipIdInput.placeholder = 'Filter by clipId…';
		clipIdInput.addEventListener('input', () => {
			this.filters = { ...this.#filterState, clipId: clipIdInput.value };
		});

		const triggerSelect = document.createElement('select');
		triggerSelect.className = 'piano-roll-filter-trigger';
		triggerSelect.setAttribute('aria-label', 'Trigger type');
		for (const value of ['', 'momentary', 'latch', 'one-shot']) {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = value || 'Any trigger';
			triggerSelect.append(option);
		}
		triggerSelect.addEventListener('change', () => {
			this.filters = { ...this.#filterState, triggerType: triggerSelect.value };
		});

		const roleSelect = document.createElement('select');
		roleSelect.className = 'piano-roll-filter-role';
		roleSelect.setAttribute('aria-label', 'Role');
		for (const value of ['', 'bitmask']) {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = value || 'Any role';
			roleSelect.append(option);
		}
		roleSelect.addEventListener('change', () => {
			this.filters = { ...this.#filterState, role: roleSelect.value };
		});

		const layerGroupSelect = document.createElement('select');
		layerGroupSelect.className = 'piano-roll-filter-layer-group';
		layerGroupSelect.setAttribute('aria-label', 'Layer group');
		for (const value of ['', 'A', 'B', 'C', 'Mixer', 'Mixed', 'Global', 'Project', 'Reserved']) {
			const option = document.createElement('option');
			option.value = value;
			option.textContent = value || 'Any layer group';
			layerGroupSelect.append(option);
		}
		layerGroupSelect.addEventListener('change', () => {
			this.filters = { ...this.#filterState, layerGroup: layerGroupSelect.value };
		});

		const populatedToggle = document.createElement('label');
		populatedToggle.className = 'piano-roll-filter-populated';
		const populatedCheckbox = document.createElement('input');
		populatedCheckbox.type = 'checkbox';
		populatedCheckbox.addEventListener('change', () => {
			this.filters = { ...this.#filterState, showOnlyPopulated: populatedCheckbox.checked };
		});
		populatedToggle.append(populatedCheckbox, ' Only mapped cells');

		const clearButton = document.createElement('button');
		clearButton.type = 'button';
		clearButton.className = 'piano-roll-filter-clear';
		clearButton.textContent = 'Clear filters';
		clearButton.addEventListener('click', () => this.resetFilters());

		this.#filterControls = {
			clipId: clipIdInput,
			triggerType: triggerSelect,
			role: roleSelect,
			layerGroup: layerGroupSelect,
			showOnlyPopulated: populatedCheckbox
		};

		const summary = document.createElement('div');
		summary.className = 'piano-roll-filter-summary';
		this.#filterSummary = summary;

		controls.append(clipIdInput, triggerSelect, roleSelect, layerGroupSelect, populatedToggle, clearButton, summary);
		container.append(controls);
		this.#syncFilterControls();
		this.#updateFilterSummary();
	}

	/**
	 * @returns {string|null} localStorage key, or null when this instance should not persist
	 */
	#filterStorageKey() {
		const explicit = this.getAttribute('filter-storage-key');
		if (explicit) {
			return `${FILTER_STORAGE_PREFIX}${explicit}`;
		}
		if (this.id) {
			return `${FILTER_STORAGE_PREFIX}${this.id}`;
		}
		return null;
	}

	/**
	 * @returns {typeof FILTER_DEFAULTS|null}
	 */
	#readPersistedFilters() {
		const key = this.#filterStorageKey();
		if (!key) {
			return null;
		}
		try {
			const raw = localStorage.getItem(key);
			if (!raw) {
				return null;
			}
			return sanitizeFilterState(JSON.parse(raw));
		} catch {
			return null;
		}
	}

	#persistFilters() {
		const key = this.#filterStorageKey();
		if (!key) {
			return;
		}
		try {
			localStorage.setItem(key, JSON.stringify(this.#filterState));
		} catch {
			// Private mode / quota — filters stay in memory only.
		}
	}

	#syncFilterControls() {
		if (!this.#filterControls.clipId) {
			return;
		}
		this.#filterControls.clipId.value = this.#filterState.clipId;
		this.#filterControls.triggerType.value = this.#filterState.triggerType;
		this.#filterControls.role.value = this.#filterState.role;
		this.#filterControls.layerGroup.value = this.#filterState.layerGroup;
		this.#filterControls.showOnlyPopulated.checked = this.#filterState.showOnlyPopulated;
	}

	#updateFilterSummary() {
		if (!this.#filterSummary) {
			return;
		}
		const parts = [];
		if (this.#filterState.clipId) {
			parts.push(`clipId: ${this.#filterState.clipId}`);
		}
		if (this.#filterState.triggerType) {
			parts.push(`trigger: ${this.#filterState.triggerType}`);
		}
		if (this.#filterState.role) {
			parts.push(`role: ${this.#filterState.role}`);
		}
		if (this.#filterState.layerGroup) {
			parts.push(`layer: ${this.#filterState.layerGroup}`);
		}
		if (this.#filterState.showOnlyPopulated) {
			parts.push('mapped only');
		}
		this.#filterSummary.textContent = parts.length ? `Filters: ${parts.join(', ')}` : 'No active filters';
	}

	#renderTooltip() {
		this.#tooltip = document.createElement('div');
		this.#tooltip.className = 'piano-roll-tooltip';
		this.#tooltip.hidden = true;
		this.append(this.#tooltip);
	}

	#syncModeButtons() {
		for (const [mode, button] of this.#modeButtons) {
			const active = mode === this.#mode || (mode === 'filter' && this.#mode === 'select');
			button.classList.toggle('is-active', active);
			button.setAttribute('aria-selected', active ? 'true' : 'false');
		}
	}

	#syncViewVisibility() {
		if (!this.#editView || !this.#filterView || !this.#playView) {
			return;
		}
		this.#editView.hidden = this.#mode !== 'edit';
		this.#filterView.hidden = this.#mode !== 'select' && this.#mode !== 'filter';
		this.#playView.hidden = this.#mode !== 'play';
	}

	#keys() {
		return this.#keyBed ? this.#keyBed.keys : [];
	}

	#handleKeyClick(event) {
		const { note, velocity = null, clipId: eventClipId = null, action = 'assign', shiftKey = false } = event.detail;
		const noteMappings = this.#mappingsForNote(note);
		let clipId = eventClipId ?? noteMappings[0]?.clipId ?? null;
		let isActive = true;

		if (this.#mode === 'edit' && action === 'select' && eventClipId !== null && eventClipId !== undefined && typeof velocity === 'number') {
			this.#toggleOrSetBatchCell(note, velocity, eventClipId, shiftKey);
			if (eventClipId) {
				this.#assignClipId = eventClipId;
				if (this.#assignInput) {
					this.#assignInput.value = eventClipId;
				}
			}
		} else if (this.#mode === 'select' || this.#mode === 'filter') {
			if (this.#selectedNote === note) {
				this.#selectedNote = null;
				isActive = false;
			} else {
				this.#selectedNote = note;
				isActive = true;
			}
			this.#updateActiveKeys();
		} else if (this.#mode === 'play') {
			if (this.#activeNotes.has(note)) {
				this.#activeNotes.delete(note);
				isActive = false;
			} else {
				this.#activeNotes.add(note);
				isActive = true;
			}
			// Click Y within the key overrides the slider; fall back to the slider value.
			const triggerVelocity = typeof velocity === 'number' && velocity >= 0 ? velocity : this.#playVelocity;
			clipId = eventClipId ?? this.#clipIdForVelocity(noteMappings, triggerVelocity);
			if (isActive) {
				this.#playVelocity = triggerVelocity;
				if (this.#velocitySlider) {
					this.#velocitySlider.value = String(triggerVelocity);
				}
				this.#syncVelocityReadout();
			}
			this.#updateActiveKeys();
			if (isActive && clipId) {
				this.#lastPreviewNote = note;
				this.#showPreview(clipId);
			} else if (this.#activeNotes.size === 0) {
				this.#stopPreview();
				this.#lastPreviewNote = null;
			}
			this.dispatchEvent(
				new CustomEvent(isActive ? EVENT_PIANOROLL_NOTE_ON : EVENT_PIANOROLL_NOTE_OFF, {
					bubbles: true,
					detail: {
						note,
						clipId,
						velocity: triggerVelocity,
						mappings: noteMappings
					}
				})
			);
		}

		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_KEY_CLICK, {
				bubbles: true,
				detail: {
					note,
					clipId,
					velocity,
					isActive,
					mode: this.#mode,
					action: this.#mode === 'edit' ? action : 'select',
					mappings: noteMappings
				}
			})
		);
	}

	/**
	 * @param {CustomEvent} event
	 */
	#handleMappingChange(event) {
		if (this.#mode !== 'edit') {
			return;
		}
		event.stopPropagation();
		const { note, oldVelocity, newVelocity, clipId } = event.detail;
		this.#commitMappings(
			this.#mappings.map(entry => {
				if (entry.channel === this.#channel && entry.note === note && entry.velocity === oldVelocity && entry.clipId === clipId) {
					return { ...entry, velocity: newVelocity };
				}
				return entry;
			}),
			() => {
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_MAPPING_CHANGED, {
						bubbles: true,
						detail: {
							channel: this.#channel,
							note,
							oldVelocity,
							newVelocity,
							clipId
						}
					})
				);
			}
		);
	}

	/**
	 * @param {CustomEvent} event
	 */
	#handleMappingRemove(event) {
		if (this.#mode !== 'edit') {
			return;
		}
		event.stopPropagation();
		const { note, clipId, velocity, mappings } = event.detail;
		this.#commitMappings(replaceNoteMappings(this.#mappings, this.#channel, note, mappings), () => {
			this.dispatchEvent(
				new CustomEvent(EVENT_PIANOROLL_MAPPING_REMOVED, {
					bubbles: true,
					detail: {
						channel: this.#channel,
						note,
						clipId,
						velocity,
						mappings
					}
				})
			);
		});
	}

	/**
	 * @param {CustomEvent} event
	 */
	#handleMappingAdd(event) {
		if (this.#mode !== 'edit') {
			return;
		}
		event.stopPropagation();
		const { note, clipId, velocity, mappings } = event.detail;
		this.#commitMappings(replaceNoteMappings(this.#mappings, this.#channel, note, mappings), () => {
			this.dispatchEvent(
				new CustomEvent(EVENT_PIANOROLL_MAPPING_ADDED, {
					bubbles: true,
					detail: {
						channel: this.#channel,
						note,
						clipId,
						velocity,
						mappings
					}
				})
			);
		});
	}

	/**
	 * @param {CustomEvent} event
	 */
	#handleMappingMove(event) {
		if (this.#mode !== 'edit') {
			return;
		}
		event.stopPropagation();
		const before = this.#mappings;
		const next = movePlacement(before, this.#channel, event.detail);
		if (!next) {
			return;
		}
		this.#commitMappings(next, () => {
			for (const note of changedNotes(before, next, this.#channel)) {
				const noteMappings = noteEntries(next, this.#channel, note);
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_MAPPING_REMOVED, {
						bubbles: true,
						detail: {
							channel: this.#channel,
							note,
							clipId: event.detail.sourceClipId,
							velocity: event.detail.sourceVelocity,
							mappings: noteMappings
						}
					})
				);
			}
		});
	}

	/**
	 * Apply a new mappings array, push undo, update keys, notify consumer via `emit`.
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} next
	 * @param {() => void} emit
	 */
	#commitMappings(next, emit) {
		this.#pushUndoSnapshot();
		const previous = this.#mappings;
		this.#mappings = next;
		this.#updateMappedKeys();
		this.#syncRegionSelection();
		this.#suppressHistoryReset = true;
		emit();
		queueMicrotask(() => {
			this.#suppressHistoryReset = false;
		});
		void previous;
		this.#syncEditToolbar();
	}

	#pushUndoSnapshot() {
		this.#undoStack.push(cloneMappings(this.#mappings));
		if (this.#undoStack.length > MAX_UNDO) {
			this.#undoStack.shift();
		}
		this.#redoStack = [];
		this.#syncEditToolbar();
	}

	#undo() {
		if (this.#mode !== 'edit' || this.#undoStack.length === 0) {
			return;
		}
		const previous = this.#undoStack.pop();
		this.#redoStack.push(cloneMappings(this.#mappings));
		this.#applyHistorySnapshot(previous);
	}

	#redo() {
		if (this.#mode !== 'edit' || this.#redoStack.length === 0) {
			return;
		}
		const next = this.#redoStack.pop();
		this.#undoStack.push(cloneMappings(this.#mappings));
		this.#applyHistorySnapshot(next);
	}

	/**
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} snapshot
	 */
	#applyHistorySnapshot(snapshot) {
		const before = this.#mappings;
		this.#mappings = cloneMappings(snapshot);
		this.#updateMappedKeys();
		this.#syncRegionSelection();
		this.#suppressHistoryReset = true;
		for (const note of changedNotes(before, this.#mappings, this.#channel)) {
			const noteMappings = noteEntries(this.#mappings, this.#channel, note);
			this.dispatchEvent(
				new CustomEvent(EVENT_PIANOROLL_MAPPING_REMOVED, {
					bubbles: true,
					detail: {
						channel: this.#channel,
						note,
						clipId: noteMappings[0]?.clipId ?? null,
						velocity: noteMappings[0]?.velocity ?? 0,
						mappings: noteMappings
					}
				})
			);
		}
		queueMicrotask(() => {
			this.#suppressHistoryReset = false;
		});
		this.#syncEditToolbar();
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	#handleEditKeyDown(event) {
		if (this.#mode !== 'edit') {
			return;
		}
		const meta = event.ctrlKey || event.metaKey;
		if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
			event.preventDefault();
			this.#undo();
			return;
		}
		if (meta && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
			event.preventDefault();
			this.#redo();
			return;
		}
		if ((event.key === 'Delete' || event.key === 'Backspace') && this.#selectedCells.size > 0) {
			const tag = event.target?.tagName;
			if (tag === 'INPUT' || tag === 'TEXTAREA') {
				return;
			}
			event.preventDefault();
			this.#batchDeleteSelected();
		}
	}

	/**
	 * @param {PointerEvent} event
	 */
	#handleBatchPointerDown(event) {
		if (this.#mode !== 'edit' || event.button !== 0) {
			return;
		}
		const region = event.target.closest?.('.velocity-region');
		if (!region || !this.contains(region) || event.target.closest('.velocity-handle')) {
			return;
		}
		// Don't start batch-drag when starting an HTML5 drag of the region.
		if (region.draggable) {
			// Still allow shift-click multi-select via key-click; drag-select uses pointer capture only when Shift held.
			if (!event.shiftKey) {
				return;
			}
		}
		this.#batchDragSelecting = true;
		window.addEventListener('pointermove', this.#boundBatchPointerMove);
		window.addEventListener('pointerup', this.#boundBatchPointerUp);
	}

	/**
	 * @param {PointerEvent} event
	 */
	#handleBatchPointerMove(event) {
		if (!this.#batchDragSelecting) {
			return;
		}
		const el = document.elementFromPoint(event.clientX, event.clientY);
		const region = el?.closest?.('.velocity-region');
		if (!region || !this.contains(region)) {
			return;
		}
		const key = region.closest('piano-key');
		const note = key ? Number(key.dataset.note) : NaN;
		const velocity = Number(region.dataset.velocity);
		const clipId = region.dataset.clipId;
		if (Number.isNaN(note) || Number.isNaN(velocity) || !clipId) {
			return;
		}
		this.#selectedCells.add(cellKey(note, velocity, clipId));
		this.#syncRegionSelection();
		this.#syncEditToolbar();
	}

	#handleBatchPointerUp() {
		this.#batchDragSelecting = false;
		window.removeEventListener('pointermove', this.#boundBatchPointerMove);
		window.removeEventListener('pointerup', this.#boundBatchPointerUp);
	}

	/**
	 * @param {number} note
	 * @param {number} velocity
	 * @param {string} clipId
	 * @param {boolean} shiftKey
	 */
	#toggleOrSetBatchCell(note, velocity, clipId, shiftKey) {
		const key = cellKey(note, velocity, clipId);
		if (!shiftKey) {
			this.#selectedCells.clear();
			this.#selectedCells.add(key);
		} else if (this.#selectedCells.has(key)) {
			this.#selectedCells.delete(key);
		} else {
			this.#selectedCells.add(key);
		}
		this.#syncRegionSelection();
		this.#syncEditToolbar();
	}

	#clearBatchSelection() {
		this.#selectedCells.clear();
		this.#syncRegionSelection();
		this.#syncEditToolbar();
	}

	#syncRegionSelection() {
		if (!this.#hasRenderedKeys) {
			return;
		}
		for (const key of this.#keys()) {
			for (const region of key.querySelectorAll('.velocity-region')) {
				const id = cellKey(key.note, Number(region.dataset.velocity), region.dataset.clipId);
				region.classList.toggle('is-batch-selected', this.#selectedCells.has(id));
			}
		}
	}

	/**
	 * @returns {Array<{note: number, velocity: number, clipId: string}>}
	 */
	#selectedCellList() {
		const cells = [];
		for (const key of this.#selectedCells) {
			const [note, velocity, ...clipParts] = key.split(':');
			cells.push({ note: Number(note), velocity: Number(velocity), clipId: clipParts.join(':') });
		}
		return cells;
	}

	#batchDeleteSelected() {
		const cells = this.#selectedCellList();
		if (cells.length === 0) {
			return;
		}
		const before = this.#mappings;
		const next = deleteCells(before, this.#channel, cells);
		this.#commitMappings(next, () => {
			for (const note of changedNotes(before, next, this.#channel)) {
				const noteMappings = noteEntries(next, this.#channel, note);
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_MAPPING_REMOVED, {
						bubbles: true,
						detail: {
							channel: this.#channel,
							note,
							clipId: cells.find(cell => cell.note === note)?.clipId ?? null,
							velocity: cells.find(cell => cell.note === note)?.velocity ?? 0,
							mappings: noteMappings
						}
					})
				);
			}
		});
		this.#clearBatchSelection();
	}

	/**
	 * @param {string} clipId
	 */
	#batchAssignSelected(clipId) {
		const cells = this.#selectedCellList();
		if (!clipId || cells.length === 0) {
			return;
		}
		const before = this.#mappings;
		const next = assignCells(this.#mappings, this.#channel, cells, clipId);
		this.#commitMappings(next, () => {
			for (const note of changedNotes(before, next, this.#channel)) {
				const noteMappings = noteEntries(next, this.#channel, note);
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_MAPPING_ADDED, {
						bubbles: true,
						detail: {
							channel: this.#channel,
							note,
							clipId,
							velocity: noteMappings[0]?.velocity ?? 0,
							mappings: noteMappings
						}
					})
				);
			}
		});
	}

	#mappingsForNote(note) {
		return this.#mappings.filter(mapping => mapping.channel === this.#channel && mapping.note === note).sort((a, b) => a.velocity - b.velocity);
	}

	#updateMappedKeys() {
		if (!this.#hasRenderedKeys || !this.#keyBed) {
			return;
		}
		const channelMappings = this.#mappings.filter(mapping => mapping.channel === this.#channel);
		this.#keyBed.applyChannelMappings(channelMappings, this.#mode);
		this.#syncRegionSelection();
	}

	#updateActiveKeys() {
		if (!this.#hasRenderedKeys) {
			return;
		}
		const hasSelectSelection = (this.#mode === 'select' || this.#mode === 'filter') && this.#selectedNote !== null;
		this.classList.toggle('has-selection', hasSelectSelection);

		for (const key of this.#keys()) {
			if (this.#mode === 'select' || this.#mode === 'filter') {
				key.active = key.note === this.#selectedNote;
				key.dimmed = false;
			} else if (this.#mode === 'play') {
				key.active = this.#activeNotes.has(key.note);
				key.dimmed = false;
			} else {
				key.active = false;
				key.dimmed = false;
			}
		}
		this.#applyFilterMask();
	}

	#applyFilterMask() {
		if (!this.#hasRenderedKeys || !this.#keyBed) {
			return;
		}
		const currentLayerGroup = channelLayerGroup(this.#channel);

		for (const key of this.#keys()) {
			const regions = [...key.querySelectorAll('.velocity-region')];
			let hasMatchingRegion = false;

			for (const region of regions) {
				const match = this.#regionMatchesFilter(region, currentLayerGroup);
				region.classList.toggle('is-filtered-out', !match);
				if (match) {
					hasMatchingRegion = true;
				}
			}

			if (this.#mode !== 'filter' && this.#mode !== 'select') {
				key.dimmed = false;
				for (const region of regions) {
					region.classList.remove('is-filtered-out');
				}
				continue;
			}

			const noRegions = regions.length === 0;
			const shouldDimUnmapped = this.#filterState.showOnlyPopulated && noRegions;
			const shouldDimNoMatch = !noRegions && !hasMatchingRegion;
			key.dimmed = shouldDimUnmapped || shouldDimNoMatch;
		}
	}

	/**
	 * @param {HTMLElement} region
	 * @param {string} currentLayerGroup
	 * @returns {boolean}
	 */
	#regionMatchesFilter(region, currentLayerGroup) {
		const clipId = region.dataset.clipId;
		if (!clipId) {
			return false;
		}

		if (this.#filterState.clipId && !clipId.toLowerCase().includes(this.#filterState.clipId.toLowerCase())) {
			return false;
		}

		if (this.#filterState.layerGroup && currentLayerGroup !== this.#filterState.layerGroup) {
			return false;
		}

		const clip = this.#clips.find(entry => entry.clipId === clipId);

		if (this.#filterState.triggerType && resolveTriggerType(clip?.meta?.triggerType) !== this.#filterState.triggerType) {
			return false;
		}

		if (this.#filterState.role && clip?.meta?.role !== this.#filterState.role) {
			return false;
		}

		return true;
	}

	/**
	 * @param {PointerEvent} event
	 */
	#handleMouseMove(event) {
		if (!this.#tooltip || this.#mode !== 'edit') {
			return;
		}
		const region = event.target.closest('.velocity-region');
		if (!region) {
			this.#hideTooltip();
			return;
		}

		const key = region.closest('piano-key');
		const clipId = region.dataset.clipId;
		const velocity = Number(region.dataset.velocity);
		const note = key ? Number(key.dataset.note) : null;

		if (!clipId || Number.isNaN(velocity) || note === null) {
			this.#hideTooltip();
			return;
		}

		const clip = this.#clips.find(entry => entry.clipId === clipId);
		const name = clip?.meta?.name ?? '';
		const triggerType = clip?.meta?.triggerType ?? '';

		const lines = [clipId];
		if (name) {
			lines.push(`Name: ${name}`);
		}
		if (triggerType) {
			lines.push(`Trigger: ${triggerType}`);
		}
		lines.push(`Note ${note} · Velocity ${velocity}`);

		this.#tooltip.replaceChildren();
		for (const [index, line] of lines.entries()) {
			if (index > 0) {
				this.#tooltip.append(document.createElement('br'));
			}
			this.#tooltip.append(document.createTextNode(line));
		}
		this.#tooltip.hidden = false;
		this.#positionTooltip(event.clientX, event.clientY);
	}

	#hideTooltip() {
		if (this.#tooltip) {
			this.#tooltip.hidden = true;
		}
	}

	/**
	 * @param {number} clientX
	 * @param {number} clientY
	 */
	#positionTooltip(clientX, clientY) {
		if (!this.#tooltip) {
			return;
		}
		const rect = this.getBoundingClientRect();
		const x = clientX - rect.left + 12;
		const y = clientY - rect.top + 12;
		this.#tooltip.style.left = `${x}px`;
		this.#tooltip.style.top = `${y}px`;
	}
}

customElements.define('piano-roll', PianoRoll);

export { PianoRoll };
