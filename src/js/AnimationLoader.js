/**
 * AnimationLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from adventure-kid-video-jockey.js for better separation of concerns
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
			throw new Error(`HTTP error! status: ${response.status}`);
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
			img.onerror = event => {
				let eventMsg;
				if (event && event.message) {
					eventMsg = event.message;
				} else {
					// Extract useful properties from the event object
					const type = event?.type || 'unknown';
					const targetSrc = event?.target?.src || src;
					const errorObj = event?.error ? ` error: ${event.error}` : '';
					eventMsg = `type: ${type}, src: ${targetSrc}${errorObj}`;
				}
				reject(new Error(`Failed to load image: ${src}. Error: ${eventMsg}`));
			};
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

		// Collect all load promises
		const loadPromises = Object.entries(jsonData).flatMap(([channel, notes]) => Object.entries(notes).flatMap(([note, velocities]) => Object.entries(velocities).map(([velocityLayer, animationData]) => this.#loadAnimation(channel, note, velocityLayer, animationData))));

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
}

export default AnimationLoader;
