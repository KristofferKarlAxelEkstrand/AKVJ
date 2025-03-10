import settings from './settings.js';
import appState from './app-state.js';
import AnimationGroup from './animation-group.js';
import AnimationLayer from './animation-layer.js';
import AnimationInstance from './animation-instance.js';

class AdventureKidVideoJockey extends HTMLElement {
	constructor() {
		super();
		this.animations = {};
		this.animationsGroupLibrary = {};
		this.canvas = document.createElement('canvas');
		this.canvas2dContext = this.canvas.getContext('2d');
		this.animationsGroupToLoad = [];
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
		this.canvas2dContext.fillStyle = '#FFFFFF';
		this.appendChild(this.canvas);
		this.init();
	}

	init() {
		async function loadAnimationsJson() {
			try {
				const response = await fetch('/animations/animations.json');

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				this.animationsGroupToLoad = data;

				console.log('Animations loaded successfully:', data);
			} catch (error) {
				console.error('Error fetching animations:', error);
			}
		}

		loadAnimationsJson.call(this).then(() => {
			console.log('loaded', this.animationsGroupToLoad);

			const loadImage = src => {
				return new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = src;
				});
			};

			const loadAnimationGroups = this.animationsGroupToLoad.map(async animationGroupName => {
				console.log('animationGroupName', animationGroupName);

				const animationGroupObject = new AnimationGroup({});

				this.animationsGroupLibrary[animationGroupName] = animationGroupObject;

				const response = await fetch(`/animations/${animationGroupName}/meta.json`);
				const animationGroup = await response.json();
				console.log('animationGroup', animationGroup);

				const loadVelocityLayers = animationGroup.map(async velocityLayer => {
					console.log('animationGroup', velocityLayer.src);

					const image = await loadImage(`/animations/${animationGroupName}/${velocityLayer.src}.png`);

					console.log('animationGroupName', animationGroupName);

					const animationInstance = new AnimationInstance({
						canvas2dContext: this.canvas2dContext,
						image: image,
						numberOfFrames: velocityLayer.numberOfFrames,
						framesPerRow: velocityLayer.framesPerRow,
						loop: velocityLayer.loop,
						frameRatesForFrames: velocityLayer.frameRatesForFrames
					});

					this.animationsGroupLibrary[animationGroupName].addAnimationInstance(animationInstance);
				});

				Promise.all(loadVelocityLayers).then(() => {
					console.log('loaded all velocity layers', this.animationsGroupLibrary);
				});
			});

			Promise.all(loadAnimationGroups).then(() => {
				console.log('loaded all animations', this.animations);
			});
		});

		/*
			const loadImage = src => {
				return new Promise((resolve, reject) => {
					const img = new Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = src;
				});
			};

		const loadAnimations = this.animationsGroupToLoad.map(async animationGroupName => {
			const image = await loadImage(`/animations/${animationGroupName}/frames.png`);
			const response = await fetch(`/animations/${animationGroupName}/meta.json`);
			const meta = await response.json();

			this.animationLibrary[animationGroupName] = new AnimationInstance({
				canvas2dContext: this.canvas2dContext,
				image: image,
				numberOfFrames: meta.numberOfFrames,
				framesPerRow: meta.framesPerRow,
				loop: meta.loop,
				frameRatesForFrames: meta.frameRatesForFrames
			});

			this.animations[animationGroupName] = new AnimationLayer({
				animationInstance: this.animationLibrary[animationGroupName]
			});
		});


		Promise.all(loadAnimations).then(() => {
			this.canvasLayers[0] = this.animations['bg'];
			this.canvasLayers[1] = this.animations.numbers;

			this.loop();
		});

		*/
	}

	loop = () => {
		this.canvas2dContext.fillRect(0, 0, 240, 135);

		this.canvasLayers.forEach(layer => layer.play());
		requestAnimationFrame(this.loop);
	};

	noteOn(channel, note, velocity) {
		console.log(`xxx Note on: channel=${channel}, note=${note}, velocity=${velocity}`);

		switch (channel) {
			case 0:
				console.log('Channel 0');
				break;
			default:
				break;
		}
	}

	noteOff(channel, note) {
		console.log(`Note off: channel=${channel}, note=${note}`);
	}
}

customElements.define('adventure-kid-video-jockey', AdventureKidVideoJockey);
