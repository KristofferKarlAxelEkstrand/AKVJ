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
	 * Handle keydown events for fullscreen toggle
	 */
	#handleKeydown(event) {
		if (event.repeat) {
			return;
		}
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			this.#toggle();
		}
	}

	/**
	 * Initialize fullscreen toggle listeners
	 */
	setup() {
		document.addEventListener('keydown', this.#boundHandleKeydown);
		document.addEventListener('dblclick', this.#boundToggle);
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
			document.removeEventListener('dblclick', this.#boundToggle);
		} catch (error) {
			console.error('Error removing dblclick listener in Fullscreen:', error);
		}
	}
}

export default Fullscreen;
