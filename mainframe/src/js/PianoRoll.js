import '../scss/PianoRoll.scss';
import './KeyBed.js';

const MODES = new Set(['edit', 'select', 'play']);

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
 * PianoRoll — unified 128-key piano roll with edit / select / play modes.
 *
 * - edit: velocity regions with breakpoint handles; empty-key click assigns, region click selects
 * - select: click a note → dispatch `keyclick` with the note (pure note selector)
 * - play: multi-select sticky keys for trying the mapping
 *
 * Optional `channel-select` attribute renders a per-instance MIDI channel selector.
 *
 * @fires PianoRoll#keyclick - CustomEvent with `{ detail: { note, clipId, velocity, isActive, mode, action, mappings } }`
 * @fires PianoRoll#channelchange - CustomEvent with `{ detail: { channel } }`
 * @fires PianoRoll#noteon - play mode
 * @fires PianoRoll#noteoff - play mode
 * @fires PianoRoll#mappingchange - edit mode breakpoint drag `{ channel, note, oldVelocity, newVelocity, clipId }`
 * @fires PianoRoll#mappingremove - edit mode region right-click `{ channel, note, clipId, velocity, mappings }`
 * @fires PianoRoll#mappingadd - edit mode clip drop `{ channel, note, clipId, velocity, mappings }`
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
	#keyBed = null;
	#channelBar = null;
	#channelSelect = null;
	#boundHandleKeyClick = this.#handleKeyClick.bind(this);
	#boundHandleMappingChange = this.#handleMappingChange.bind(this);
	#boundHandleMappingRemove = this.#handleMappingRemove.bind(this);
	#boundHandleMappingAdd = this.#handleMappingAdd.bind(this);

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
			this.#mode = MODES.has(value) ? value : 'edit';
			this.#selectedNote = null;
			this.#activeNotes.clear();
			this.#syncModeClasses();
			this.#updateMappedKeys();
			this.#updateActiveKeys();
		}
		if (name === 'channel-select' && this.isConnected) {
			this.#render();
		}
	}

	/**
	 * @param {'edit'|'select'|'play'} mode
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
		this.addEventListener('mappingchangerequest', this.#boundHandleMappingChange);
		this.addEventListener('mappingremoverequest', this.#boundHandleMappingRemove);
		this.addEventListener('mappingaddrequest', this.#boundHandleMappingAdd);
		this.#render();
	}

	disconnectedCallback() {
		this.removeEventListener('keyclickrequest', this.#boundHandleKeyClick);
		this.removeEventListener('mappingchangerequest', this.#boundHandleMappingChange);
		this.removeEventListener('mappingremoverequest', this.#boundHandleMappingRemove);
		this.removeEventListener('mappingaddrequest', this.#boundHandleMappingAdd);
		this.replaceChildren();
		this.#keyBed = null;
		this.#channelBar = null;
		this.#channelSelect = null;
		this.#hasRenderedKeys = false;
		this.#selectedNote = null;
		this.#activeNotes.clear();
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
		for (const note of notesTurningOff) {
			const noteMappings = this.#mappingsForNote(note);
			this.dispatchEvent(
				new CustomEvent('noteoff', {
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
		this.classList.toggle('is-select', this.#mode === 'select');
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
				this.dispatchEvent(
					new CustomEvent('channelchange', {
						bubbles: true,
						detail: { channel }
					})
				);
			});
			label.append(this.#channelSelect);
			this.#channelBar.append(label);
			this.append(this.#channelBar);
		}

		this.#keyBed = document.createElement('key-bed');
		this.append(this.#keyBed);

		this.#hasRenderedKeys = true;
		this.#updateMappedKeys();
		this.#updateActiveKeys();
	}

	#keys() {
		return this.#keyBed ? this.#keyBed.keys : [];
	}

	#handleKeyClick(event) {
		const { note, velocity = null, clipId: eventClipId = null, action = 'assign' } = event.detail;
		const noteMappings = this.#mappingsForNote(note);
		const clipId = eventClipId ?? noteMappings[0]?.clipId ?? null;
		let isActive = true;

		if (this.#mode === 'select') {
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
			this.#updateActiveKeys();
			this.dispatchEvent(
				new CustomEvent(isActive ? 'noteon' : 'noteoff', {
					bubbles: true,
					detail: {
						note,
						clipId,
						velocity: 100,
						mappings: noteMappings
					}
				})
			);
		}

		this.dispatchEvent(
			new CustomEvent('keyclick', {
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
		this.dispatchEvent(
			new CustomEvent('mappingchange', {
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

	/**
	 * @param {CustomEvent} event
	 */
	#handleMappingRemove(event) {
		if (this.#mode !== 'edit') {
			return;
		}
		event.stopPropagation();
		const { note, clipId, velocity, mappings } = event.detail;
		this.dispatchEvent(
			new CustomEvent('mappingremove', {
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
		this.dispatchEvent(
			new CustomEvent('mappingadd', {
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
	}

	#mappingsForNote(note) {
		return this.#mappings.filter(mapping => mapping.channel === this.#channel && mapping.note === note).sort((a, b) => a.velocity - b.velocity);
	}

	#updateMappedKeys() {
		if (!this.#hasRenderedKeys || !this.#keyBed) {
			return;
		}
		const channelMappings = this.#mappings.filter(mapping => mapping.channel === this.#channel);
		this.#keyBed.setMappedKeys(channelMappings, this.#mode);
	}

	#updateActiveKeys() {
		if (!this.#hasRenderedKeys) {
			return;
		}
		const hasSelectSelection = this.#mode === 'select' && this.#selectedNote !== null;
		this.classList.toggle('has-selection', hasSelectSelection);

		for (const key of this.#keys()) {
			if (this.#mode === 'select') {
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
	}
}

customElements.define('piano-roll', PianoRoll);

export { PianoRoll };
