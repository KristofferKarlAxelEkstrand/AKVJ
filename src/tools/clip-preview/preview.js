/**
 * Clip Preview Tool
 *
 * Loads and plays clips from the clips.json manifest.
 */

const PREVIEW_MAX_SCALE = 4;
const PREVIEW_TARGET_WIDTH = 400;
const DEFAULT_PREVIEW_FRAME_RATE = 12;
const MS_PER_SECOND = 1000;
const DEFAULT_CLIP_BASE_PATH = '/clips';
const DEFAULT_CLIPS_JSON_PATH = '/clips/clips.json';

class ClipPreview {
	#clips = {};
	#currentClipMeta = null;
	#spriteImage = null;
	#currentFrame = 0;
	#isPlaying = true;
	#lastFrameTime = 0;
	#clipFrameId = null;

	#channelSelect;
	#noteSelect;
	#velocitySelect;
	#canvas;
	#ctx;
	#playPauseBtn;
	#prevFrameBtn;
	#nextFrameBtn;
	#frameInfo;
	#metaDisplay;
	#reloadBtn;

	#boundLoadClips;
	#boundPopulateNotes;
	#boundPopulateVelocities;
	#boundLoadClip;
	#boundAnimate;
	#boundHandleVisibilityChange;
	#boundStopClip;
	#boundTogglePlayPause;
	#boundStepToPrevFrame;
	#boundStepToNextFrame;

	constructor() {
		this.#cacheDOMElements();
		this.#bindHandlers();
	}

