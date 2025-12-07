/**
 * AnimationLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */
import AnimationLayer from './AnimationLayer.js';
import settings from '../core/settings.js';

class AnimationLoader {
	#canvas2dContext;

	constructor(canvas2dContext) {
		this.#canvas2dContext = canvas2dContext;
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
		const match = filename.match(/^([a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?\.(png|jpg|jpeg|gif))$/i);
		if (!match) {
			console.warn('AnimationLoader: invalid file name (must be alphanumeric with .png/.jpg/.jpeg/.gif extension)', filename);
			return '';
		}
		return match[1];
	}

	/**
	 * Load and parse animation data from JSON URL
	 */
	async #loadAnimationsJson(jsonUrl) {
		const response = await fetch(jsonUrl);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} for ${jsonUrl}`);
		}

		const data = await response.json();
		console.log('JSON for animations loaded:', data);
		return data;
	}

	/**
	 * Load an image from a source URL
	 */
	#loadImage(src) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			// Use crossOrigin from settings if present. If null/undefined, do not set.
			const cross = settings.performance?.imageCrossOrigin;
			if (cross) {
				img.crossOrigin = cross;
			}
			img.onload = () => resolve(img);
			img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
			img.src = src;
		});
	}

	/**
	 * Create an AnimationLayer from animation data and loaded image
	 */
	#createAnimationLayer(image, animationData) {
		return new AnimationLayer({
			canvas2dContext: this.#canvas2dContext,
			image,
			numberOfFrames: animationData.numberOfFrames,
			framesPerRow: animationData.framesPerRow,
			loop: animationData.loop,
			frameRatesForFrames: animationData.frameRatesForFrames,
			retrigger: animationData.retrigger
		});
	}

	/**
	 * Load a single animation and return its placement info
	 */
	async #loadAnimation(channel, note, velocityLayer, animationData) {
		// Construct image path using configurable base path to support subpath deployments
		const base = settings.performance?.animationsBasePath ?? import.meta.env.BASE_URL ?? '/';
		const sanitizedFile = this.#sanitizeFileName(animationData.png);
		const imagePath = `${base}animations/${channel}/${note}/${velocityLayer}/${sanitizedFile}`;

		try {
			const image = await this.#loadImage(imagePath);
			return {
				channel,
				note,
				velocityLayer,
				layer: this.#createAnimationLayer(image, animationData)
			};
		} catch (error) {
			console.error(`Error loading animation ${channel}/${note}/${velocityLayer}:`, error);
			return null;
		}
	}

	/**
	 * Set up all animations from JSON data
	 */
	async setUpAnimations(jsonUrl) {
		const jsonData = await this.#loadAnimationsJson(jsonUrl);
		const animations = {};

		// Collect all load functions for each animation so we can control concurrency
		const loadFuncs = [];
		for (const [channel, notes] of Object.entries(jsonData)) {
			for (const [note, velocities] of Object.entries(notes)) {
				for (const [velocityLayer, animationData] of Object.entries(velocities)) {
					loadFuncs.push(() => this.#loadAnimation(channel, note, velocityLayer, animationData));
				}
			}
		}

		// Run loads with a simple concurrency limit to avoid network flooding for large numbers of assets.
		// Process animations in batches of CONCURRENCY size; the final batch may be smaller if the
		// total count is not evenly divisible. This is handled correctly by slice().
		//
		// Note: A pooling pattern (starting new loads immediately when one completes) could provide
		// marginally faster load times. For typical animation counts (< 50) the difference is minimal,
		// and the batching approach is simpler to maintain and reason about. If load performance
		// becomes critical for large asset libraries, consider refactoring to a concurrency pool.
		const CONCURRENCY = settings.performance?.maxConcurrentAnimationLoads ?? 8;
		const results = [];
		for (let i = 0; i < loadFuncs.length; i += CONCURRENCY) {
			const chunk = loadFuncs.slice(i, i + CONCURRENCY).map(fn => fn());
			const chunkResults = await Promise.all(chunk);
			results.push(...chunkResults);
		}

		// Build the animations object from successful loads
		for (const result of results) {
			if (result) {
				const { channel, note, velocityLayer, layer } = result;
				animations[channel] ??= {};
				animations[channel][note] ??= {};
				animations[channel][note][velocityLayer] = layer;
			}
		}

		return animations;
	}

	/**
	 * Clean up loaded image resources from animations object.
	 * Iterates through all layers and calls dispose() to clear image references.
	 *
	 * @param {Object} animations - Nested object containing loaded animation layers.
	 * Expected structure: { [channel]: { [note]: { [velocityLayer]: AnimationLayer } } }
	 * Each AnimationLayer must have a dispose() method.
	 */
	cleanup(animations) {
		if (!animations) {
			return;
		}

		for (const channel of Object.values(animations)) {
			for (const note of Object.values(channel)) {
				for (const layer of Object.values(note)) {
					try {
						if (layer && typeof layer.dispose === 'function') {
							layer.dispose();
						}
					} catch (error) {
						console.error('Failed to dispose animation layer:', error);
					}
				}
			}
		}
	}
}

export default AnimationLoader;
