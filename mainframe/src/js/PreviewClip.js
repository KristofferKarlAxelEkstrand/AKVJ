import '../scss/PreviewClip.scss';
import { advanceFrame, ShuffleState, PingpongState } from './playbackUtils.js';
import { computeFrameDrawRect } from './frameFit.js';
import { DEFAULT_FALLBACK_FRAME_DURATION_MS } from './frameTiming.js';
import { PLAYBACK_MODES, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT } from './clipSchema.js';
import { computeStagingDisplaySize } from './stagingPreviewDisplay.js';

const SPEED_OPTIONS = [0.5, 1, 1.5, 2];
const FALLBACK_MS = DEFAULT_FALLBACK_FRAME_DURATION_MS;

/**
 * PreviewClip — reusable custom element that previews a clip on a canvas,
 * with playback speed control and a progress indicator.
 *
 * @fires PreviewClip#speedchange - CustomEvent when speed changes
 * @fires PreviewClip#framechange - CustomEvent when current frame changes
 * @fires PreviewClip#playbackended - CustomEvent when playback reaches the end
 */
class PreviewClip extends HTMLElement {
	static observedAttributes = ['clip-id', 'playback-mode', 'is-playing', 'current-frame'];

	#clipId = '';
	#playbackMode = 'loop';
	#isPlaying = false;
	#currentFrame = 0;
	#totalFrames = 0;
	#frames = [];
	#durationsMs = [];
	#speed = 1;
	#animationId = null;
	#lastTimestamp = null;
	#shuffleState = null;
	#pingpongState = null;
	#isLoading = false;
	#updatingAttribute = false;

	#canvas = null;
	#ctx = null;
	#speedSelect = null;
	#progress = null;
	#frameLabel = null;
	#playButton = null;

	connectedCallback() {
		this.#render();
		if (this.#clipId) {
			this.#loadClip();
		}
	}

	disconnectedCallback() {
		this.#stopLoop();
		this.replaceChildren();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (this.#updatingAttribute) {
			return;
		}
		const value = newValue ?? '';
		switch (name) {
			case 'clip-id':
				this.#clipId = value;
				if (this.#canvas) {
					this.#loadClip();
				}
				break;
			case 'playback-mode':
				this.playbackMode = value;
				break;
			case 'is-playing':
				this.isPlaying = newValue !== null;
				break;
			case 'current-frame':
				this.currentFrame = value;
				break;
			default:
		}
	}

	/** @returns {string} */
	get clipId() {
		return this.#clipId;
	}

	/** @param {string} value */
	set clipId(value) {
		const next = String(value ?? '');
		if (this.#clipId === next) {
			return;
		}
		this.#clipId = next;
		this.#setAttributeIfChanged('clip-id', next);
		if (this.#canvas) {
			this.#loadClip();
		}
	}

	/** @returns {string} */
	get playbackMode() {
		return this.#playbackMode;
	}

	/** @param {string} value */
	set playbackMode(value) {
		const next = PLAYBACK_MODES.includes(value) ? value : 'loop';
		if (this.#playbackMode === next) {
			return;
		}
		this.#playbackMode = next;
		this.#setAttributeIfChanged('playback-mode', next);
		this.#resetPlaybackState();
		this.#draw();
	}

	/** @returns {boolean} */
	get isPlaying() {
		return this.#isPlaying;
	}

	/** @param {boolean} value */
	set isPlaying(value) {
		const next = Boolean(value);
		if (this.#isPlaying === next) {
			return;
		}
		this.#isPlaying = next;
		this.#toggleAttributeIfChanged('is-playing', next);
		this.#setPlaying(next);
	}

	/** @returns {number} */
	get currentFrame() {
		return this.#currentFrame;
	}

	/** @param {number} value */
	set currentFrame(value) {
		this.#setFrame(Number(value) || 0);
	}

	/** @returns {number} */
	get totalFrames() {
		return this.#totalFrames;
	}

	/** Starts playback. */
	play() {
		this.isPlaying = true;
	}

	/** Pauses playback. */
	pause() {
		this.isPlaying = false;
	}

	/** Stops playback and resets to the first frame. */
	stop() {
		this.isPlaying = false;
		this.#setFrame(0);
	}

	/**
	 * Sets the playback speed multiplier.
	 * @param {number} multiplier
	 */
	setSpeed(multiplier) {
		const next = Number(multiplier) || 1;
		if (this.#speed === next) {
			return;
		}
		this.#speed = next;
		if (this.#speedSelect) {
			this.#speedSelect.value = String(next);
		}
		this.dispatchEvent(new CustomEvent('speedchange', { bubbles: true, detail: { speed: next } }));
	}

	#render() {
		this.replaceChildren();

