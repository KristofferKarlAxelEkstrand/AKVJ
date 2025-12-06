import appState from './AppState.js';
import settings from './settings.js';
import AnimationLoader from '../visuals/AnimationLoader.js';
import LayerManager from '../visuals/LayerManager.js';
import Renderer from '../visuals/Renderer.js';

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
		this.#canvas2dContext.imageSmoothingQuality = settings.rendering.imageSmoothingQuality;
		this.#canvas2dContext.fillStyle = settings.rendering.backgroundColor;
		this.appendChild(this.#canvas);

		// Set up MIDI event listeners
		this.#setupMIDIEventListeners();

		this.#init();
	}

	disconnectedCallback() {
		try {
			this.#teardownMIDIEventListeners();
		} catch (error) {
			console.error('Error tearing down MIDI listeners:', error);
		}
		try {
			this.#renderer.stop();
		} catch (error) {
			console.error('Error stopping renderer:', error);
		}
		try {
			this.#layerManager.clearLayers();
		} catch (error) {
			console.error('Error clearing layers:', error);
		}
		try {
			this.#animationLoader.cleanup(this.#animations);
		} catch (error) {
			console.error('Error cleaning up animations:', error);
		}
		this.#animations = {};
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
		// Notify after animations are loaded (or failed to load)
		appState.notifyVideoJockeyReady();
	}
}

customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
