import appState, { EVENT_MIDI_NOTE_ON, EVENT_MIDI_NOTE_OFF, EVENT_MIDI_CONTROL_CHANGE, EVENT_PROJECT_SWITCH, EVENT_CLIP_LOAD_ERROR } from './AppState.js';
import settings from './settings.js';
import ClipLoader from '../visuals/ClipLoader.js';
import LayerManager from '../visuals/LayerManager.js';
import Renderer from '../visuals/Renderer.js';
import AkvjLoadingOverlay from '../ui/AkvjLoadingOverlay.js';
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
	#loadedClips = {};
	#unsubscribers = [];
	#loadingOverlay = null;
	#userMessages = null;
	#activeProjectId = null;
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
		this.#loadingOverlay = new AkvjLoadingOverlay();
		this.#userMessages = new UserMessages();
	}

	/**
	 * Set up event listeners for MIDI events from app state
	 */
	#setupMIDIEventListeners() {
		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_NOTE_ON, event => {
				if (!this.#layerManager || this.#isSwitchingProject) {
					return;
				}
				const { channel, note, velocity } = event.detail;
				this.#layerManager.noteOn(channel, note, velocity);
			})
		);

		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_NOTE_OFF, event => {
				if (!this.#layerManager || this.#isSwitchingProject) {
					return;
				}
				const { channel, note } = event.detail;
				this.#layerManager.noteOff(channel, note);
			})
		);

		this.#unsubscribers.push(
			appState.subscribe(EVENT_MIDI_CONTROL_CHANGE, event => {
				if (!this.#layerManager || this.#isSwitchingProject) {
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
	 * Refetches on every resolve so Mainframe create/rename/reorder/delete
	 * is reflected without a full page reload (index JSON is tiny).
	 * @param {number} note - MIDI note number (0-127)
	 * @returns {Promise<string|null>}
	 */
	async #resolveProjectIdFromNote(note) {
		try {
			const projectIndex = await this.#clipLoader.fetchProjectsIndex();
			return projectIndex[note]?.id ?? null;
		} catch (error) {
			console.error('Failed to fetch projects index:', error);
			return null;
		}
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
			const newClips = await this.#clipLoader.loadClipsFromProject(projectId);

			// Stop active clips/mask/effects before destroying the old catalog —
			// setClips alone leaves runtime activation pointing at destroyed clips.
			this.#layerManager.clearClips();
			this.#clipLoader.destroyClips(this.#loadedClips);
			this.#loadedClips = newClips;
			this.#layerManager.setClips(this.#loadedClips);
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
	#teardownEventListeners() {
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

		this.#initializeVisuals();
	}

	disconnectedCallback() {
		try {
			this.#teardownEventListeners();
		} catch (error) {
			console.error('Error tearing down event listeners:', error);
		}
		this.#destroyRenderer();
		this.#destroyLayerManager();
		this.#destroyClipLoader();
		this.#destroyUserMessages();
		this.#destroyLoadingOverlay();
	}

	#destroyUserMessages() {
		try {
			this.#userMessages?.remove();
		} catch (error) {
			console.error('Error removing user messages host:', error);
		}
	}

	#destroyLoadingOverlay() {
		try {
			this.#loadingOverlay?.remove();
		} catch (error) {
			console.error('Error removing loading overlay:', error);
		}
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
			this.#clipLoader?.destroyClips(this.#loadedClips);
			this.#loadedClips = {};
		} catch (error) {
			console.error('Error destroying clip loader:', error);
		}
	}

	async #loadClipsFromUrl(jsonUrl) {
		try {
			this.#loadedClips = await this.#clipLoader.loadClips(jsonUrl);
			this.#layerManager.setClips(this.#loadedClips);
			appState.clipsLoaded = true;
			return this.#loadedClips;
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

	async #initializeVisuals() {
		// If we do not have a context, skip loading visuals but still notify readiness
		if (!this.#clipLoader) {
			// If we do not have a clip loader (no 2D context available),
			// notify that the Video Jockey is ready and bail out early. No value
			// is returned because callers do not use the result of `#initializeVisuals()`.
			appState.clipsLoaded = false;
			appState.dispatchVideoJockeyReady();
			return;
		}

		await this.#loadClipsFromUrl(settings.performance.clipsJsonUrl);
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
