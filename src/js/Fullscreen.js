/**
 * Fullscreen - Handles fullscreen toggle functionality
 * Responds to Enter key, Space bar, and double-click events
 */
class Fullscreen {
	#boundHandleKeydown;
	#boundToggle;

	constructor() {
		this.#boundHandleKeydown = this.#handleKeydown.bind(this);
		this.#boundToggle = this.#toggle.bind(this);
	}

	/**
	 * Toggle fullscreen mode on/off
	 */
	#toggle() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(err => {
				console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
			});
		} else if (document.exitFullscreen) {
			document.exitFullscreen().catch(err => {
				console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
			});
		}
	}

	/**
	 * Handle keydown events for fullscreen toggle
	 */
	#handleKeydown(e) {
		if (e.key === 'Enter' || e.code === 'Space') {
			e.preventDefault();
			this.#toggle();
		}
	}

	/**
	 * Initialize fullscreen toggle listeners
	 */
	init() {
		document.addEventListener('keydown', this.#boundHandleKeydown);
		document.addEventListener('dblclick', this.#boundToggle);
	}

	/**
	 * Remove fullscreen toggle listeners
	 */
	destroy() {
		document.removeEventListener('keydown', this.#boundHandleKeydown);
		document.removeEventListener('dblclick', this.#boundToggle);
	}
}

export default Fullscreen;
