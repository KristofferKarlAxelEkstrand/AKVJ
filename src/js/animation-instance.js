import settings from './settings.js';
class AnimationInstance {
	constructor({ canvas2dContext, image, minVelocity, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 } }) {
		this.canvas2dContext = canvas2dContext;
		this.image = image;
		this.numberOfFrames = numberOfFrames;
		this.framesPerRow = framesPerRow;
		this.frameWidth = this.image.width / this.framesPerRow;
		this.frameHeight = this.image.height / Math.ceil(this.numberOfFrames / this.framesPerRow);
		this.loop = loop;
		this.frameRatesForFrames = frameRatesForFrames;
		this.canvasWidth = settings.canvas.width;
		this.canvasHeight = settings.canvas.height;
		this.minVelocity = minVelocity;
	}
}

export default AnimationInstance;
