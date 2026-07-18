import appState, { EVENT_MIDI_NOTE_ON, EVENT_MIDI_NOTE_OFF, EVENT_MIDI_CONTROL_CHANGE, EVENT_PROJECT_SWITCH, EVENT_CLIP_LOAD_ERROR } from './AppState.js';
import settings from './settings.js';
import ClipLoader from '../visuals/ClipLoader.js';
import LayerManager from '../visuals/LayerManager.js';
import Renderer from '../visuals/Renderer.js';
import LoadingOverlay from '../ui/LoadingOverlay.js';
import UserMessages from '../ui/UserMessages.js';

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
	#loadingOverlay = null;
	#userMessages = null;
	#activeProjectId = null;
	#projectIndex = [];
	#isSwitchingProject = false;

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
		this.#loadingOverlay = new LoadingOverlay();
		this.#userMessages = new UserMessages();
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

		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_CONTROL_CHANGE, event => {
				if (!this.#layerManager) {
					return;
				}
				this.#layerManager.handleControlChange(event);
			})
		);
	}

	/**
	 * Set up event listeners for project switching from app state
	 */
	#setupProjectEventListeners() {
		this.#unsubscribers.push(
			appState.subscribe(EVENT_PROJECT_SWITCH, event => {
				this.#handleProjectSwitch(event.detail);
			})
		);
	}

	/**
	 * Handle a project switch request from MIDI.
	 * The detail may contain either a { projectId } string or a { note } number
	 * that maps to a project index in the projects index array.
	 * @param {{projectId?: string, note?: number}} detail
	 */
	async #handleProjectSwitch(detail) {
		if (this.#isSwitchingProject) {
			return;
		}

		let projectId = null;
		if (typeof detail.projectId === 'string') {
			projectId = detail.projectId;
		} else if (typeof detail.note === 'number') {
			projectId = await this.#resolveProjectIdFromNote(detail.note);
		}

		if (!projectId || projectId === this.#activeProjectId) {
			return;
		}

		await this.#switchProject(projectId);
	}

	/**
	 * Resolve a MIDI note number to a project ID using the projects index.
	 * @param {number} note - MIDI note number (0-127)
	 * @returns {Promise<string|null>}
	 */
	async #resolveProjectIdFromNote(note) {
		if (this.#projectIndex.length === 0) {
			try {
				this.#projectIndex = await this.#clipLoader.fetchProjectsIndex();
			} catch (error) {
				console.error('Failed to fetch projects index:', error);
				return null;
			}
		}

		const projectEntry = this.#projectIndex[note];
		return projectEntry?.id ?? null;
	}

	/**
	 * Switch to a new project: freeze rendering, show overlay, load clips, swap, hide overlay.
	 * @param {string} projectId
	 */
	async #switchProject(projectId) {
		this.#isSwitchingProject = true;
		appState.projectSwitching = true;

		// Freeze the renderer — keep showing the last frame
		this.#renderer?.freeze();

		try {
			const newClips = await this.#clipLoader.setupClipsFromProject(projectId);

			// Destroy old clips and swap in new ones
			this.#clipLoader.destroy(this.#clips);
			this.#clips = newClips;
			this.#layerManager.setClips(this.#clips);
			this.#activeProjectId = projectId;
			appState.activeProjectId = projectId;

			this.#renderer?.unfreeze();
			appState.dispatchProjectLoadComplete(projectId);

			if (import.meta.env.DEV) {
				console.log(`Switched to project: ${projectId}`);
			}
		} catch (error) {
			console.error(`Failed to switch to project "${projectId}":`, error);
			this.#renderer?.unfreeze();
			appState.dispatchProjectLoadError(projectId, error.message);
			appState.error(`Failed to switch to project "${projectId}": ${error.message}`);
		}

		this.#isSwitchingProject = false;
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
		this.appendChild(this.#loadingOverlay);
		this.appendChild(this.#userMessages);

		// Safe to register even when visuals are disabled
		this.#setupMIDIEventListeners();
		this.#setupProjectEventListeners();

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
			appState.error(`Failed to load clips: ${error.message}`);
			appState.dispatchEvent(
				new CustomEvent(EVENT_CLIP_LOAD_ERROR, {
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
			// Set the active project ID from active-project.json (if available)
			try {
				this.#activeProjectId = await this.#clipLoader.fetchActiveProjectId();
				if (this.#activeProjectId) {
					appState.activeProjectId = this.#activeProjectId;
				}
			} catch {
				// No active project — that's fine, legacy mode
			}
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
