/**
 * Clip Preview Tool
 *
 * Loads and plays clips from the flat clips.json catalog (keyed by clipId).
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

	/** @type {{frameWidth: number, frameHeight: number}|null} Cached frame dimensions for current clip */
	#cachedFrameDimensions = null;

	/** @type {Array<[number, number]>|null} Sorted [frameIndex, frameRate] entries for current clip */
	#cachedFrameRateEntries = null;

	#clipSelect;
	#canvas;
	#ctx;
	#playPauseBtn;
	#prevFrameBtn;
	#nextFrameBtn;
	#frameInfo;
	#metaDisplay;
	#reloadBtn;

	#boundLoadClips;
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
		this.#clipSelect = document.getElementById('clip-id');
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
		this.#clipSelect.addEventListener('change', this.#boundLoadClip);
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
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			this.#clips = await response.json();
			this.#populateClipIds();
		} catch (error) {
			this.#metaDisplay.textContent = `Error loading clips.json: ${error.message}`;
		}
	}

	#populateClipIds() {
		const clipIds = Object.keys(this.#clips).sort((a, b) => a.localeCompare(b));
		this.#clipSelect.innerHTML = clipIds.map(clipId => `<option value="${clipId}">${clipId}</option>`).join('');
		if (clipIds.length > 0) {
			this.#loadClip();
		} else {
			this.#metaDisplay.textContent = 'No clips in catalog';
		}
	}

	async #loadClip() {
		const clipId = this.#clipSelect.value;
		if (!clipId) {
			return;
		}

		this.#currentClipMeta = this.#clips[clipId];
		if (!this.#currentClipMeta) {
			this.#metaDisplay.textContent = 'Clip not found';
			return;
		}

		this.#metaDisplay.textContent = JSON.stringify({ clipId, ...this.#currentClipMeta }, null, 2);
		if (!this.#currentClipMeta.png) {
			this.#metaDisplay.textContent += `\n\nError: png is missing for ${clipId}`;
			return;
		}

		this.#stopClip();
		this.#loadSpriteImage(clipId);
	}

	#loadSpriteImage(clipId) {
		const basePath = ((window && window.AKVJ_CLIPS_BASE) || DEFAULT_CLIP_BASE_PATH).replace(/\/$/, '');
		const pngPath = `${basePath}/${clipId}/${this.#currentClipMeta.png}`;
		this.#spriteImage = new Image();
		this.#spriteImage.onload = () => this.#onSpriteLoaded();
		this.#spriteImage.onerror = () => {
			this.#metaDisplay.textContent += `\n\nError loading: ${pngPath}`;
		};
		this.#spriteImage.src = pngPath;
	}

	#onSpriteLoaded() {
		this.#cacheFrameMetadata();
		this.#setupCanvas();
		this.#currentFrame = 0;
		this.#lastFrameTime = performance.now();
		if (!this.#clipFrameId) {
			this.#animate();
		}
	}

	#cacheFrameMetadata() {
		this.#cachedFrameDimensions = this.#computeFrameDimensions();
		this.#cachedFrameRateEntries = this.#computeFrameRateEntries();
	}

	#computeFrameDimensions() {
		const frameWidth = this.#spriteImage.width / this.#currentClipMeta.framesPerRow;
		const rows = Math.ceil((this.#currentClipMeta.frames ?? this.#currentClipMeta.numberOfFrames) / this.#currentClipMeta.framesPerRow);
		const frameHeight = this.#spriteImage.height / rows;
		return { frameWidth, frameHeight };
	}

	#computeFrameRateEntries() {
		if (!this.#currentClipMeta?.frameRatesForFrames) {
			return null;
		}
		return Object.entries(this.#currentClipMeta.frameRatesForFrames)
			.map(([frameIndex, frameRate]) => [Number(frameIndex), frameRate])
			.sort((a, b) => a[0] - b[0]);
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
		return this.#cachedFrameDimensions ?? this.#computeFrameDimensions();
	}

	#getFrameRate() {
		const entries = this.#cachedFrameRateEntries;
		if (!entries) {
			return DEFAULT_PREVIEW_FRAME_RATE;
		}

		let resolvedRate = DEFAULT_PREVIEW_FRAME_RATE;
		for (const [frameIndex, frameRate] of entries) {
			if (frameIndex <= this.#currentFrame) {
				resolvedRate = frameRate;
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
		this.#frameInfo.textContent = `Frame: ${this.#currentFrame + 1} / ${this.#currentClipMeta.frames ?? this.#currentClipMeta.numberOfFrames}`;
	}

	#animate() {
		const now = performance.now();
		const frameDuration = MS_PER_SECOND / this.#getFrameRate();
		if (this.#isPlaying && now - this.#lastFrameTime >= frameDuration) {
			this.#currentFrame = (this.#currentFrame + 1) % ((this.#currentClipMeta?.frames ?? this.#currentClipMeta?.numberOfFrames) || 1);
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
		const totalFrames = (this.#currentClipMeta?.frames ?? this.#currentClipMeta?.numberOfFrames) || 1;
		this.#currentFrame = (this.#currentFrame - 1 + totalFrames) % totalFrames;
		this.#drawFrame();
	}

	#stepToNextFrame() {
		this.#isPlaying = false;
		this.#playPauseBtn.textContent = 'Play';
		const totalFrames = (this.#currentClipMeta?.frames ?? this.#currentClipMeta?.numberOfFrames) || 1;
		this.#currentFrame = (this.#currentFrame + 1) % totalFrames;
		this.#drawFrame();
	}

	destroy() {
		try {
			this.#stopClip();
		} catch (error) {
			console.error('Error stopping clip in ClipPreview:', error);
		}
		this.#removeDOMListeners();
		this.#removeWindowListeners();
		this.#spriteImage = null;
		this.#currentClipMeta = null;
		this.#clips = {};
		this.#cachedFrameDimensions = null;
		this.#cachedFrameRateEntries = null;
	}

	#removeDOMListeners() {
		try {
			this.#clipSelect.removeEventListener('change', this.#boundLoadClip);
			this.#reloadBtn.removeEventListener('click', this.#boundLoadClips);
			this.#playPauseBtn.removeEventListener('click', this.#boundTogglePlayPause);
			this.#prevFrameBtn.removeEventListener('click', this.#boundStepToPrevFrame);
			this.#nextFrameBtn.removeEventListener('click', this.#boundStepToNextFrame);
		} catch (error) {
			console.error('Error removing DOM listeners in ClipPreview:', error);
		}
	}

	#removeWindowListeners() {
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
	}
}

const clipPreview = new ClipPreview();
clipPreview.setup();
