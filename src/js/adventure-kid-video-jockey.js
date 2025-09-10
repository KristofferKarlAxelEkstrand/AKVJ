import appState from './app-state.js';
import settings from './settings.js';
import AnimationLoader from './AnimationLoader.js';
import LayerManager from './LayerManager.js';
import Renderer from './Renderer.js';

class AdventureKidVideoJockey extends HTMLElement {
	constructor() {
		super();
		this.canvas = document.createElement('canvas');
		this.canvas2dContext = this.canvas.getContext('2d');

		// Initialize modules
		this.animationLoader = new AnimationLoader(this.canvas2dContext);
		this.layerManager = new LayerManager();
		this.renderer = new Renderer(this.canvas2dContext, this.layerManager);

		this.animations = {};
	}

	connectedCallback() {
		appState.adventureKidVideoJockey = this;
		this.canvas.width = settings.canvas.width;
		this.canvas.height = settings.canvas.height;
		this.canvas2dContext.imageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
		this.canvas2dContext.webkitImageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
		this.canvas2dContext.mozImageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
		this.canvas2dContext.imageSmoothingQuality = settings.rendering.imageSmoothingQuality;
		this.canvas2dContext.fillStyle = settings.rendering.fillStyle;
		this.appendChild(this.canvas);
		this.init();
	}

	async setUpAnimations(jsonUrl) {
		try {
			this.animations = await this.animationLoader.setUpAnimations(jsonUrl);
			this.layerManager.setAnimations(this.animations);
			appState.animationsLoaded = true;
			return this.animations;
		} catch (error) {
			console.error('Failed to set up animations:', error);
			appState.animationsLoaded = false;
			return {};
		}
	}

	async init() {
		await this.setUpAnimations(settings.performance.animationsJsonUrl);
		this.renderer.start();
	}

	noteOn(channel, note, velocity) {
		this.layerManager.noteOn(channel, note, velocity);
	}

	noteOff(channel, note) {
		this.layerManager.noteOff(channel, note);
	}
}

customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
