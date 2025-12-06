/**
 * AnimationLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from AdventureKidVideoJockey.js (src/js/core/) for better separation of concerns
 */
import AnimationLayer from './AnimationLayer.js';

class AnimationLoader {
	#canvas2dContext;

	constructor(canvas2dContext) {
		this.#canvas2dContext = canvas2dContext;
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
		const imagePath = `/animations/${channel}/${note}/${velocityLayer}/${animationData.png}`;

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

		// Collect all load promises (expanded to improve readability)
		const loadPromises = [];
		for (const [channel, notes] of Object.entries(jsonData)) {
			for (const [note, velocities] of Object.entries(notes)) {
				for (const [velocityLayer, animationData] of Object.entries(velocities)) {
					loadPromises.push(this.#loadAnimation(channel, note, velocityLayer, animationData));
				}
			}
		}

		// Load all animations in parallel
		const results = await Promise.all(loadPromises);

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
						layer.dispose();
					} catch (error) {
						console.error('Failed to dispose animation layer:', error);
					}
				}
			}
		}
	}
}

export default AnimationLoader;
