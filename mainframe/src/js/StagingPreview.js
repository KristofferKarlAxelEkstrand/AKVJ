const PLAYBACK_MODES = ['loop', 'once', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub'];

/**
 * AkvjStagingPreview — custom element showing a live canvas preview of staged
 * PNG frames at target resolution. Provides play/pause, scrub, and speed controls.
 * Reuses the preview player pattern from ClipList.
 *
 * @fires AkvjStagingPreview#framesloaded - CustomEvent when frames finish loading
 */
class AkvjStagingPreview extends HTMLElement {
	#stagedImages = [];
	#currentFrame = 0;
	#lastFrameTime = 0;
	#animationFrameId = null;
	#isPlaying = false;
	#playbackSpeed = 1;
	#isScrubbing = false;
	#targetWidth = 240;
	#targetHeight = 135;
	#frameRate = 12;
	#playbackMode = 'loop';
	#canvas = null;
	#ctx = null;
	#frameLabel = null;
	#scrubSlider = null;
	#playPauseButton = null;
	#speedSelect = null;

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.#stopPlayback();
		this.replaceChildren();
	}

	/**
	 * Load staged File objects as Image elements.
	 * @param {File[]} files
	 * @param {number} targetWidth
	 * @param {number} targetHeight
	 * @param {number} frameRate
	 * @param {string} playbackMode
	 */
	async loadFrames(files, targetWidth, targetHeight, frameRate, playbackMode) {
		this.#targetWidth = targetWidth || 240;
		this.#targetHeight = targetHeight || 135;
		this.#frameRate = frameRate || 12;
		this.#playbackMode = PLAYBACK_MODES.includes(playbackMode) ? playbackMode : 'loop';
		this.#stopPlayback();
		this.#stagedImages = [];
		this.#currentFrame = 0;

		if (this.#frameLabel) {
			this.#frameLabel.textContent = 'Loading…';
		}
		if (this.#scrubSlider) {
			this.#scrubSlider.disabled = true;
			this.#scrubSlider.max = '0';
			this.#scrubSlider.value = '0';
		}

		if (!files || files.length === 0) {
			if (this.#frameLabel) {
				this.#frameLabel.textContent = 'No frames staged';
			}
			return;
		}

		const imagePromises = files.map(
			file =>
				new Promise((resolve, reject) => {
					const url = URL.createObjectURL(file);
					const img = new Image();
					img.onload = () => {
						URL.revokeObjectURL(url);
						resolve(img);
					};
					img.onerror = () => {
						URL.revokeObjectURL(url);
						reject(new Error(`Failed to load ${file.name}`));
					};
					img.src = url;
				})
		);

		try {
			this.#stagedImages = await Promise.all(imagePromises);
		} catch (error) {
			if (this.#frameLabel) {
				this.#frameLabel.textContent = error.message;
			}
			return;
		}

		if (this.#scrubSlider) {
			this.#scrubSlider.max = String(Math.max(0, this.#stagedImages.length - 1));
			this.#scrubSlider.disabled = false;
		}

		this.#drawCurrentFrame();
		this.#setPlaying(true);
		this.dispatchEvent(new CustomEvent('framesloaded', { bubbles: true, detail: { count: this.#stagedImages.length } }));
	}

	#render() {
		this.replaceChildren();

		const container = document.createElement('div');
		container.className = 'clip-preview-player';

		this.#canvas = document.createElement('canvas');
		this.#canvas.width = this.#targetWidth;
		this.#canvas.height = this.#targetHeight;
		this.#canvas.className = 'clip-preview-canvas staging-preview-canvas';
		this.#ctx = this.#canvas.getContext('2d');
		this.#ctx.imageSmoothingEnabled = false;

		const controls = document.createElement('div');
		controls.className = 'clip-preview-controls';

		this.#frameLabel = document.createElement('span');
		this.#frameLabel.className = 'clip-preview-frame-label';
		this.#frameLabel.textContent = 'No frames staged';

		this.#playPauseButton = document.createElement('button');
		this.#playPauseButton.type = 'button';
		this.#playPauseButton.className = 'clip-preview-play';
		this.#playPauseButton.textContent = 'Play';
		this.#playPauseButton.disabled = true;
		this.#playPauseButton.addEventListener('click', () => {
			if (this.#isPlaying) {
				this.#setPlaying(false);
			} else {
				if (this.#currentFrame >= this.#stagedImages.length - 1 && this.#playbackMode === 'once') {
					this.#currentFrame = 0;
				}
				this.#setPlaying(true);
			}
		});

		this.#scrubSlider = document.createElement('input');
		this.#scrubSlider.type = 'range';
		this.#scrubSlider.className = 'clip-preview-scrub';
		this.#scrubSlider.min = 0;
		this.#scrubSlider.max = 0;
		this.#scrubSlider.value = 0;
		this.#scrubSlider.disabled = true;
		this.#scrubSlider.addEventListener('input', () => {
			this.#isScrubbing = true;
			this.#currentFrame = Number(this.#scrubSlider.value);
			this.#drawCurrentFrame();
		});
		this.#scrubSlider.addEventListener('change', () => {
			this.#isScrubbing = false;
		});

		this.#speedSelect = document.createElement('select');
		this.#speedSelect.className = 'clip-preview-speed';
		for (const speed of [0.25, 0.5, 1, 2, 4]) {
			const option = document.createElement('option');
			option.value = String(speed);
			option.textContent = `${speed}\u00d7`;
			if (speed === 1) {
				option.selected = true;
			}
			this.#speedSelect.append(option);
		}
		this.#speedSelect.addEventListener('change', () => {
			this.#playbackSpeed = Number(this.#speedSelect.value);
		});

		controls.append(this.#frameLabel, this.#playPauseButton, this.#speedSelect);
		container.append(this.#canvas, controls, this.#scrubSlider);
		this.append(container);
	}

	#drawCurrentFrame() {
		if (!this.#ctx || this.#stagedImages.length === 0) {
			return;
		}
		const img = this.#stagedImages[this.#currentFrame];
		if (!img) {
			return;
		}

		if (this.#canvas.width !== this.#targetWidth || this.#canvas.height !== this.#targetHeight) {
			this.#canvas.width = this.#targetWidth;
			this.#canvas.height = this.#targetHeight;
			this.#ctx.imageSmoothingEnabled = false;
		}

		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		this.#ctx.drawImage(img, 0, 0, this.#canvas.width, this.#canvas.height);
		this.#frameLabel.textContent = `Frame ${this.#currentFrame + 1} / ${this.#stagedImages.length}`;
		if (!this.#isScrubbing) {
			this.#scrubSlider.value = String(this.#currentFrame);
		}
	}

	#getFrameInterval() {
		return 1000 / this.#frameRate / this.#playbackSpeed;
	}

	#setPlaying(playing) {
		this.#isPlaying = playing;
		this.#playPauseButton.textContent = playing ? 'Pause' : 'Play';
		if (playing) {
			this.#lastFrameTime = 0;
			if (this.#animationFrameId === null) {
				this.#animationFrameId = requestAnimationFrame(timestamp => this.#animate(timestamp));
			}
		}
	}

	#animate(timestamp) {
		if (!this.#isPlaying) {
			this.#animationFrameId = null;
			return;
		}
		if (this.#lastFrameTime === 0) {
			this.#lastFrameTime = timestamp;
		}
		const elapsed = timestamp - this.#lastFrameTime;
		if (elapsed >= this.#getFrameInterval()) {
			this.#lastFrameTime = timestamp;
			this.#advanceFrame();
			this.#drawCurrentFrame();
		}
		this.#animationFrameId = requestAnimationFrame(ts => this.#animate(ts));
	}

	#advanceFrame() {
		const frameCount = this.#stagedImages.length;
		switch (this.#playbackMode) {
			case 'reverse':
				this.#currentFrame = (this.#currentFrame - 1 + frameCount) % frameCount;
				break;
			case 'random':
				this.#currentFrame = Math.floor(Math.random() * frameCount);
				break;
			case 'shuffle':
				this.#currentFrame = Math.floor(Math.random() * frameCount);
				break;
			case 'once':
				this.#currentFrame++;
				if (this.#currentFrame >= frameCount) {
					this.#currentFrame = frameCount - 1;
					this.#setPlaying(false);
					this.#frameLabel.textContent = `Frame ${this.#currentFrame + 1} / ${frameCount} (finished)`;
				}
				break;
			case 'pingpong': {
				const cycle = this.#currentFrame + 1;
				const phase = cycle % (frameCount * 2);
				this.#currentFrame = phase < frameCount ? phase : frameCount * 2 - phase - 1;
				break;
			}
			case 'loop':
			case 'scrub':
			default:
				this.#currentFrame = (this.#currentFrame + 1) % frameCount;
				break;
		}
	}

	#stopPlayback() {
		this.#isPlaying = false;
		if (this.#animationFrameId !== null) {
			cancelAnimationFrame(this.#animationFrameId);
			this.#animationFrameId = null;
		}
	}
}

customElements.define('akvj-staging-preview', AkvjStagingPreview);

export default AkvjStagingPreview;
