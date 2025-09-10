import appState from './app-state.js';

const settings = {
	canvas: {
		width: 240,
		height: 135
	}
};

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

class AdventureKidVideoJockey extends HTMLElement {
	constructor() {
		super();
		this.animations = {};
		this.canvas = document.createElement('canvas');
		this.canvas2dContext = this.canvas.getContext('2d');
		this.canvasLayers = [];
	}

	connectedCallback() {
		appState.adventureKidVideoJockey = this;
		this.canvas.width = settings.canvas.width;
		this.canvas.height = settings.canvas.height;
		this.canvas2dContext.imageSmoothingEnabled = false;
		this.canvas2dContext.webkitImageSmoothingEnabled = false;
		this.canvas2dContext.mozImageSmoothingEnabled = false;
		this.canvas2dContext.imageSmoothingQuality = 'low';
		this.canvas2dContext.fillStyle = '#000000';
		this.appendChild(this.canvas);
		this.init();
	}

	setUpAnimations(jsonUrl) {
		let jsonDataAnimations = {};
		let animations = {};

		async function loadAnimationsJson() {
			try {
				const response = await fetch(jsonUrl);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				jsonDataAnimations = data;

				console.log('JSON for animations loaded:', data);
			} catch (error) {
				console.error('Error fetching animations:', error);
			}
		}

		loadAnimationsJson.call(this).then(() => {
			console.log('Json Loaded', jsonDataAnimations);

			const loadImage = src => {
				return new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = src;
				});
			};

			Object.keys(jsonDataAnimations).forEach(channel => {
				animations[channel] = {};

				Object.keys(jsonDataAnimations[channel]).forEach(note => {
					animations[channel][note] = {};

					Object.keys(jsonDataAnimations[channel][note]).forEach(velocityLayer => {
						loadImage(`/animations/${channel}/${note}/${velocityLayer}/${jsonDataAnimations[channel][note][velocityLayer].png}`)
							.then(image => {
								const animationInstance = new AnimationLayer({
									canvas2dContext: this.canvas2dContext,
									image: image,
									numberOfFrames: jsonDataAnimations[channel][note][velocityLayer].numberOfFrames,
									framesPerRow: jsonDataAnimations[channel][note][velocityLayer].framesPerRow,
									loop: jsonDataAnimations[channel][note][velocityLayer].loop,
									frameRatesForFrames: jsonDataAnimations[channel][note][velocityLayer].frameRatesForFrames,
									retrigger: jsonDataAnimations[channel][note][velocityLayer].retrigger
								});

								animations[channel][note][velocityLayer] = animationInstance;
							})
							.catch(error => {
								console.error('Error loading image:', error);
							});
					});
				});
			});
		});
		return animations;
	}

	init() {
		this.animations = this.setUpAnimations('/animations/animations.json');
		this.loop();
	}

	loop = () => {
		this.canvas2dContext.fillRect(0, 0, settings.canvas.width, settings.canvas.height);
		this.canvasLayers.forEach(layer => {
			layer.forEach(note => {
				if (note) {
					note.play();
				}
			});
		});
		requestAnimationFrame(this.loop);
	};

	noteOn(channel, note, velocity) {
		if (!this.animations[channel] || !this.animations[channel][note]) {
			return;
		}

		const velocities = Object.keys(this.animations[channel][note])
			.map(Number)
			.sort((a, b) => a - b);

		// Find the highest velocity layer that doesn't exceed the input velocity
		const foundVelocity = velocities.findLast(v => velocity <= v);
		const selectedVelocity = foundVelocity ? foundVelocity : velocities[velocities.length - 1];

		if (!this.canvasLayers[channel]) {
			this.canvasLayers[channel] = [];
		}
		this.canvasLayers[channel][note] = this.animations[channel][note][selectedVelocity];
	}

	noteOff(channel, note) {
		this.canvasLayers[channel][note].stop();
		this.canvasLayers[channel][note] = null;
	}
}

customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