	#cacheDOMElements() {
		this.#channelSelect = document.getElementById('channel');
		this.#noteSelect = document.getElementById('note');
		this.#velocitySelect = document.getElementById('velocity');
		this.#canvas = document.getElementById('canvas');
		this.#ctx = this.#canvas.getContext('2d');
		this.#playPauseBtn = document.getElementById('play-pause');
		this.#prevFrameBtn = document.getElementById('prev-frame');
		this.#nextFrameBtn = document.getElementById('next-frame');
		this.#frameInfo = document.getElementById('frame-info');
		this.#metaDisplay = document.getElementById('meta-display');
		this.#reloadBtn = document.getElementById('reload');
	}

	#bindHandlers() {
		this.#boundLoadClips = this.#loadClips.bind(this);
		this.#boundPopulateNotes = this.#populateNotes.bind(this);
		this.#boundPopulateVelocities = this.#populateVelocities.bind(this);
		this.#boundLoadClip = this.#loadClip.bind(this);
		this.#boundAnimate = this.#animate.bind(this);
		this.#boundHandleVisibilityChange = this.#handleVisibilityChange.bind(this);
		this.#boundStopClip = this.#stopClip.bind(this);
		this.#boundTogglePlayPause = this.#togglePlayPause.bind(this);
		this.#boundStepToPrevFrame = this.#stepToPrevFrame.bind(this);
		this.#boundStepToNextFrame = this.#stepToNextFrame.bind(this);
	}

	setup() {
		this.#registerEventListeners();
		this.#loadClips();
	}

	#registerEventListeners() {
		this.#channelSelect.addEventListener('change', this.#boundPopulateNotes);
		this.#noteSelect.addEventListener('change', this.#boundPopulateVelocities);
		this.#velocitySelect.addEventListener('change', this.#boundLoadClip);
		this.#reloadBtn.addEventListener('click', this.#boundLoadClips);
		this.#playPauseBtn.addEventListener('click', this.#boundTogglePlayPause);
		this.#prevFrameBtn.addEventListener('click', this.#boundStepToPrevFrame);
		this.#nextFrameBtn.addEventListener('click', this.#boundStepToNextFrame);
		document.addEventListener('visibilitychange', this.#boundHandleVisibilityChange);
		window.addEventListener('beforeunload', this.#boundStopClip);
	}

	async #loadClips() {
		const clipsPath = (window && window.AKVJ_CLIPS_PATH) || DEFAULT_CLIPS_JSON_PATH;
		try {
			const response = await fetch(clipsPath);
			this.#clips = await response.json();
			this.#populateChannels();
		} catch (error) {
			this.#metaDisplay.textContent = `Error loading clips.json: ${error.message}`;
		}
	}

	#populateChannels() {
		const channels = Object.keys(this.#clips).sort((a, b) => Number(a) - Number(b));
		this.#channelSelect.innerHTML = channels.map(channel => `<option value="${channel}">${channel}</option>`).join('');
		if (channels.length > 0) {
			this.#populateNotes();
		}
	}

	#populateNotes() {
		const channel = this.#channelSelect.value;
		const notes = Object.keys(this.#clips[channel] || {}).sort((a, b) => Number(a) - Number(b));
		this.#noteSelect.innerHTML = notes.map(note => `<option value="${note}">${note}</option>`).join('');
		if (notes.length > 0) {
			this.#populateVelocities();
		}
	}

	#populateVelocities() {
		const channel = this.#channelSelect.value;
		const note = this.#noteSelect.value;
		const velocities = Object.keys(this.#clips[channel]?.[note] || {}).sort((a, b) => Number(a) - Number(b));
		this.#velocitySelect.innerHTML = velocities.map(velocity => `<option value="${velocity}">${velocity}</option>`).join('');
		if (velocities.length > 0) {
			this.#loadClip();
		}
	}

	async #loadClip() {
		const channel = this.#channelSelect.value;
		const note = this.#noteSelect.value;
		const velocity = this.#velocitySelect.value;
		if (!channel || !note || !velocity) {
			return;
		}

		this.#currentClipMeta = this.#clips[channel]?.[note]?.[velocity];
		if (!this.#currentClipMeta) {
			this.#metaDisplay.textContent = 'Clip not found';
			return;
		}

		this.#metaDisplay.textContent = JSON.stringify(this.#currentClipMeta, null, 2);
		if (!this.#currentClipMeta.png) {
			this.#metaDisplay.textContent += `\n\nError: currentClipMeta.png is missing for ${channel}/${note}/${velocity}`;
			return;
		}

		this.#stopClip();
		this.#loadSpriteImage(channel, note, velocity);
	}

	#loadSpriteImage(channel, note, velocity) {
		const basePath = (window && window.AKVJ_CLIPS_BASE) || DEFAULT_CLIP_BASE_PATH;
		const pngPath = `${basePath}/${channel}/${note}/${velocity}/${this.#currentClipMeta.png}`;
		this.#spriteImage = new Image();
		this.#spriteImage.onload = () => this.#onSpriteLoaded();
		this.#spriteImage.onerror = () => {
			this.#metaDisplay.textContent += `\n\nError loading: ${pngPath}`;
		};
		this.#spriteImage.src = pngPath;
	}

	#onSpriteLoaded() {
		this.#setupCanvas();
		this.#currentFrame = 0;
		this.#lastFrameTime = performance.now();
		if (!this.#clipFrameId) {
			this.#animate();
		}
	}

	#setupCanvas() {
		if (!this.#spriteImage || !this.#currentClipMeta) {
			return;
		}
		const { frameWidth, frameHeight } = this.#getFrameDimensions();
		const scale = Math.min(PREVIEW_MAX_SCALE, Math.floor(PREVIEW_TARGET_WIDTH / frameWidth));
		this.#canvas.width = frameWidth * scale;
		this.#canvas.height = frameHeight * scale;
		this.#canvas.style.width = `${this.#canvas.width}px`;
		this.#canvas.style.height = `${this.#canvas.height}px`;
		this.#ctx.imageSmoothingEnabled = false;
	}

	#getFrameDimensions() {
		const frameWidth = this.#spriteImage.width / this.#currentClipMeta.framesPerRow;
		const rows = Math.ceil(this.#currentClipMeta.numberOfFrames / this.#currentClipMeta.framesPerRow);
		const frameHeight = this.#spriteImage.height / rows;
		return { frameWidth, frameHeight };
	}

	#getFrameRate() {
		if (!this.#currentClipMeta?.frameRatesForFrames) {
			return DEFAULT_PREVIEW_FRAME_RATE;
		}
		const entries = Object.entries(this.#currentClipMeta.frameRatesForFrames)
			.map(([key, rate]) => [Number(key), rate])
			.sort((a, b) => a[0] - b[0]);

		let resolvedRate = DEFAULT_PREVIEW_FRAME_RATE;
		for (const [frame, rate] of entries) {
			if (Number(frame) <= this.#currentFrame) {
				resolvedRate = rate;
			}
		}
		return resolvedRate;
	}

	#drawFrame() {
		if (!this.#spriteImage || !this.#currentClipMeta) {
			return;
		}
		const { frameWidth, frameHeight } = this.#getFrameDimensions();
		const col = this.#currentFrame % this.#currentClipMeta.framesPerRow;
		const row = Math.floor(this.#currentFrame / this.#currentClipMeta.framesPerRow);
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		this.#ctx.drawImage(this.#spriteImage, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, this.#canvas.width, this.#canvas.height);
		this.#frameInfo.textContent = `Frame: ${this.#currentFrame + 1} / ${this.#currentClipMeta.numberOfFrames}`;
	}

	#animate() {
		const now = performance.now();
		const frameDuration = MS_PER_SECOND / this.#getFrameRate();
		if (this.#isPlaying && now - this.#lastFrameTime >= frameDuration) {
			this.#currentFrame = (this.#currentFrame + 1) % (this.#currentClipMeta?.numberOfFrames || 1);
			this.#lastFrameTime = now;
		}
		this.#drawFrame();
		this.#clipFrameId = requestAnimationFrame(this.#boundAnimate);
	}

	#stopClip() {
		if (this.#clipFrameId) {
			cancelAnimationFrame(this.#clipFrameId);
			this.#clipFrameId = null;
		}
	}

	#handleVisibilityChange() {
		if (document.hidden) {
			this.#stopClip();
		} else if (this.#currentClipMeta && !this.#clipFrameId) {
			this.#lastFrameTime = performance.now();
			this.#animate();
		}
	}

	#togglePlayPause() {
		this.#isPlaying = !this.#isPlaying;
		this.#playPauseBtn.textContent = this.#isPlaying ? 'Pause' : 'Play';
	}

	#stepToPrevFrame() {
		this.#isPlaying = false;
		this.#playPauseBtn.textContent = 'Play';
		const totalFrames = this.#currentClipMeta?.numberOfFrames || 1;
		this.#currentFrame = (this.#currentFrame - 1 + totalFrames) % totalFrames;
		this.#drawFrame();
	}

	#stepToNextFrame() {
		this.#isPlaying = false;
		this.#playPauseBtn.textContent = 'Play';
		const totalFrames = this.#currentClipMeta?.numberOfFrames || 1;
		this.#currentFrame = (this.#currentFrame + 1) % totalFrames;
		this.#drawFrame();
	}

	destroy() {
		try {
			this.#stopClip();
		} catch (error) {
			console.error('Error stopping clip in ClipPreview:', error);
		}
		try {
			this.#channelSelect.removeEventListener('change', this.#boundPopulateNotes);
			this.#noteSelect.removeEventListener('change', this.#boundPopulateVelocities);
			this.#velocitySelect.removeEventListener('change', this.#boundLoadClip);
			this.#reloadBtn.removeEventListener('click', this.#boundLoadClips);
			this.#playPauseBtn.removeEventListener('click', this.#boundTogglePlayPause);
			this.#prevFrameBtn.removeEventListener('click', this.#boundStepToPrevFrame);
			this.#nextFrameBtn.removeEventListener('click', this.#boundStepToNextFrame);
		} catch (error) {
			console.error('Error removing DOM listeners in ClipPreview:', error);
		}
		try {
			document.removeEventListener('visibilitychange', this.#boundHandleVisibilityChange);
		} catch (error) {
			console.error('Error removing visibilitychange listener in ClipPreview:', error);
		}
		try {
			window.removeEventListener('beforeunload', this.#boundStopClip);
		} catch (error) {
			console.error('Error removing beforeunload listener in ClipPreview:', error);
		}
		this.#spriteImage = null;
		this.#currentClipMeta = null;
		this.#clips = {};
	}
}

const clipPreview = new ClipPreview();
clipPreview.setup();
