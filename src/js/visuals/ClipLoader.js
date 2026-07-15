/**
 * ClipLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */
import ClipClip from './ClipClip.js';
import settings from '../core/settings.js';

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
	 * Create an ClipClip from clip metadata and loaded image
	 */
	#createClipClip(image, clipMetadata) {
		try {
			return new ClipClip({
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
				clip: this.#createClipClip(image, clipMetadata)
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
		const clips = {};

		// Collect all load functions for each clip so we can control concurrency
		const loadTasks = [];
		for (const [channel, notes] of Object.entries(clipsMetadata)) {
			for (const [note, velocities] of Object.entries(notes)) {
				for (const [velocityThreshold, clipMetadata] of Object.entries(velocities)) {
					loadTasks.push(() => this.#loadClip(channel, note, velocityThreshold, clipMetadata));
				}
			}
		}

		// Run loads with a simple concurrency limit to avoid network flooding for large numbers of assets.
		// Process clips in batches of maxConcurrentLoads size; the final batch may be smaller if the
		// total count is not evenly divisible. This is handled correctly by slice().
		//
		// Note: A pooling pattern (starting new loads immediately when one completes) could provide
		// marginally faster load times. For typical clip counts (< 50) the difference is minimal,
		// and the batching approach is simpler to maintain and reason about. If load performance
		// becomes critical for large asset libraries, consider refactoring to a concurrency pool.
		const maxConcurrentLoads = settings.performance?.maxConcurrentClipLoads ?? 8;
		const loadResults = [];
		for (let i = 0; i < loadTasks.length; i += maxConcurrentLoads) {
			const loadBatch = loadTasks.slice(i, i + maxConcurrentLoads).map(loadTask => loadTask());
			const batchResults = await Promise.all(loadBatch);
			loadResults.push(...batchResults);
		}

		// Build the clips object from successful loads
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
	 * Clean up loaded image resources from clips object.
	 * Iterates through all clips and calls destroy() to clear image references.
	 *
	 * @param {Object} clips - Nested object containing loaded clips.
	 * Expected structure: { [channel]: { [note]: { [velocityThreshold]: ClipClip } } }
	 * Each ClipClip must have a destroy() method.
	 */
	cleanup(clips) {
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
