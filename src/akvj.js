export function akvj() {
	if (navigator.requestMIDIAccess) {
		navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
	}

	function onMIDISuccess(midiAccess) {
		for (var input of midiAccess.inputs.values())
			input.onmidimessage = getMIDIMessage;

		function getMIDIMessage(midiMessage) {
			const [command, note, velocity] = midiMessage.data;
			const noteName = note % 12;
			const noteOctave = Math.floor(note / 12) - 1;

			if (command === 144 && velocity > 0) {
				console.log(`Note on: ${noteName} ${noteOctave}`);
			} else if (command === 128 || velocity === 0) {
				console.log(`Note off: ${noteName} ${noteOctave}`);
			}
		}
	}

	function onMIDIFailure() {}

	const animations = {
		none: {
			play: function () {
				return;
			},
		},
	};
	const animationsToLoad = ['numbers', 'lover', 'bg'];
	const context = document.getElementById('akvj-canvas').getContext('2d');

	const animation = {
		image: Object.assign(new Image(), { src: '/a/numbers.png' }),
		frames: 64,
		framesPerRow: 8,
		width: 240,
		height: 135,
		loop: true,
		x: 0,
		y: 0,
		frame: 0,
		lastFrame: 0,
		lastTime: 0,
		currentTime: 0,
		interval: 0,
		fps: 0,
		fpss: {
			0: 1,
		},
		play: function () {
			this.currentTime = Date.now();

			if (this.lastFrame > this.frames) {
				this.lastFrame = 0;
				this.frame = 0;
			}

			if (this.fpss[`${this.lastFrame}`]) {
				this.fps = this.fpss[`${this.lastFrame}`];
			}

			this.interval = 1000 / this.fps;

			if (this.currentTime > this.lastTime + this.interval) {
				this.frame++;
				if (this.frame >= this.frames) {
					this.frame = 0;
					this.x = 0;
					this.y = 0;
				}

				this.y = Math.floor(this.frame / this.framesPerRow);
				this.x = this.frame - this.y * this.framesPerRow;

				this.lastTime = this.currentTime;
			}

			this.lastFrame = this.frame;

			context.drawImage(
				this.image,
				this.width * this.x,
				this.height * this.y,
				this.width,
				this.height,
				0,
				0,
				240,
				135
			);
		},
	};

	const loadAnimations = animationsToLoad.map(async (animationName) => {
		const response = await fetch(`/a/${animationName}.json`);
		const data = await response.json();
		const image = Object.assign(new Image(), {
			src: `/a/${animationName}.png`,
		});

		animations[animationName] = Object.assign({}, animation, {
			...data,
			image,
		});
	});

	Promise.all(loadAnimations).then(() => {
		context.imageSmoothingEnabled = false;
		context.webkitImageSmoothingEnabled = false;
		context.mozImageSmoothingEnabled = false;
		context.imageSmoothingQuality = 'low';

		let layer1 = Object.assign({}, animations.bg);
		let layer2 = Object.assign({}, animations.numbers);
		let layer3 = Object.assign({}, animations.lover);

		function loop() {
			layer1.play();
			layer2.play();
			layer3.play();
			requestAnimationFrame(loop);
		}

		loop();
	});
}
