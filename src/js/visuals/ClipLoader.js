/**
 * ClipLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */
import Clip from './Clip.js';
import settings from '../core/settings.js';

const DEFAULT_MAX_CONCURRENT_LOADS = 8;

class ClipLoader {
	#displayContext;

	constructor(displayContext) {
		this.#displayContext = displayContext;
	}

	/**
	 * Sanitize clip file name - prevents path traversal and ensures a safe filename.
	 * Only allows alphanumeric names with valid image extensions; prevents edge cases
	 * like '..png' or '-.png'.
	 */
	#sanitizeFileName(filename) {
		if (!filename || typeof filename !== 'string') {
			return '';
		}
		// Only allow alphanumeric names with valid image extension
		// Name must start and end with alphanumeric characters
		const filenameMatch = filename.match(/^([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?\.(png|jpg|jpeg|gif))$/i);
		if (!filenameMatch) {
			console.warn('ClipLoader: invalid file name (must be alphanumeric with .png/.jpg/.jpeg/.gif extension)', filename);
			return '';
		}
		return filenameMatch[1];
	}

	/**
	 * Load and parse clip data from JSON URL
	 */
	async #loadClipsJson(jsonUrl) {
		// Add cache-busting query param during development to ensure fresh data
		const fetchUrl = import.meta.env.DEV ? `${jsonUrl}?t=${performance.now()}` : jsonUrl;
		const response = await fetch(fetchUrl);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} for ${jsonUrl}`);
		}

		const clipsMetadata = await response.json();
		// Debug logging only in development mode
		if (import.meta.env.DEV) {
			console.log('JSON for clips loaded:', clipsMetadata);
		}
		return clipsMetadata;
	}

	/**
	 * Load an image from a source URL
	 */
	#loadImage(imageUrl) {
		return new Promise((resolve, reject) => {
			const image = new Image();
			// Use crossOrigin from settings if present. If null/undefined, do not set.
			// Empty string is valid (equivalent to 'anonymous'), so check explicitly.
			const crossOrigin = settings.performance?.imageCrossOrigin;
			if (crossOrigin !== null && crossOrigin !== undefined) {
				image.crossOrigin = crossOrigin;
			}
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
			image.src = imageUrl;
		});
	}

	/**
	 * Create an Clip from clip metadata and loaded image
	 */
	#createClip(image, clipMetadata) {
		try {
			return new Clip({
				displayContext: this.#displayContext,
				image,
				numberOfFrames: clipMetadata.numberOfFrames,
				framesPerRow: clipMetadata.framesPerRow,
				loop: clipMetadata.loop,
				frameRatesForFrames: clipMetadata.frameRatesForFrames,
				frameDurationBeats: clipMetadata.frameDurationBeats ?? null,
				retrigger: clipMetadata.retrigger,
				bitDepth: clipMetadata.bitDepth ?? null
			});
		} catch (error) {
			console.error(`ClipLoader: invalid clip metadata for image ${clipMetadata.png}:`, error);
			return null;
		}
	}

	/**
	 * Load a single clip and return its placement info
	 */
	async #loadClip(channel, note, velocityThreshold, clipMetadata) {
		// Validate that channel/note/velocity keys are numeric to avoid path traversal
		if (!/^\d+$/.test(String(channel)) || !/^\d+$/.test(String(note)) || !/^\d+$/.test(String(velocityThreshold))) {
			console.warn('ClipLoader: ignoring clip with non-numeric path keys', { channel, note, velocityThreshold });
			return null;
		}

		// Construct image path using configurable base path to support subpath deployments
		const clipsBasePath = settings.performance.clipsBasePath;
		const sanitizedFilename = this.#sanitizeFileName(clipMetadata.png);
		// Early return if filename was invalid (warning already logged in #sanitizeFileName)
		if (!sanitizedFilename) {
			return null;
		}
		// Normalize base path to avoid double slashes in the constructed URL
		const normalizedBasePath = clipsBasePath.replace(/\/$/, '');
		const imagePath = `${normalizedBasePath}/clips/${channel}/${note}/${velocityThreshold}/${sanitizedFilename}`;

		try {
			const image = await this.#loadImage(imagePath);
			return {
				channel,
				note,
				velocityThreshold,
				clip: this.#createClip(image, clipMetadata)
			};
		} catch (error) {
			console.error(`Error loading clip ${channel}/${note}/${velocityThreshold}:`, error);
			return null;
		}
	}

	/**
	 * Set up all clips from JSON metadata
	 */
	async setupClips(jsonUrl) {
		const clipsMetadata = await this.#loadClipsJson(jsonUrl);
		const loadTasks = this.#collectLoadTasks(clipsMetadata);
		const loadResults = await this.#runBatchedLoads(loadTasks);
		return this.#buildClipsObject(loadResults);
	}

	/**
	 * Collect load task functions for each clip in the metadata.
	 * @param {Object} clipsMetadata - Nested clip metadata keyed by channel/note/velocity
	 * @returns {Function[]} Array of async load functions
	 */
	#collectLoadTasks(clipsMetadata) {
		const loadTasks = [];
		for (const [channel, notes] of Object.entries(clipsMetadata)) {
			for (const [note, velocities] of Object.entries(notes)) {
				for (const [velocityThreshold, clipMetadata] of Object.entries(velocities)) {
					loadTasks.push(() => this.#loadClip(channel, note, velocityThreshold, clipMetadata));
				}
			}
		}
		return loadTasks;
	}

	/**
	 * Run load tasks in batches with a concurrency limit.
	 * @param {Function[]} loadTasks - Array of async load functions
	 * @returns {Promise<Array>} Flattened array of load results
	 */
	async #runBatchedLoads(loadTasks) {
		const maxConcurrentLoads = settings.performance?.maxConcurrentClipLoads ?? DEFAULT_MAX_CONCURRENT_LOADS;
		const loadResults = [];
		for (let i = 0; i < loadTasks.length; i += maxConcurrentLoads) {
			const loadBatch = loadTasks.slice(i, i + maxConcurrentLoads).map(loadTask => loadTask());
			const batchResults = await Promise.all(loadBatch);
			loadResults.push(...batchResults);
		}
		return loadResults;
	}

	/**
	 * Build the nested clips object from successful load results.
	 * @param {Array} loadResults - Array of load result objects (or null for failures)
	 * @returns {Object} Nested clips object keyed by channel/note/velocityThreshold
	 */
	#buildClipsObject(loadResults) {
		const clips = {};
		for (const loadResult of loadResults) {
			if (loadResult) {
				const { channel, note, velocityThreshold, clip } = loadResult;
				clips[channel] ??= {};
				clips[channel][note] ??= {};
				clips[channel][note][velocityThreshold] = clip;
			}
		}
		return clips;
	}

	/**
	 * Destroy loaded image resources from clips object.
	 * Iterates through all clips and calls destroy() to clear image references.
	 *
	 * @param {Object} clips - Nested object containing loaded clips.
	 * Expected structure: { [channel]: { [note]: { [velocityThreshold]: Clip } } }
	 * Each Clip must have a destroy() method.
	 */
	destroy(clips) {
		if (!clips) {
			return;
		}

		for (const channel of Object.values(clips)) {
			for (const note of Object.values(channel)) {
				for (const clip of Object.values(note)) {
					try {
						if (clip && typeof clip.destroy === 'function') {
							clip.destroy();
						}
					} catch (error) {
						console.error('Failed to destroy clip:', error);
					}
				}
			}
		}
	}
}

export default ClipLoader;
