/**
 * AnimationLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */
import AnimationClip from './AnimationClip.js';
import settings from '../core/settings.js';

class AnimationLoader {
	#displayContext;

	constructor(displayContext) {
		this.#displayContext = displayContext;
	}

	/**
	 * Sanitize animation file name - prevents path traversal and ensures a safe filename.
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
			console.warn('AnimationLoader: invalid file name (must be alphanumeric with .png/.jpg/.jpeg/.gif extension)', filename);
			return '';
		}
		return filenameMatch[1];
	}

	/**
	 * Load and parse clip data from JSON URL
	 */
	async #loadAnimationsJson(jsonUrl) {
		// Add cache-busting query param during development to ensure fresh data
		const fetchUrl = import.meta.env.DEV ? `${jsonUrl}?t=${performance.now()}` : jsonUrl;
		const response = await fetch(fetchUrl);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} for ${jsonUrl}`);
		}

		const animationsMetadata = await response.json();
		// Debug logging only in development mode
		if (import.meta.env.DEV) {
			console.log('JSON for animations loaded:', animationsMetadata);
		}
		return animationsMetadata;
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
	 * Create an AnimationClip from clip metadata and loaded image
	 */
	#createAnimationClip(image, clipMetadata) {
		try {
			return new AnimationClip({
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
			console.error(`AnimationLoader: invalid clip metadata for image ${clipMetadata.png}:`, error);
			return null;
		}
	}

	/**
	 * Load a single clip and return its placement info
	 */
	async #loadAnimation(channel, note, velocityThreshold, clipMetadata) {
		// Validate that channel/note/velocity keys are numeric to avoid path traversal
		if (!/^\d+$/.test(String(channel)) || !/^\d+$/.test(String(note)) || !/^\d+$/.test(String(velocityThreshold))) {
			console.warn('AnimationLoader: ignoring animation with non-numeric path keys', { channel, note, velocityThreshold });
			return null;
		}

		// Construct image path using configurable base path to support subpath deployments
		const animationsBasePath = settings.performance.animationsBasePath;
		const sanitizedFilename = this.#sanitizeFileName(clipMetadata.png);
		// Early return if filename was invalid (warning already logged in #sanitizeFileName)
		if (!sanitizedFilename) {
			return null;
		}
		// Normalize base path to avoid double slashes in the constructed URL
		const normalizedBasePath = animationsBasePath.replace(/\/$/, '');
		const imagePath = `${normalizedBasePath}/animations/${channel}/${note}/${velocityThreshold}/${sanitizedFilename}`;

		try {
			const image = await this.#loadImage(imagePath);
			return {
				channel,
				note,
				velocityThreshold,
				clip: this.#createAnimationClip(image, clipMetadata)
			};
		} catch (error) {
			console.error(`Error loading animation ${channel}/${note}/${velocityThreshold}:`, error);
			return null;
		}
	}

	/**
	 * Set up all animations from JSON metadata
	 */
	async setupAnimations(jsonUrl) {
		const animationsMetadata = await this.#loadAnimationsJson(jsonUrl);
		const animations = {};

		// Collect all load functions for each animation so we can control concurrency
		const loadTasks = [];
		for (const [channel, notes] of Object.entries(animationsMetadata)) {
			for (const [note, velocities] of Object.entries(notes)) {
				for (const [velocityThreshold, clipMetadata] of Object.entries(velocities)) {
					loadTasks.push(() => this.#loadAnimation(channel, note, velocityThreshold, clipMetadata));
				}
			}
		}

		// Run loads with a simple concurrency limit to avoid network flooding for large numbers of assets.
		// Process animations in batches of maxConcurrentLoads size; the final batch may be smaller if the
		// total count is not evenly divisible. This is handled correctly by slice().
		//
		// Note: A pooling pattern (starting new loads immediately when one completes) could provide
		// marginally faster load times. For typical animation counts (< 50) the difference is minimal,
		// and the batching approach is simpler to maintain and reason about. If load performance
		// becomes critical for large asset libraries, consider refactoring to a concurrency pool.
		const maxConcurrentLoads = settings.performance?.maxConcurrentAnimationLoads ?? 8;
		const loadResults = [];
		for (let i = 0; i < loadTasks.length; i += maxConcurrentLoads) {
			const loadBatch = loadTasks.slice(i, i + maxConcurrentLoads).map(loadTask => loadTask());
			const batchResults = await Promise.all(loadBatch);
			loadResults.push(...batchResults);
		}

		// Build the animations object from successful loads
		for (const loadResult of loadResults) {
			if (loadResult) {
				const { channel, note, velocityThreshold, clip } = loadResult;
				animations[channel] ??= {};
				animations[channel][note] ??= {};
				animations[channel][note][velocityThreshold] = clip;
			}
		}

		return animations;
	}

	/**
	 * Clean up loaded image resources from animations object.
	 * Iterates through all clips and calls destroy() to clear image references.
	 *
	 * @param {Object} animations - Nested object containing loaded clips.
	 * Expected structure: { [channel]: { [note]: { [velocityThreshold]: AnimationClip } } }
	 * Each AnimationClip must have a destroy() method.
	 */
	cleanup(animations) {
		if (!animations) {
			return;
		}

		for (const channel of Object.values(animations)) {
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

export default AnimationLoader;
