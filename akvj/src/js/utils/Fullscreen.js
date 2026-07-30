/**
 * Fullscreen - Handles fullscreen toggle functionality
 * Responds to Enter key, Space bar, and double-click events
 */
import { DEBUG_OVERLAY_ELEMENT_ID } from './DebugOverlay.js';
import { MIDI_SETTINGS_OVERLAY_ELEMENT_ID } from './MidiSettingsOverlay.js';

const INTERACTIVE_TAGS = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'OPTION', 'A', 'SUMMARY', 'LABEL']);

class Fullscreen {
	#boundHandleKeydown;
	#boundHandleDblclick;

	constructor() {
		this.#boundHandleKeydown = this.#handleKeydown.bind(this);
		this.#boundHandleDblclick = this.#handleDblclick.bind(this);
	}

	/**
	 * Toggle fullscreen mode on/off
	 */
	#toggle() {
		if (!document.fullscreenElement) {
			if (document.documentElement.requestFullscreen) {
				document.documentElement.requestFullscreen().catch(error => {
					console.error(`Error attempting to enable full-screen mode: ${error.message} (${error.name})`);
				});
			}
		} else if (document.exitFullscreen) {
			document.exitFullscreen().catch(error => {
				console.error(`Error attempting to exit full-screen mode: ${error.message} (${error.name})`);
			});
		}
	}

	/**
	 * Skip Space/Enter when focus is on a control or a summonable overlay is open.
	 * @param {KeyboardEvent|{ target?: EventTarget|null }} event
	 * @returns {boolean}
	 */
	#shouldIgnoreKeyToggle(event) {
		if (this.#isOverlayOpen()) {
			return true;
		}
		const target = event.target;
		if (!(target instanceof Element)) {
			return false;
		}
		const tag = target.tagName?.toUpperCase();
		if (INTERACTIVE_TAGS.has(tag) || target.isContentEditable) {
			return true;
		}
		return Boolean(target.closest('input, button, select, textarea, a, label, [contenteditable=""], [contenteditable="true"], [role="button"]'));
	}

	#isOverlayOpen() {
		if (document.getElementById(MIDI_SETTINGS_OVERLAY_ELEMENT_ID)) {
			return true;
		}
		const debugOverlay = document.getElementById(DEBUG_OVERLAY_ELEMENT_ID);
		return Boolean(debugOverlay?.classList.contains('visible'));
	}

	/**
	 * Handle keydown events for fullscreen toggle
	 */
	#handleKeydown(event) {
		if (event.repeat) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			if (this.#shouldIgnoreKeyToggle(event)) {
				return;
			}
			event.preventDefault();
			this.#toggle();
		}
	}

	/**
	 * Handle double-click for fullscreen toggle (same overlay/control guards as keys).
	 * @param {MouseEvent|{ target?: EventTarget|null }} [event]
	 */
	#handleDblclick(event) {
		if (this.#shouldIgnoreKeyToggle(event ?? {})) {
			return;
		}
		this.#toggle();
	}

	/**
	 * Initialize fullscreen toggle listeners
	 */
	enable() {
		document.addEventListener('keydown', this.#boundHandleKeydown);
		document.addEventListener('dblclick', this.#boundHandleDblclick);
	}

	/**
	 * Remove fullscreen toggle listeners
	 */
	destroy() {
		try {
			document.removeEventListener('keydown', this.#boundHandleKeydown);
		} catch (error) {
			console.error('Error removing keydown listener in Fullscreen:', error);
		}
		try {
			document.removeEventListener('dblclick', this.#boundHandleDblclick);
		} catch (error) {
			console.error('Error removing dblclick listener in Fullscreen:', error);
		}
	}
}

export default Fullscreen;
