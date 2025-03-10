class AnimationLayer {
	constructor({ animationInstance }) {
		// From animation instance
		this.canvas2dContext = animationInstance.canvas2dContext;
		this.image = animationInstance.image;
		this.numberOfFrames = animationInstance.numberOfFrames;
		this.framesPerRow = animationInstance.framesPerRow;
		this.frameRatesForFrames = animationInstance.frameRatesForFrames;
		this.frameWidth = animationInstance.frameWidth;
		this.frameHeight = animationInstance.frameHeight;
		this.loop = animationInstance.loop;
		this.canvasWidth = animationInstance.canvasWidth;
		this.canvasHeight = animationInstance.canvasHeight;

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

		const drawImageParams = {
			destWidth: this.canvasWidth,
			destHeight: this.canvasHeight,
			destX: 0,
			destY: 0,
			image: this.image,
			sourceHeight: this.frameHeight,
			sourceWidth: this.frameWidth,
			sourceX: this.frameWidth * this.CurrentFramePositionX,
			sourceY: this.frameHeight * this.CurrentFramePositionY
		};

		this.canvas2dContext.drawImage(drawImageParams.image, drawImageParams.sourceX, drawImageParams.sourceY, drawImageParams.sourceWidth, drawImageParams.sourceHeight, drawImageParams.destX, drawImageParams.destY, drawImageParams.destWidth, drawImageParams.destHeight);
	}
}

export default AnimationLayer;
