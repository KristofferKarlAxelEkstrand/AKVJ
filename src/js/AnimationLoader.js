/**
 * AnimationLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from adventure-kid-video-jockey.js for better separation of concerns
 */
import AnimationLayer from './AnimationLayer.js';

class AnimationLoader {
	constructor(canvas2dContext) {
		this.canvas2dContext = canvas2dContext;
	}

	/**
	 * Load and parse animation data from JSON URL
	 */
	async loadAnimationsJson(jsonUrl) {
		try {
			const response = await fetch(jsonUrl);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log('JSON for animations loaded:', data);
			return data;
		} catch (error) {
			console.error('Error fetching animations:', error);
			throw error;
		}
	}

	/**
	 * Load an image from a source URL
	 */
	loadImage(src) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = src;
		});
	}

	/**
	 * Set up all animations from JSON data
	 */
	async setUpAnimations(jsonUrl) {
		const jsonDataAnimations = await this.loadAnimationsJson(jsonUrl);
		const animations = {};

		console.log('Json Loaded', jsonDataAnimations);

		const loadPromises = [];

		Object.keys(jsonDataAnimations).forEach(channel => {
			animations[channel] = {};

			Object.keys(jsonDataAnimations[channel]).forEach(note => {
				animations[channel][note] = {};

				Object.keys(jsonDataAnimations[channel][note]).forEach(velocityLayer => {
					const animationData = jsonDataAnimations[channel][note][velocityLayer];
					const imagePath = `/animations/${channel}/${note}/${velocityLayer}/${animationData.png}`;

					const loadPromise = this.loadImage(imagePath)
						.then(image => {
							const animationInstance = new AnimationLayer({
								canvas2dContext: this.canvas2dContext,
								image: image,
								numberOfFrames: animationData.numberOfFrames,
								framesPerRow: animationData.framesPerRow,
								loop: animationData.loop,
								frameRatesForFrames: animationData.frameRatesForFrames,
								retrigger: animationData.retrigger
							});

							animations[channel][note][velocityLayer] = animationInstance;
						})
						.catch(error => {
							console.error('Error loading image:', error);
						});

					loadPromises.push(loadPromise);
				});
			});
		});

		// Wait for all animations to load
		await Promise.all(loadPromises);
		return animations;
	}
}

export default AnimationLoader;
