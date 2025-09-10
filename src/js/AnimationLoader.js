/**
 * AnimationLoader - Handles loading and parsing of PNG sprites and JSON metadata
 * Extracted from adventure-kid-video-jockey.js for better separation of concerns
 */
import settings from './settings.js';

class AnimationLayer {
	constructor({ canvas2dContext, image, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 }, retrigger = true }) {
		this.canvas2dContext = canvas2dContext;
		this.image = image;
		this.numberOfFrames = numberOfFrames;
		this.framesPerRow = framesPerRow;
		this.frameRatesForFrames = frameRatesForFrames;
		this.frameWidth = this.image.width / this.framesPerRow;
		this.frameHeight = this.image.height / Math.ceil(this.numberOfFrames / this.framesPerRow);
		this.loop = loop;
		this.retrigger = retrigger;
		this.canvasWidth = settings.canvas.width;
		this.canvasHeight = settings.canvas.height;

		// Scoped
		this.CurrentFramePositionX = 0;
		this.CurrentFramePositionY = 0;
		this.frame = 0;
		this.lastFrame = 0;
		this.lastTime = 0;
		this.currentTime = 0;
		this.interval = 0;
		this.framesPerSecond = 1;
	}

	play() {
		this.currentTime = Date.now();

		if (this.lastFrame >= this.numberOfFrames) {
			this.lastFrame = 0;
			this.frame = 0;
			if (!this.loop) return;
		}

		if (this.frameRatesForFrames[`${this.lastFrame}`]) {
			this.framesPerSecond = this.frameRatesForFrames[`${this.lastFrame}`];
		}

		this.interval = 1000 / this.framesPerSecond;

		if (this.currentTime > this.lastTime + this.interval) {
			this.frame++;
			if (this.frame >= this.numberOfFrames) {
				this.frame = 0;
				this.CurrentFramePositionX = 0;
				this.CurrentFramePositionY = 0;
			}

			this.CurrentFramePositionY = Math.floor(this.frame / this.framesPerRow);
			this.CurrentFramePositionX = this.frame - this.CurrentFramePositionY * this.framesPerRow;

			this.lastTime = this.currentTime;
		}

		this.lastFrame = this.frame;

		// Draw the current frame directly
		this.canvas2dContext.drawImage(this.image, this.frameWidth * this.CurrentFramePositionX, this.frameHeight * this.CurrentFramePositionY, this.frameWidth, this.frameHeight, 0, 0, this.canvasWidth, this.canvasHeight);
	}

	stop() {
		if (this.retrigger) {
			// Reset all animation state in one go
			Object.assign(this, {
				CurrentFramePositionX: 0,
				CurrentFramePositionY: 0,
				frame: 0,
				lastFrame: 0,
				lastTime: 0,
				currentTime: 0,
				interval: 0,
				framesPerSecond: 1
			});
		}
	}
}

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
		await Promise.allSettled(loadPromises);
		return animations;
	}
}

export { AnimationLoader, AnimationLayer };
export default AnimationLoader;
