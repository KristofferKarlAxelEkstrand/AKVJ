import appState from './AppState.js';
import settings from './settings.js';
import AnimationLoader from '../visuals/AnimationLoader.js';
import LayerManager from '../visuals/LayerManager.js';
import Renderer from '../visuals/Renderer.js';

/**
 * Adventure Kid Video Jockey - Main rendering component
 * Handles canvas rendering, clip management, and layer group compositing only
 * Receives pre-parsed MIDI events from app state
 */
class AdventureKidVideoJockey extends HTMLElement {
	#canvas;
	#displayContext;
	#animationLoader;
	#layerManager;
	#renderer;
	#animations = {};
	#unsubscribers = [];

	constructor() {
		super();
		this.#canvas = document.createElement('canvas');
		this.#displayContext = this.#canvas.getContext('2d');

		if (!this.#displayContext) {
			// Canvas is unsupported or context creation failed; keep a noop-safe component
			console.warn('AdventureKidVideoJockey: 2D canvas context unavailable — visuals will be disabled');
			this.#animationLoader = null;
			this.#layerManager = null;
			this.#renderer = null;
			return;
		}

		// Initialize modules only when there is a valid 2D context
		this.#animationLoader = new AnimationLoader(this.#displayContext);
		this.#layerManager = new LayerManager();
		this.#renderer = new Renderer(this.#displayContext, this.#layerManager, settings, appState);
	}

	/**
	 * Set up event listeners for MIDI events from app state
	 */
	#setupMIDIEventListeners() {
		this.#unsubscribers.push(
			appState.subscribe('midiNoteOn', event => {
				if (!this.#layerManager) {
					return;
				}
				const { channel, note, velocity } = event.detail;
				this.#layerManager.noteOn(channel, note, velocity);
			})
		);

		this.#unsubscribers.push(
			appState.subscribe('midiNoteOff', event => {
				if (!this.#layerManager) {
					return;
				}
				const { channel, note } = event.detail;
				this.#layerManager.noteOff(channel, note);
			})
		);
	}

	/**
	 * Clean up event listeners
	 */
	#teardownMIDIEventListeners() {
		for (const unsubscribe of this.#unsubscribers) {
			unsubscribe();
		}
		this.#unsubscribers = [];
	}

	connectedCallback() {
		this.#canvas.width = settings.canvas.width;
		this.#canvas.height = settings.canvas.height;

		if (this.#displayContext) {
			this.#displayContext.imageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
			this.#displayContext.imageSmoothingQuality = settings.rendering.imageSmoothingQuality;
			this.#displayContext.fillStyle = settings.rendering.backgroundColor;
		}

		this.appendChild(this.#canvas);

		// Set up MIDI event listeners (safe to register even when visuals are disabled)
		this.#setupMIDIEventListeners();

		this.#init();
	}

	disconnectedCallback() {
		// Use individual try-catch blocks so one failure doesn't prevent other cleanup
		try {
			this.#teardownMIDIEventListeners();
		} catch (error) {
			console.error('Error tearing down MIDI event listeners:', error);
		}

		try {
			this.#renderer?.stop();
			this.#renderer?.destroy();
		} catch (error) {
			console.error('Error destroying renderer:', error);
		}

		try {
			this.#layerManager?.clearClips();
			this.#layerManager?.destroy();
		} catch (error) {
			console.error('Error destroying LayerManager:', error);
		}

		try {
			this.#animationLoader?.cleanup(this.#animations);
			this.#animations = {};
		} catch (error) {
			console.error('Error cleaning up animation loader:', error);
		}
	}

	async #setUpAnimations(jsonUrl) {
		try {
			this.#animations = await this.#animationLoader.setUpAnimations(jsonUrl);
			this.#layerManager.setAnimations(this.#animations);
			appState.animationsLoaded = true;
			return this.#animations;
		} catch (error) {
			console.error(`Failed to set up animations from ${jsonUrl}:`, error);
			appState.animationsLoaded = false;
			appState.dispatchEvent(
				new CustomEvent('animationLoadError', {
					detail: { url: jsonUrl, error: error.message }
				})
			);
			return {};
		}
	}

	async #init() {
		// If we do not have a context, skip loading visuals but still notify readiness
		if (!this.#animationLoader) {
			// If we do not have an animation loader (no 2D context available),
			// notify that the Video Jockey is ready and bail out early. No value
			// is returned because callers do not use the result of `#init()`.
			appState.animationsLoaded = false;
			appState.dispatchVideoJockeyReady();
			return;
		}

		await this.#setUpAnimations(settings.performance.animationsJsonUrl);
		if (appState.animationsLoaded) {
			this.#renderer.start();
		} else {
			console.error('Renderer not started: Animations failed to load.');
		}
		// Notify after animations are loaded (or failed to load)
		appState.dispatchVideoJockeyReady();
	}
}

// Guard definition to avoid `customElements.define` error if re-evaluated during HMR
if (!customElements.get('adventure-kid-video-jockey')) {
	customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
}

export default AdventureKidVideoJockey;
