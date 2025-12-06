import appState from './app-state.js';
import settings from './settings.js';
import AnimationLoader from './AnimationLoader.js';
import LayerManager from './LayerManager.js';
import Renderer from './Renderer.js';

/**
 * Adventure Kid Video Jockey - Main rendering component
 * Handles canvas rendering, animation management, and layer compositing only
 * Receives pre-parsed MIDI events from app state
 */
class AdventureKidVideoJockey extends HTMLElement {
	#canvas;
	#canvas2dContext;
	#animationLoader;
	#layerManager;
	#renderer;
	#animations = {};
	#unsubscribers = [];

	constructor() {
		super();
		this.#canvas = document.createElement('canvas');
		this.#canvas2dContext = this.#canvas.getContext('2d');

		// Initialize modules
		this.#animationLoader = new AnimationLoader(this.#canvas2dContext);
		this.#layerManager = new LayerManager();
		this.#renderer = new Renderer(this.#canvas2dContext, this.#layerManager);
	}

	/**
	 * Set up event listeners for MIDI events from app state
	 */
	#setupMIDIEventListeners() {
		this.#unsubscribers.push(
			appState.subscribe('midiNoteOn', event => {
				const { channel, note, velocity } = event.detail;
				this.#layerManager.noteOn(channel, note, velocity);
			})
		);

		this.#unsubscribers.push(
			appState.subscribe('midiNoteOff', event => {
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
		this.#canvas2dContext.imageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
		this.#canvas2dContext.webkitImageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
		this.#canvas2dContext.mozImageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
		this.#canvas2dContext.imageSmoothingQuality = settings.rendering.imageSmoothingQuality;
		this.#canvas2dContext.fillStyle = settings.rendering.fillStyle;
		this.appendChild(this.#canvas);

		// Set up MIDI event listeners
		this.#setupMIDIEventListeners();

		this.#init();

		// Notify app state that video jockey is ready
		appState.notifyVideoJockeyReady();
	}

	disconnectedCallback() {
		try {
			this.#teardownMIDIEventListeners();
			this.#renderer.stop();
			this.#layerManager.clearLayers();
			this.#animationLoader.cleanup(this.#animations);
		} catch (error) {
			console.error('Error during cleanup:', error);
		} finally {
			this.#animations = {};
		}
	}

	async #setUpAnimations(jsonUrl) {
		try {
			this.#animations = await this.#animationLoader.setUpAnimations(jsonUrl);
			this.#layerManager.setAnimations(this.#animations);
			appState.animationsLoaded = true;
			return this.#animations;
		} catch (error) {
			console.error('Failed to set up animations:', error);
			appState.animationsLoaded = false;
			return {};
		}
	}

	async #init() {
		await this.#setUpAnimations(settings.performance.animationsJsonUrl);
		if (appState.animationsLoaded) {
			this.#renderer.start();
		} else {
			console.error('Renderer not started: Animations failed to load.');
		}
	}
}

customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
