/**
 * AnimationLayer - Handles individual sprite animation playback and rendering
 * Manages frame-based animations with customizable frame rates and loop behavior
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
		this.currentFramePositionX = 0;
		this.currentFramePositionY = 0;
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

		if (this.frameRatesForFrames[this.lastFrame]) {
			this.framesPerSecond = this.frameRatesForFrames[this.lastFrame];
		}

		this.interval = 1000 / this.framesPerSecond;

		if (this.currentTime > this.lastTime + this.interval) {
			this.frame++;
			if (this.frame >= this.numberOfFrames) {
				this.frame = 0;
				this.currentFramePositionX = 0;
				this.currentFramePositionY = 0;
			}

			this.currentFramePositionY = Math.floor(this.frame / this.framesPerRow);
			this.currentFramePositionX = this.frame - this.currentFramePositionY * this.framesPerRow;

			this.lastTime = this.currentTime;
		}

		this.lastFrame = this.frame;

		// Draw the current frame directly
		this.canvas2dContext.drawImage(this.image, this.frameWidth * this.currentFramePositionX, this.frameHeight * this.currentFramePositionY, this.frameWidth, this.frameHeight, 0, 0, this.canvasWidth, this.canvasHeight);
	}

	stop() {
		if (this.retrigger) {
			// Reset all animation state in one go
			Object.assign(this, {
				currentFramePositionX: 0,
				currentFramePositionY: 0,
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

export default AnimationLayer;
