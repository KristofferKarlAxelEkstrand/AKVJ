import '../scss/PianoRoll.scss';
import { PianoKey, buildVelocityBands, noteLabel } from './PianoKey.js';

const MODES = new Set(['edit', 'category', 'play']);

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
	14: 'Reserved',
	15: 'Reserved',
	16: 'Reserved'
};

/**
 * PianoRoll — unified 128-key piano roll with edit / category / play modes.
 *
 * - edit: velocity-band clip display; empty-key click assigns, band click selects
 * - category: single-key selection with read-only clip list below the roll
 * - play: multi-select sticky keys for trying the mapping
 *
 * Optional `channel-select` attribute renders a per-instance MIDI channel selector.
 *
 * @fires PianoRoll#keyclick - CustomEvent with `{ detail: { note, clipId, velocity, isActive, mode, action, mappings } }`
 * @fires PianoRoll#channelchange - CustomEvent with `{ detail: { channel } }`
 * @fires PianoRoll#noteon - play mode
 * @fires PianoRoll#noteoff - play mode
 */
class PianoRoll extends HTMLElement {
	/** @type {Array<{channel: number, note: number, velocity: number, clipId: string}>} */
	#mappings = [];
	#channel = 1;
	#mode = 'edit';
	/** @type {number|null} */
	#selectedNote = null;
	/** @type {Set<number>} */
	#activeNotes = new Set();
	#hasRenderedKeys = false;
	#keysContainer = null;
	#clipView = null;
	#channelBar = null;
	#channelSelect = null;
	#boundHandleKeyClick = this.#handleKeyClick.bind(this);

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
			this.#updateClipView();
		}
		if (name === 'mode') {
			this.#mode = MODES.has(value) ? value : 'edit';
			this.#selectedNote = null;
			this.#activeNotes.clear();
			this.#syncModeClasses();
			this.#updateMappedKeys();
			this.#updateActiveKeys();
			this.#updateClipView();
		}
		if (name === 'channel-select' && this.isConnected) {
			this.#render();
		}
	}

	/**
	 * @param {'edit'|'category'|'play'} mode
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
		this.#mappings = mappings;
		if (this.#hasRenderedKeys) {
			this.#updateMappedKeys();
			this.#updateClipView();
		} else {
			this.#render();
		}
	}

	get mappings() {
		return this.#mappings;
	}

	/**
	 * @returns {number|null}
	 */
	get selectedNote() {
		return this.#selectedNote;
	}

	connectedCallback() {
		if (!this.hasAttribute('mode')) {
			this.setAttribute('mode', this.#mode);
		}
		if (!this.hasAttribute('channel')) {
			this.setAttribute('channel', String(this.#channel));
		}
		this.#syncModeClasses();
		this.addEventListener('keyclickrequest', this.#boundHandleKeyClick);
		this.#render();
	}

	disconnectedCallback() {
		this.removeEventListener('keyclickrequest', this.#boundHandleKeyClick);
		this.replaceChildren();
		this.#keysContainer = null;
		this.#clipView = null;
		this.#channelBar = null;
		this.#channelSelect = null;
		this.#hasRenderedKeys = false;
		this.#selectedNote = null;
		this.#activeNotes.clear();
	}

	/**
	 * Clear category/play selection highlights and clip view.
	 */
	clearSelection() {
		const notesTurningOff = this.#mode === 'play' ? [...this.#activeNotes] : [];
		this.#selectedNote = null;
		this.#activeNotes.clear();
		if (this.#hasRenderedKeys) {
			this.#updateActiveKeys();
			this.#updateClipView();
		}
		for (const note of notesTurningOff) {
			const noteMappings = this.#mappingsForNote(note);
			this.dispatchEvent(new CustomEvent('noteoff', {
				bubbles: true,
				detail: {
					note,
					clipId: noteMappings[0]?.clipId ?? null,
					velocity: 0,
					mappings: noteMappings
				}
			}));
		}
	}

	#syncModeClasses() {
		this.classList.toggle('is-compact', this.#mode === 'category');
		this.classList.toggle('is-edit', this.#mode === 'edit');
		this.classList.toggle('is-category', this.#mode === 'category');
		this.classList.toggle('is-play', this.#mode === 'play');
		this.classList.toggle('has-selection', this.#selectedNote !== null);
	}

	#render() {
		this.replaceChildren();
		this.#channelBar = null;
		this.#channelSelect = null;

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
				this.dispatchEvent(new CustomEvent('channelchange', {
					bubbles: true,
					detail: { channel }
				}));
			});
			label.append(this.#channelSelect);
			this.#channelBar.append(label);
			this.append(this.#channelBar);
		}

		this.#keysContainer = document.createElement('div');
		this.#keysContainer.className = 'piano-roll-keys';
		for (let note = 0; note < 128; note++) {
			const key = new PianoKey();
			key.note = note;
			this.#keysContainer.append(key);
		}
		this.append(this.#keysContainer);

		this.#clipView = document.createElement('div');
		this.#clipView.className = 'piano-roll-clip-view';
		this.#clipView.hidden = true;
		this.append(this.#clipView);

		this.#hasRenderedKeys = true;
		this.#updateMappedKeys();
		this.#updateActiveKeys();
		this.#updateClipView();
	}

	#keys() {
		return this.#keysContainer ? [...this.#keysContainer.children].filter(child => child instanceof PianoKey) : [];
	}

	#handleKeyClick(event) {
		const { note, velocity = null, clipId: eventClipId = null, action = 'assign' } = event.detail;
		const noteMappings = this.#mappingsForNote(note);
		const clipId = eventClipId ?? noteMappings[0]?.clipId ?? null;
		let isActive = true;

		if (this.#mode === 'category') {
			if (this.#selectedNote === note) {
				this.#selectedNote = null;
				isActive = false;
			} else {
				this.#selectedNote = note;
				isActive = true;
			}
			this.#updateActiveKeys();
			this.#updateClipView();
		} else if (this.#mode === 'play') {
			if (this.#activeNotes.has(note)) {
				this.#activeNotes.delete(note);
				isActive = false;
			} else {
				this.#activeNotes.add(note);
				isActive = true;
			}
			this.#updateActiveKeys();
			this.dispatchEvent(new CustomEvent(isActive ? 'noteon' : 'noteoff', {
				bubbles: true,
				detail: {
					note,
					clipId,
					velocity: 100,
					mappings: noteMappings
				}
			}));
		}

		this.dispatchEvent(new CustomEvent('keyclick', {
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
		}));
	}

	#mappingsForNote(note) {
		return this.#mappings
			.filter(mapping => mapping.channel === this.#channel && mapping.note === note)
			.sort((a, b) => a.velocity - b.velocity);
	}

	#updateMappedKeys() {
		if (!this.#hasRenderedKeys) {
			return;
		}
		for (const key of this.#keys()) {
			const noteMappings = this.#mappingsForNote(key.note);
			if (this.#mode === 'edit') {
				const bands = buildVelocityBands(noteMappings);
				key.velocityBands = bands;
				key.mapped = bands.length > 0;
				key.clipId = bands[0]?.clipId ?? null;
			} else {
				key.velocityBands = [];
				const first = noteMappings[0] ?? null;
				key.mapped = Boolean(first);
				key.clipId = first?.clipId ?? null;
			}
		}
	}

	#updateActiveKeys() {
		if (!this.#hasRenderedKeys) {
			return;
		}
		const hasCategorySelection = this.#mode === 'category' && this.#selectedNote !== null;
		this.classList.toggle('has-selection', hasCategorySelection);

		for (const key of this.#keys()) {
			if (this.#mode === 'category') {
				key.active = key.note === this.#selectedNote;
				key.dimmed = hasCategorySelection && key.note !== this.#selectedNote;
			} else if (this.#mode === 'play') {
				key.active = this.#activeNotes.has(key.note);
				key.dimmed = false;
			} else {
				key.active = false;
				key.dimmed = false;
			}
		}
	}

	#updateClipView() {
		if (!this.#clipView) {
			return;
		}

		const show = this.#mode === 'category' && this.#selectedNote !== null;
		this.#clipView.hidden = !show;
		if (!show) {
			this.#clipView.replaceChildren();
			return;
		}

		const note = this.#selectedNote;
		const noteMappings = this.#mappingsForNote(note);
		const heading = document.createElement('p');
		heading.className = 'piano-roll-clip-view-heading';
		heading.textContent = `${noteLabel(note)} (MIDI ${note})`;

		if (noteMappings.length === 0) {
			const empty = document.createElement('p');
			empty.className = 'piano-roll-clip-view-empty';
			empty.textContent = 'No clips mapped';
			this.#clipView.replaceChildren(heading, empty);
			return;
		}

		const list = document.createElement('ul');
		list.className = 'piano-roll-clip-list';
		for (const mapping of noteMappings) {
			const item = document.createElement('li');
			item.className = 'piano-roll-clip-item';
			const clip = document.createElement('strong');
			clip.textContent = mapping.clipId;
			const meta = document.createElement('span');
			meta.textContent = `vel ${mapping.velocity}`;
			item.append(clip, meta);
			list.append(item);
		}
		this.#clipView.replaceChildren(heading, list);
	}
}

customElements.define('piano-roll', PianoRoll);

export { PianoRoll };
