import '../scss/PianoKey.scss';

const PIANO_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PIANO_BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];
const VELOCITY_RANGE = 128;
const MIN_VELOCITY_GAP = 1;
const MIN_REGION_LABEL_HEIGHT_PX = 14;
const MIN_REGION_VELOCITY = 2;
const HUE_DEGREES = 360;

/**
 * @param {number} note - MIDI note number (0–127)
 * @returns {boolean}
 */
function isBlackKey(note) {
	return PIANO_BLACK_KEY_OFFSETS.includes(note % 12);
}

/**
 * @param {number} note
 * @returns {string}
 */
function noteLabel(note) {
	return `${PIANO_NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

/**
 * Hue derived from chromatic note class for consistent per-key coloring.
 * @param {number} note
 * @returns {number} hue degrees 0–360
 */
function noteHue(note) {
	return (note % 12) * 30;
}

/**
 * Hue derived from clip id for region color swatches.
 * @param {string} clipId
 * @returns {number} hue degrees 0–360
 */
function clipHue(clipId) {
	let hash = 0;
	for (let index = 0; index < clipId.length; index++) {
		hash = (hash * 31 + clipId.charCodeAt(index)) >>> 0;
	}
	return hash % HUE_DEGREES;
}

/**
 * Build velocity bands from sorted mapping entries for one note.
 * Each band spans from its velocity to the next band's velocity (or 128).
 *
 * @param {Array<{velocity: number, clipId: string, overrides?: Record<string, unknown>}>} entries
 * @returns {Array<{velocity: number, clipId: string, start: number, end: number, overrides?: Record<string, unknown>}>}
 */
function buildVelocityBands(entries) {
	const sorted = [...entries].sort((a, b) => a.velocity - b.velocity);
	return sorted.map((entry, index) => {
		const start = entry.velocity;
		const end = index + 1 < sorted.length ? sorted[index + 1].velocity : VELOCITY_RANGE;
		const band = {
			velocity: entry.velocity,
			clipId: entry.clipId,
			start,
			end: Math.max(end, start + MIN_VELOCITY_GAP)
		};
		if (entry.overrides) {
			band.overrides = entry.overrides;
		}
		return band;
	});
}

/**
 * Evenly redistribute clip velocities across 0–127 (spec: breakpoint i at round(128 * i / N)).
 * Accepts clip id strings or `{ clipId, overrides? }` so placement overrides survive redistribute.
 * @param {Array<string|{clipId: string, overrides?: Record<string, unknown>}>} items - ordered low→high velocity
 * @returns {Array<{clipId: string, velocity: number, overrides?: Record<string, unknown>}>}
 */
function redistributeVelocities(items) {
	const count = items.length;
	if (count === 0) {
		return [];
	}
	return items.map((item, index) => {
		const clipId = typeof item === 'string' ? item : item.clipId;
		const entry = {
			clipId,
			velocity: Math.round((VELOCITY_RANGE * index) / count)
		};
		const overrides = typeof item === 'object' && item?.overrides ? { ...item.overrides } : null;
		if (overrides) {
			entry.overrides = overrides;
		}
		return entry;
	});
}

/**
 * Choose insertion index for a drop velocity among existing bands (low→high).
 * Drop below a region's midpoint inserts before that region; otherwise after.
 *
 * @param {number} dropVelocity - 0–127 from bottom of key
 * @param {Array<{start: number, end: number}>} bands
 * @returns {number}
 */
function insertionIndexForDropVelocity(dropVelocity, bands) {
	for (let index = 0; index < bands.length; index++) {
		const mid = (bands[index].start + bands[index].end) / 2;
		if (dropVelocity < mid) {
			return index;
		}
	}
	return bands.length;
}

/** Clip id MIME used by clip list drag sources and region reorder. */
export const MIME_AKVJ_CLIP_ID = 'application/x-akvj-clip-id';
/** JSON `{ note, velocity, clipId }` when dragging an existing velocity region. */
export const MIME_AKVJ_MAPPING_MOVE = 'application/x-akvj-mapping-move';

/** Bubbling request events from `<piano-key>` → `<piano-roll>` (namespaced like public pianoroll:*). */
export const EVENT_PIANOROLL_KEY_CLICK_REQUEST = 'pianoroll:key-click-request';
export const EVENT_PIANOROLL_MAPPING_CHANGE_REQUEST = 'pianoroll:mapping-change-request';
export const EVENT_PIANOROLL_MAPPING_REMOVE_REQUEST = 'pianoroll:mapping-remove-request';
export const EVENT_PIANOROLL_MAPPING_ADD_REQUEST = 'pianoroll:mapping-add-request';
export const EVENT_PIANOROLL_MAPPING_MOVE_REQUEST = 'pianoroll:mapping-move-request';

/**
 * PianoKey — individual piano key with mapped/active states and optional velocity regions.
 *
 * @fires PianoKey#pianoroll:key-click-request - `{ detail: { note, velocity?, clipId?, action, shiftKey? } }` (bubbles)
 * @fires PianoKey#pianoroll:mapping-change-request - `{ detail: { note, oldVelocity, newVelocity, clipId } }` (bubbles)
 * @fires PianoKey#pianoroll:mapping-remove-request - `{ detail: { note, clipId, velocity, mappings } }` (bubbles)
 * @fires PianoKey#pianoroll:mapping-add-request - `{ detail: { note, clipId, velocity, mappings } }` (bubbles)
 * @fires PianoKey#pianoroll:mapping-move-request - `{ detail: { sourceNote, sourceVelocity, sourceClipId, targetNote, targetVelocity, mappings } }` (bubbles)
 */
class PianoKey extends HTMLElement {
	#note = 0;
	#mapped = false;
	#active = false;
	#dimmed = false;
	#clipId = null;
	/** @type {Array<{velocity: number, clipId: string, start: number, end: number}>} */
	#velocityBands = [];
	#regionsContainer = null;
	#boundPointerUp = this.#handlePointerUp.bind(this);
	#boundContextMenu = this.#handleContextMenu.bind(this);
	#boundDragOver = this.#handleDragOver.bind(this);
	#boundDrop = this.#handleDrop.bind(this);
	#boundKeyDown = this.#handleKeyDown.bind(this);
	/** @type {{ handleIndex: number, pointerId: number, oldVelocity: number, liveVelocity: number, minVelocity: number, maxVelocity: number, readout: HTMLElement, handle: HTMLElement, lowerRegion: HTMLElement|null, upperRegion: HTMLElement|null, lowerStart: number, upperEnd: number }|null} */
	#dragState = null;
	#boundPointerMove = this.#handlePointerMove.bind(this);
	#boundPointerUpDrag = this.#handlePointerUpDrag.bind(this);

	/**
	 * @param {number} note
	 */
	set note(note) {
		this.#note = note;
		this.dataset.note = String(note);
		this.classList.toggle('is-black', isBlackKey(note));
		this.classList.toggle('is-white', !isBlackKey(note));
		this.style.setProperty('--key-hue', String(noteHue(note)));
		this.#renderLabel();
		this.#updateTitle();
		this.#renderRegions();
	}

	get note() {
		return this.#note;
	}

	/**
	 * @param {boolean} mapped
	 */
	set mapped(mapped) {
		this.#mapped = mapped;
		this.classList.toggle('is-mapped', mapped);
		this.#updateTitle();
	}

	get mapped() {
		return this.#mapped;
	}

	/**
	 * @param {boolean} active
	 */
	set active(active) {
		this.#active = active;
		this.classList.toggle('is-active', active);
	}

	get active() {
		return this.#active;
	}

	/**
	 * @param {boolean} dimmed
	 */
	set dimmed(dimmed) {
		this.#dimmed = dimmed;
		this.classList.toggle('is-dimmed', dimmed);
	}

	get dimmed() {
		return this.#dimmed;
	}

	/**
	 * @param {string|null} clipId
	 */
	set clipId(clipId) {
		this.#clipId = clipId;
		this.#updateTitle();
	}

	get clipId() {
		return this.#clipId;
	}

	/**
	 * @param {Array<{velocity: number, clipId: string, start: number, end: number}>} bands
	 */
	set velocityBands(bands) {
		this.#velocityBands = bands;
		this.classList.toggle('has-regions', bands.length > 0);
		this.classList.toggle('has-bands', bands.length > 0);
		this.#renderRegions();
		this.#updateTitle();
	}

	get velocityBands() {
		return this.#velocityBands;
	}

	connectedCallback() {
		this.setAttribute('role', 'button');
		this.tabIndex = 0;
		this.style.touchAction = 'manipulation';
		this.addEventListener('pointerup', this.#boundPointerUp);
		this.addEventListener('contextmenu', this.#boundContextMenu);
		this.addEventListener('dragover', this.#boundDragOver);
		this.addEventListener('drop', this.#boundDrop);
		this.addEventListener('keydown', this.#boundKeyDown);
	}

	disconnectedCallback() {
		// Abort any in-progress handle drag before tearing down the light DOM so
		// pointermove/pointerup/pointercancel listeners on the handle are removed.
		this.#endDrag(false);
		this.removeEventListener('pointerup', this.#boundPointerUp);
		this.removeEventListener('contextmenu', this.#boundContextMenu);
		this.removeEventListener('dragover', this.#boundDragOver);
		this.removeEventListener('drop', this.#boundDrop);
		this.removeEventListener('keydown', this.#boundKeyDown);
		this.replaceChildren();
		this.#regionsContainer = null;
	}

	/**
	 * @param {PointerEvent} event
	 */
	#handlePointerUp(event) {
		if (this.#dragState) {
			return;
		}
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}
		if (event.target.closest('.velocity-region, .velocity-handle')) {
			return;
		}
		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_KEY_CLICK_REQUEST, {
				bubbles: true,
				detail: {
					note: this.#note,
					// Click Y within the key body maps to velocity (top = 127, bottom = 0).
					// Null when the position cannot be derived (e.g. keyboard activation).
					velocity: this.#velocityFromPointerEvent(event),
					clipId: null,
					action: 'assign'
				}
			})
		);
	}

	/**
	 * Map a pointer event's Y position within this key to a 0–127 velocity.
	 * Returns null when the position cannot be derived (keyboard, synthetic events).
	 *
	 * @param {PointerEvent} event
	 * @returns {number|null}
	 */
	#velocityFromPointerEvent(event) {
		if (typeof event.clientY !== 'number') {
			return null;
		}
		const rect = this.getBoundingClientRect();
		if (rect.height <= 0) {
			return null;
		}
		const ratioFromBottom = 1 - (event.clientY - rect.top) / rect.height;
		return Math.min(VELOCITY_RANGE - 1, Math.max(0, Math.round(ratioFromBottom * VELOCITY_RANGE)));
	}

	/**
	 * @param {MouseEvent} event
	 */
	#handleContextMenu(event) {
		const region = event.target.closest('.velocity-region');
		if (!region || !this.contains(region)) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		this.#removeRegion(region);
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	#handleKeyDown(event) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			this.dispatchEvent(
				new CustomEvent(EVENT_PIANOROLL_KEY_CLICK_REQUEST, {
					bubbles: true,
					detail: { note: this.#note, velocity: null, clipId: null, action: 'assign' }
				})
			);
		}
	}

	/**
	 * @param {DragEvent} event
	 */
	#handleDragOver(event) {
		if (!event.dataTransfer) {
			return;
		}
		const types = [...event.dataTransfer.types];
		if (!types.includes(MIME_AKVJ_CLIP_ID) && !types.includes(MIME_AKVJ_MAPPING_MOVE) && !types.includes('text/plain')) {
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = types.includes(MIME_AKVJ_MAPPING_MOVE) ? 'move' : 'copy';
	}

	/**
	 * @param {DragEvent} event
	 */
	#handleDrop(event) {
		event.preventDefault();
		event.stopPropagation();
		const rect = this.getBoundingClientRect();
		const ratioFromBottom = rect.height > 0 ? 1 - (event.clientY - rect.top) / rect.height : 0.5;
		const dropVelocity = Math.min(VELOCITY_RANGE - 1, Math.max(0, Math.round(ratioFromBottom * VELOCITY_RANGE)));

		const moveRaw = event.dataTransfer?.getData(MIME_AKVJ_MAPPING_MOVE) || '';
		if (moveRaw) {
			let source;
			let parsed = false;
			try {
				source = JSON.parse(moveRaw);
				parsed = true;
			} catch {
				// Not a move payload — fall through to clip-id add.
			}
			if (parsed && source && typeof source === 'object') {
				const sourceNote = Number(source.note);
				const sourceVelocity = Number(source.velocity);
				const sourceClipId = typeof source.clipId === 'string' ? source.clipId.trim() : '';
				if (sourceClipId && !Number.isNaN(sourceNote) && !Number.isNaN(sourceVelocity)) {
					this.dispatchEvent(
						new CustomEvent(EVENT_PIANOROLL_MAPPING_MOVE_REQUEST, {
							bubbles: true,
							detail: {
								sourceNote,
								sourceVelocity,
								sourceClipId,
								targetNote: this.#note,
								targetVelocity: dropVelocity
							}
						})
					);
					return;
				}
			}
		}

		const clipId = event.dataTransfer?.getData(MIME_AKVJ_CLIP_ID) || event.dataTransfer?.getData('text/plain') || '';
		const trimmedId = clipId.trim();
		if (!trimmedId) {
			return;
		}

		const insertAt = insertionIndexForDropVelocity(dropVelocity, this.#velocityBands);
		const items = this.#velocityBands.map(band => (band.overrides ? { clipId: band.clipId, overrides: band.overrides } : band.clipId));
		items.splice(insertAt, 0, trimmedId);

		// Reject drop if adding this clip would create regions smaller than MIN_REGION_VELOCITY.
		// This prevents the drag constraint inversion bug where minVelocity > maxVelocity.
		const newCount = items.length;
		if (VELOCITY_RANGE / newCount < MIN_REGION_VELOCITY) {
			return;
		}

		const mappings = redistributeVelocities(items);
		const velocity = mappings[insertAt]?.velocity ?? 0;

		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_MAPPING_ADD_REQUEST, {
				bubbles: true,
				detail: {
					note: this.#note,
					clipId: trimmedId,
					velocity,
					mappings
				}
			})
		);
	}

	#renderLabel() {
		const existing = this.querySelector('.piano-key-label');
		if (this.#note % 12 !== 0) {
			existing?.remove();
			return;
		}
		const label = existing ?? document.createElement('span');
		label.className = 'piano-key-label';
		label.textContent = noteLabel(this.#note);
		if (!existing) {
			this.append(label);
		}
	}

	#renderRegions() {
		if (this.#velocityBands.length === 0) {
			this.#regionsContainer?.remove();
			this.#regionsContainer = null;
			return;
		}

		if (!this.#regionsContainer) {
			this.#regionsContainer = document.createElement('div');
			this.#regionsContainer.className = 'velocity-regions';
			this.prepend(this.#regionsContainer);
		}

		this.#regionsContainer.replaceChildren();
		for (const [index, band] of this.#velocityBands.entries()) {
			const region = document.createElement('div');
			region.className = 'velocity-region';
			region.draggable = true;
			region.dataset.velocity = String(band.velocity);
			region.dataset.clipId = band.clipId;
			region.title = `${band.clipId} (vel ${band.start}–${band.end - 1})`;
			region.style.bottom = `${(band.start / VELOCITY_RANGE) * 100}%`;
			region.style.height = `${((band.end - band.start) / VELOCITY_RANGE) * 100}%`;
			region.style.setProperty('--region-hue', String(clipHue(band.clipId)));

			const label = document.createElement('span');
			label.className = 'velocity-region-label';
			label.textContent = band.clipId;
			region.append(label);

			region.addEventListener('dragstart', event => {
				if (!event.dataTransfer) {
					return;
				}
				event.stopPropagation();
				event.dataTransfer.setData(MIME_AKVJ_CLIP_ID, band.clipId);
				event.dataTransfer.setData(MIME_AKVJ_MAPPING_MOVE, JSON.stringify({ note: this.#note, velocity: band.velocity, clipId: band.clipId }));
				event.dataTransfer.effectAllowed = 'move';
				region.classList.add('is-dragging-region');
			});
			region.addEventListener('dragend', () => {
				region.classList.remove('is-dragging-region');
			});

			region.addEventListener('pointerup', event => {
				if (this.#dragState) {
					return;
				}
				event.stopPropagation();
				if (event.pointerType === 'mouse' && event.button !== 0) {
					return;
				}
				this.dispatchEvent(
					new CustomEvent(EVENT_PIANOROLL_KEY_CLICK_REQUEST, {
						bubbles: true,
						detail: {
							note: this.#note,
							velocity: band.velocity,
							clipId: band.clipId,
							action: 'select',
							shiftKey: event.shiftKey
						}
					})
				);
			});

			region.addEventListener('dblclick', event => {
				event.stopPropagation();
				this.#removeRegion(region);
			});

			this.#regionsContainer.append(region);

			// Handle sits on the boundary between this region and the next (start of next band).
			if (index < this.#velocityBands.length - 1) {
				const nextBand = this.#velocityBands[index + 1];
				const handle = document.createElement('div');
				handle.className = 'velocity-handle';
				handle.dataset.handleIndex = String(index + 1);
				handle.dataset.velocity = String(nextBand.velocity);
				handle.title = `Breakpoint vel ${nextBand.velocity}`;
				handle.style.bottom = `${(nextBand.velocity / VELOCITY_RANGE) * 100}%`;
				handle.addEventListener('pointerdown', event => {
					this.#startHandleDrag(event, index + 1, handle);
				});
				this.#regionsContainer.append(handle);
			}
		}

		// Hide labels that do not fit the region height.
		queueMicrotask(() => {
			for (const region of this.#regionsContainer?.querySelectorAll('.velocity-region') ?? []) {
				const label = region.querySelector('.velocity-region-label');
				if (label) {
					label.hidden = region.clientHeight < MIN_REGION_LABEL_HEIGHT_PX;
				}
			}
		});
	}

	/**
	 * @param {PointerEvent} event
	 * @param {number} handleIndex - index of the upper band whose velocity is edited
	 * @param {HTMLElement} handle
	 */
	#startHandleDrag(event, handleIndex, handle) {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();

		const upper = this.#velocityBands[handleIndex];
		const lower = this.#velocityBands[handleIndex - 1];
		const next = this.#velocityBands[handleIndex + 1];
		const minVelocity = lower.velocity + MIN_VELOCITY_GAP;
		const maxVelocity = next ? next.velocity - MIN_VELOCITY_GAP : VELOCITY_RANGE - 1;

		// Neighboring breakpoints already sit at the minimum gap (dense key, e.g. dozens of
		// clips mapped to one note) — there is no valid velocity left to move this handle to.
		if (minVelocity > maxVelocity) {
			return;
		}

		const regions = [...(this.#regionsContainer?.querySelectorAll('.velocity-region') ?? [])];
		const lowerRegion = regions[handleIndex - 1] ?? null;
		const upperRegion = regions[handleIndex] ?? null;

		const readout = document.createElement('div');
		readout.className = 'velocity-handle-readout';
		readout.textContent = String(upper.velocity);
		handle.append(readout);

		this.#dragState = {
			handleIndex,
			pointerId: event.pointerId,
			oldVelocity: upper.velocity,
			liveVelocity: upper.velocity,
			minVelocity,
			maxVelocity,
			readout,
			handle,
			lowerRegion,
			upperRegion,
			lowerStart: lower.start,
			upperEnd: upper.end
		};
		this.classList.add('is-dragging-handle');
		handle.classList.add('is-dragging');
		try {
			handle.setPointerCapture(event.pointerId);
		} catch {
			// jsdom / some environments lack pointer capture
		}
		handle.addEventListener('pointermove', this.#boundPointerMove);
		handle.addEventListener('pointerup', this.#boundPointerUpDrag);
		handle.addEventListener('pointercancel', this.#boundPointerUpDrag);
	}

	/**
	 * @param {PointerEvent} event
	 */
	#handlePointerMove(event) {
		if (!this.#dragState || event.pointerId !== this.#dragState.pointerId) {
			return;
		}
		const rect = this.getBoundingClientRect();
		if (rect.height <= 0) {
			return;
		}
		// Bottom of key = velocity 0; top = 128.
		const ratioFromBottom = 1 - (event.clientY - rect.top) / rect.height;
		const rawVelocity = Math.round(ratioFromBottom * VELOCITY_RANGE);
		const liveVelocity = Math.min(this.#dragState.maxVelocity, Math.max(this.#dragState.minVelocity, rawVelocity));
		this.#dragState.liveVelocity = liveVelocity;
		this.#dragState.handle.style.bottom = `${(liveVelocity / VELOCITY_RANGE) * 100}%`;
		this.#dragState.handle.dataset.velocity = String(liveVelocity);
		this.#dragState.readout.textContent = String(liveVelocity);

		if (this.#dragState.lowerRegion) {
			this.#dragState.lowerRegion.style.height = `${((liveVelocity - this.#dragState.lowerStart) / VELOCITY_RANGE) * 100}%`;
		}
		if (this.#dragState.upperRegion) {
			this.#dragState.upperRegion.style.bottom = `${(liveVelocity / VELOCITY_RANGE) * 100}%`;
			this.#dragState.upperRegion.style.height = `${((this.#dragState.upperEnd - liveVelocity) / VELOCITY_RANGE) * 100}%`;
		}
	}

	/**
	 * @param {PointerEvent} event
	 */
	#handlePointerUpDrag(event) {
		if (!this.#dragState || event.pointerId !== this.#dragState.pointerId) {
			return;
		}
		this.#endDrag(true);
	}

	/**
	 * @param {boolean} commit
	 */
	#endDrag(commit) {
		const state = this.#dragState;
		if (!state) {
			return;
		}
		this.#dragState = null;
		this.classList.remove('is-dragging-handle');
		state.handle.classList.remove('is-dragging');
		try {
			state.handle.releasePointerCapture(state.pointerId);
		} catch {
			// Already released
		}
		state.handle.removeEventListener('pointermove', this.#boundPointerMove);
		state.handle.removeEventListener('pointerup', this.#boundPointerUpDrag);
		state.handle.removeEventListener('pointercancel', this.#boundPointerUpDrag);
		state.readout.remove();

		if (!commit) {
			this.#renderRegions();
			return;
		}

		const band = this.#velocityBands[state.handleIndex];
		const newVelocity = state.liveVelocity;
		const oldVelocity = state.oldVelocity;
		if (newVelocity === oldVelocity) {
			this.#renderRegions();
			return;
		}

		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_MAPPING_CHANGE_REQUEST, {
				bubbles: true,
				detail: {
					note: this.#note,
					oldVelocity,
					newVelocity,
					clipId: band.clipId
				}
			})
		);
	}

	/**
	 * @param {HTMLElement} region
	 */
	#removeRegion(region) {
		const clipId = region.dataset.clipId;
		const velocity = Number(region.dataset.velocity);
		if (!clipId || Number.isNaN(velocity)) {
			return;
		}

		const remaining = this.#velocityBands
			.filter(band => !(band.clipId === clipId && band.velocity === velocity))
			.map(band => (band.overrides ? { clipId: band.clipId, overrides: band.overrides } : band.clipId));
		const mappings = redistributeVelocities(remaining);

		this.dispatchEvent(
			new CustomEvent(EVENT_PIANOROLL_MAPPING_REMOVE_REQUEST, {
				bubbles: true,
				detail: {
					note: this.#note,
					clipId,
					velocity,
					mappings
				}
			})
		);
	}

	#updateTitle() {
		const base = `${noteLabel(this.#note)} (MIDI ${this.#note})`;
		if (this.#velocityBands.length > 0) {
			const summary = this.#velocityBands.map(band => `${band.clipId}@${band.velocity}`).join(', ');
			this.title = `${base} → ${summary}`;
			return;
		}
		this.title = this.#clipId ? `${base} → ${this.#clipId}` : base;
	}
}

customElements.define('piano-key', PianoKey);

export { PianoKey, isBlackKey, noteLabel, noteHue, clipHue, buildVelocityBands, redistributeVelocities, insertionIndexForDropVelocity, MIN_REGION_VELOCITY };