		const container = document.createElement('div');
		container.className = 'preview-clip';

		this.#canvas = document.createElement('canvas');
		this.#canvas.className = 'preview-clip-canvas';
		this.#syncCanvasSize();
		this.#ctx = this.#canvas.getContext('2d');
		if (this.#ctx) {
			this.#ctx.imageSmoothingEnabled = false;
		}

		const controls = document.createElement('div');
		controls.className = 'preview-clip-controls';

		this.#playButton = document.createElement('button');
		this.#playButton.type = 'button';
		this.#playButton.className = 'preview-clip-play';
		this.#playButton.textContent = 'Play';
		this.#playButton.disabled = this.#frames.length === 0;
		this.#playButton.addEventListener('click', () => {
			this.isPlaying = !this.#isPlaying;
		});

		this.#speedSelect = document.createElement('select');
		this.#speedSelect.className = 'preview-clip-speed';
		for (const speed of SPEED_OPTIONS) {
			const option = document.createElement('option');
			option.value = String(speed);
			option.textContent = `${speed}\u00d7`;
			if (speed === this.#speed) {
				option.selected = true;
			}
			this.#speedSelect.append(option);
		}
		this.#speedSelect.addEventListener('change', () => {
			this.setSpeed(Number(this.#speedSelect.value));
		});

		this.#frameLabel = document.createElement('span');
		this.#frameLabel.className = 'preview-clip-frame-label';
		this.#updateFrameLabel();

		this.#progress = document.createElement('progress');
		this.#progress.className = 'preview-clip-progress';
		this.#progress.value = 0;
		this.#progress.max = 1;

		controls.append(this.#playButton, this.#speedSelect, this.#frameLabel);
		container.append(this.#canvas, controls, this.#progress);
		this.append(container);
	}

	async #loadClip() {
		if (!this.#clipId || this.#isLoading) {
			return;
		}
		this.#isLoading = true;
		this.#stopLoop();
		this.#frames = [];
		this.#durationsMs = [];
		this.#totalFrames = 0;
		this.#currentFrame = 0;
		this.#updateProgress();

		try {
			const response = await fetch(`/api/clips/${encodeURIComponent(this.#clipId)}/frames`);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const clipData = await response.json();
			const frames = Array.isArray(clipData.frames) ? clipData.frames : [];
			const durationsMs = Array.isArray(clipData.durationsMs) ? clipData.durationsMs : [];
			const loaded = await this.#loadImages(frames);
			this.#frames = loaded;
			this.#durationsMs = this.#normalizeDurationsMs(durationsMs, loaded.length);
			this.#totalFrames = loaded.length;
			this.#currentFrame = 0;
			this.#updateProgress();
			this.#draw();
			if (this.#isPlaying) {
				this.#setPlaying(true);
			}
		} catch (error) {
			if (import.meta.env?.DEV) {
				console.warn('PreviewClip failed to load clip:', error);
			}
		} finally {
			this.#isLoading = false;
			this.#updatePlayButton();
		}
	}

	#loadImages(sources) {
		return Promise.all(
			sources.map(
				src =>
					new Promise((resolve, _reject) => {
						if (!src) {
							resolve(null);
							return;
						}
						const img = new Image();
						img.onload = () => resolve(img);
						img.onerror = () => resolve(null);
						img.src = src;
					})
			)
		);
	}

	#normalizeDurationsMs(durationsMs, frameCount) {
		const normalized = [];
		for (let i = 0; i < frameCount; i++) {
			normalized.push(Number.isFinite(durationsMs[i]) && durationsMs[i] > 0 ? durationsMs[i] : FALLBACK_MS);
		}
		return normalized;
	}

	#getFrameIntervalMs() {
		return (this.#durationsMs[this.#currentFrame] ?? FALLBACK_MS) / this.#speed;
	}

	#setPlaying(playing) {
		this.#isPlaying = playing;
		this.#updatePlayButton();
		if (playing) {
			if (this.#playbackMode === 'once' && this.#currentFrame >= this.#totalFrames - 1) {
				this.#setFrame(0);
			}
			this.#lastTimestamp = null;
			if (this.#animationId === null) {
				this.#animationId = requestAnimationFrame(timestamp => this.#animate(timestamp));
			}
		} else {
			this.#stopLoop();
		}
	}

	#stopLoop() {
		this.#isPlaying = false;
		if (this.#animationId !== null) {
			cancelAnimationFrame(this.#animationId);
			this.#animationId = null;
		}
	}

	#animate(timestamp) {
		if (!this.#isPlaying) {
			this.#animationId = null;
			return;
		}
		if (this.#lastTimestamp === null) {
			this.#lastTimestamp = timestamp;
		}
		const elapsedMs = timestamp - this.#lastTimestamp;
		if (elapsedMs >= this.#getFrameIntervalMs()) {
			this.#lastTimestamp = timestamp;
			this.#advanceFrame();
			this.#draw();
		}
		this.#animationId = requestAnimationFrame(ts => this.#animate(ts));
	}

	#advanceFrame() {
		if (this.#totalFrames === 0) {
			return;
		}
		if (this.#playbackMode === 'shuffle' && !this.#shuffleState) {
			this.#shuffleState = new ShuffleState(this.#totalFrames);
		}
		if (this.#playbackMode === 'pingpong' && !this.#pingpongState) {
			this.#pingpongState = new PingpongState();
		}
		const result = advanceFrame(this.#currentFrame, this.#totalFrames, this.#playbackMode, this.#shuffleState, this.#pingpongState);
		this.#currentFrame = result.frame;
		this.#dispatchFrameChange();
		if (result.finished) {
			this.#isPlaying = false;
			this.#updatePlayButton();
			this.dispatchEvent(new CustomEvent('playbackended', { bubbles: true, detail: { currentFrame: this.#currentFrame, totalFrames: this.#totalFrames } }));
		}
	}

	#setFrame(value) {
		const max = Math.max(0, this.#totalFrames - 1);
		const next = Math.max(0, Math.min(max, Number.isFinite(value) ? Math.floor(value) : 0));
		if (this.#currentFrame === next) {
			return;
		}
		this.#currentFrame = next;
		this.#setAttributeIfChanged('current-frame', String(next));
		this.#draw();
		this.#dispatchFrameChange();
	}

	#draw() {
		this.#updateFrameLabel();
		this.#updateProgress();
		if (!this.#ctx || this.#frames.length === 0) {
			return;
		}
		const img = this.#frames[this.#currentFrame];
		if (!img) {
			return;
		}
		this.#syncCanvasSize();
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
		const rect = computeFrameDrawRect(img.naturalWidth || img.width || 1, img.naturalHeight || img.height || 1, this.#canvas.width, this.#canvas.height, 'fit');
		this.#ctx.drawImage(img, rect.sx, rect.sy, rect.sWidth, rect.sHeight, rect.dx, rect.dy, rect.dWidth, rect.dHeight);
	}

	#syncCanvasSize() {
		if (!this.#canvas) {
			return;
		}
		if (this.#canvas.width !== DEFAULT_FRAME_WIDTH || this.#canvas.height !== DEFAULT_FRAME_HEIGHT) {
			this.#canvas.width = DEFAULT_FRAME_WIDTH;
			this.#canvas.height = DEFAULT_FRAME_HEIGHT;
			this.#ctx = this.#canvas.getContext('2d');
			if (this.#ctx) {
				this.#ctx.imageSmoothingEnabled = false;
			}
		}
		const { displayWidth, displayHeight } = computeStagingDisplaySize(DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT);
		this.#canvas.style.width = `${displayWidth}px`;
		this.#canvas.style.height = `${displayHeight}px`;
	}

	#updateFrameLabel() {
		if (this.#frameLabel) {
			this.#frameLabel.textContent = `Frame ${this.#currentFrame + 1} / ${Math.max(1, this.#totalFrames)}`;
		}
	}

	#updateProgress() {
		if (this.#progress) {
			this.#progress.max = Math.max(1, this.#totalFrames);
			this.#progress.value = this.#totalFrames > 0 ? this.#currentFrame + 1 : 0;
		}
	}

	#updatePlayButton() {
		if (this.#playButton) {
			this.#playButton.textContent = this.#isPlaying ? 'Pause' : 'Play';
			this.#playButton.disabled = this.#totalFrames === 0;
		}
	}

	#resetPlaybackState() {
		this.#shuffleState = null;
		this.#pingpongState = null;
	}

	#dispatchFrameChange() {
		this.dispatchEvent(new CustomEvent('framechange', { bubbles: true, detail: { currentFrame: this.#currentFrame, totalFrames: this.#totalFrames } }));
	}

	#setAttributeIfChanged(name, value) {
		if (this.getAttribute(name) === value) {
			return;
		}
		this.#updatingAttribute = true;
		this.setAttribute(name, value);
		this.#updatingAttribute = false;
	}

	#toggleAttributeIfChanged(name, shouldExist) {
		const exists = this.hasAttribute(name);
		if (shouldExist === exists) {
			return;
		}
		this.#updatingAttribute = true;
		if (shouldExist) {
			this.setAttribute(name, '');
		} else {
			this.removeAttribute(name);
		}
		this.#updatingAttribute = false;
	}
}

customElements.define('preview-clip', PreviewClip);

export default PreviewClip;
