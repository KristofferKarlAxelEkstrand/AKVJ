import appState, { EVENT_MIDI_NOTE_ON, EVENT_MIDI_NOTE_OFF } from './AppState.js';
import settings from './settings.js';
import ClipLoader from '../visuals/ClipLoader.js';
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
	#clipLoader;
	#layerManager;
	#renderer;
	#clips = {};
	#unsubscribers = [];

	constructor() {
		super();
		this.#canvas = document.createElement('canvas');
		this.#displayContext = this.#canvas.getContext('2d');

		if (!this.#displayContext) {
			// Canvas is unsupported or context creation failed; keep a noop-safe component
			console.warn('AdventureKidVideoJockey: 2D canvas context unavailable — visuals will be disabled');
			this.#clipLoader = null;
			this.#layerManager = null;
			this.#renderer = null;
			return;
		}

		this.#clipLoader = new ClipLoader(this.#displayContext);
		this.#layerManager = new LayerManager();
		this.#renderer = new Renderer(this.#displayContext, this.#layerManager, settings, appState);
	}

	/**
	 * Set up event listeners for MIDI events from app state
	 */
	#setupMIDIEventListeners() {
		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_NOTE_ON, event => {
				if (!this.#layerManager) {
					return;
				}
				const { channel, note, velocity } = event.detail;
				this.#layerManager.noteOn(channel, note, velocity);
			})
		);

		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_NOTE_OFF, event => {
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

		// Safe to register even when visuals are disabled
		this.#setupMIDIEventListeners();

		this.#setup();
	}

	disconnectedCallback() {
		try {
			this.#teardownMIDIEventListeners();
		} catch (error) {
			console.error('Error tearing down MIDI event listeners:', error);
		}
		this.#destroyRenderer();
		this.#destroyLayerManager();
		this.#destroyClipLoader();
	}

	#destroyRenderer() {
		try {
			this.#renderer?.stop();
			this.#renderer?.destroy();
		} catch (error) {
			console.error('Error destroying renderer:', error);
		}
	}

	#destroyLayerManager() {
		try {
			this.#layerManager?.clearClips();
			this.#layerManager?.destroy();
		} catch (error) {
			console.error('Error destroying LayerManager:', error);
		}
	}

	#destroyClipLoader() {
		try {
			this.#clipLoader?.destroy(this.#clips);
			this.#clips = {};
		} catch (error) {
			console.error('Error destroying clip loader:', error);
		}
	}

	async #setupClips(jsonUrl) {
		try {
			this.#clips = await this.#clipLoader.setupClips(jsonUrl);
			this.#layerManager.setClips(this.#clips);
			appState.clipsLoaded = true;
			return this.#clips;
		} catch (error) {
			console.error(`Failed to set up clips from ${jsonUrl}:`, error);
			appState.clipsLoaded = false;
			appState.dispatchEvent(
				new CustomEvent('clipLoadError', {
					detail: { url: jsonUrl, error: error.message }
				})
			);
			return {};
		}
	}

	async #setup() {
		// If we do not have a context, skip loading visuals but still notify readiness
		if (!this.#clipLoader) {
			// If we do not have a clip loader (no 2D context available),
			// notify that the Video Jockey is ready and bail out early. No value
			// is returned because callers do not use the result of `#setup()`.
			appState.clipsLoaded = false;
			appState.dispatchVideoJockeyReady();
			return;
		}

		await this.#setupClips(settings.performance.clipsJsonUrl);
		if (appState.clipsLoaded) {
			this.#renderer.start();
		} else {
			console.error('Renderer not started: Clips failed to load.');
		}
		appState.dispatchVideoJockeyReady();
	}
}

// Guard definition to avoid `customElements.define` error if re-evaluated during HMR
if (!customElements.get('adventure-kid-video-jockey')) {
	customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
}

export default AdventureKidVideoJockey;
