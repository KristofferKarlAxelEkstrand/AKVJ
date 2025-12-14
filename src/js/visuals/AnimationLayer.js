/**
 * AnimationLayer - Handles individual sprite animation playback and rendering
 * Manages frame-based animations with customizable frame rates and loop behavior
 *
 * Supports three timing modes:
 * 1. frameRatesForFrames (FPS) - Frame timing in frames-per-second (default)
 * 2. beatsPerFrame (BPM sync) - Frame timing in beats, synced to current BPM
 * 3. pulsesPerFrame (Clock sync) - Frame advances on MIDI clock pulses (real-time sync)
 */
import settings from '../core/settings.js';
import appState from '../core/AppState.js';

class AnimationLayer {
	// Configuration (immutable after construction)
	#canvas2dContext;
	#image;
	#numberOfFrames;
	#framesPerRow;
	#frameRatesForFrames;
	#beatsPerFrame; // Array or single number for BPM sync
	#frameWidth;
	#frameHeight;
	#loop;
	#retrigger;
	#bitDepth; // For mask mixing (1, 2, 4, or 8 bit)
	#canvasWidth;
	#canvasHeight;

	// Animation state (mutable)
	#frame = 0;
	/** @type {number|null} Last timestamp from performance.now(), null if never played */
	#lastTime = null;
	#lastAdvanceTimestamp = null; // Prevent double-advancement within same timestamp
	#isFinished = false;
	#defaultFrameRate; // Cached fallback rate when frame-specific rate is undefined
	#useBPMSync = false; // Whether to use BPM sync mode
	#useClockSync = false; // Whether to use MIDI clock pulse sync mode
	#pulsesPerFrame; // Array of pulses per frame for clock sync
	#pulseCount = 0; // Accumulated clock pulses since last frame advance
	#unsubscribeClock = null; // Cleanup for clock subscription

	constructor({ canvas2dContext, image, numberOfFrames, framesPerRow, loop = true, frameRatesForFrames = { 0: 1 }, beatsPerFrame = null, pulsesPerFrame = null, retrigger = true, bitDepth = null }) {
		if (!numberOfFrames || numberOfFrames < 1) {
			throw new Error('AnimationLayer requires numberOfFrames >= 1');
		}
		if (!framesPerRow || framesPerRow < 1) {
			throw new Error('AnimationLayer requires framesPerRow >= 1');
		}

		this.#canvas2dContext = canvas2dContext;
		this.#image = image;
		this.#numberOfFrames = numberOfFrames;
		this.#framesPerRow = framesPerRow;
		this.#bitDepth = bitDepth;

		// Process pulsesPerFrame (explicit clock sync - highest priority)
		if (pulsesPerFrame !== null && pulsesPerFrame !== undefined) {
			this.#useClockSync = true;
			if (Array.isArray(pulsesPerFrame)) {
				if (pulsesPerFrame.length !== numberOfFrames) {
					throw new Error(`AnimationLayer: pulsesPerFrame array length (${pulsesPerFrame.length}) must equal numberOfFrames (${numberOfFrames})`);
				}
				this.#pulsesPerFrame = pulsesPerFrame;
			} else if (typeof pulsesPerFrame === 'number' && pulsesPerFrame > 0) {
				// Shorthand: single number applies to all frames
				this.#pulsesPerFrame = Array(numberOfFrames).fill(pulsesPerFrame);
			} else {
				throw new Error('AnimationLayer: invalid pulsesPerFrame');
			}
			// Subscribe to MIDI clock events for real-time sync
			this.#unsubscribeClock = appState.subscribe('midiClock', () => this.#onClockPulse());
		}

		// Process beatsPerFrame - supports both clock sync and time-based BPM sync
		// When MIDI clock is active, uses clock pulses for real-time sync (24 PPQN)
		// When no clock, falls back to time-based BPM calculation
		if (!this.#useClockSync && beatsPerFrame !== null && beatsPerFrame !== undefined) {
			this.#useBPMSync = true;

			if (Array.isArray(beatsPerFrame)) {
				// Enforce strict array length equal to numberOfFrames
				if (beatsPerFrame.length !== numberOfFrames) {
					throw new Error(`AnimationLayer: beatsPerFrame array length (${beatsPerFrame.length}) must equal numberOfFrames (${numberOfFrames})`);
				}
				this.#beatsPerFrame = beatsPerFrame;
				// Pre-calculate pulsesPerFrame for when clock is active (24 PPQN)
				this.#pulsesPerFrame = beatsPerFrame.map(b => Math.round(b * 24));
			} else if (typeof beatsPerFrame === 'number' && beatsPerFrame > 0) {
				// Shorthand: single number applies to all frames
				this.#beatsPerFrame = Array(numberOfFrames).fill(beatsPerFrame);
				this.#pulsesPerFrame = Array(numberOfFrames).fill(Math.round(beatsPerFrame * 24));
			} else {
				throw new Error('AnimationLayer: invalid beatsPerFrame');
			}

			// Subscribe to MIDI clock events for real-time sync when clock is active
			this.#unsubscribeClock = appState.subscribe('midiClock', () => this.#onClockPulse());
		}

		// Make a defensive shallow copy and validate the provided frame rates.
		// Ensure we only store positive numeric values to avoid division by zero
		// and to fail-fast on invalid animation metadata.
		this.#frameRatesForFrames = {};
		for (const [k, v] of Object.entries(frameRatesForFrames)) {
			const idx = Number(k);
			if (!Number.isInteger(idx) || idx < 0 || idx >= numberOfFrames) {
				console.warn(`AnimationLayer: frame rate key ${k} is not a valid frame index; skipping`);
				continue;
			}
			if (typeof v === 'number' && v > 0) {
				this.#frameRatesForFrames[idx] = v;
			} else {
				// If invalid, log and skip - constructor enforces valid metadata
				console.warn(`AnimationLayer: invalid frame rate for frame ${k}: ${v}; skipping`);
			}
		}
		this.#frameWidth = image.width / framesPerRow;
		this.#frameHeight = image.height / Math.ceil(numberOfFrames / framesPerRow);
		if (!this.#frameWidth || !this.#frameHeight) {
			throw new Error('AnimationLayer: Invalid image dimensions');
		}
		this.#loop = loop;
		this.#retrigger = retrigger;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		// Cache the default frame rate - prefer frame 0, otherwise use first defined value
		const keys = Object.keys(this.#frameRatesForFrames);
		const maybeDefault = this.#frameRatesForFrames[0] ?? (keys.length ? this.#frameRatesForFrames[keys[0]] : undefined) ?? 1;
		// Ensure the default frame rate is a positive number > 0
		this.#defaultFrameRate = typeof maybeDefault === 'number' && maybeDefault > 0 ? maybeDefault : 1;
	}

	/**
	 * Render the current animation frame and advance to the next frame if enough time has passed.
	 * Accepts an optional timestamp (from requestAnimationFrame) to use as timing source, which
	 * improves determinism during rendering and tests.
	 * @param {number} [timestamp] - Optional performance.now() timestamp, typically provided by RAF
	 */
	play(timestamp = performance.now()) {
		// Non-looping animation completed - stop rendering
		if (this.#isFinished) {
			return;
		}
		this.#advanceFrame(timestamp);
		this.#drawToContext(this.#canvas2dContext);
	}

	/**
	 * Render the current animation frame to a specific context.
	 * Useful for off-screen rendering in multi-layer compositing.
	 *
	 * Note: This method advances the animation frame based on the timestamp.
	 * To prevent double-advancement, ensure only one of play() or playToContext()
	 * is called per animation per frame with the same timestamp.
	 *
	 * @param {CanvasRenderingContext2D} ctx - Target canvas context
	 * @param {number} [timestamp] - Optional performance.now() timestamp
	 */
	playToContext(ctx, timestamp = performance.now()) {
		// Non-looping animation completed - stop rendering
		if (this.#isFinished) {
			return;
		}
		this.#advanceFrame(timestamp);
		this.#drawToContext(ctx);
	}

	/**
	 * Advance the animation frame based on elapsed time
	 * Uses BPM sync if beatsPerFrame is defined, otherwise uses frameRatesForFrames
	 * Clock sync mode skips time-based advancement (pulses drive frames directly)
	 * @param {number} timestamp - Current timestamp
	 */
	#advanceFrame(timestamp) {
		// When clock is active and we have pulse-based timing, let pulses drive frames
		// For explicit pulsesPerFrame (useClockSync=true), always use clock
		// For beatsPerFrame (useBPMSync=true), use clock when bpmSource is 'clock'
		const clockActive = this.#useClockSync || (this.#useBPMSync && appState.bpmSource === 'clock');
		if (clockActive && this.#pulsesPerFrame) {
			return;
		}
		// Prevent double-advancement when the same timestamp is used to advance
		if (this.#lastAdvanceTimestamp === timestamp) {
			return;
		}
		if (!this.#image) {
			return;
		}

		// Initialize lastTime on first play to prevent skipping frame 0
		if (this.#lastTime === null) {
			this.#lastTime = timestamp;
		}

		// Use a delta-based approach that advances the frame by a number of
		// steps proportional to the elapsed time. This avoids drift and
		// ensures that if many intervals have passed (due to GC or blocking
		// work) we advance by the right number of frames instead of only one.
		let elapsed = timestamp - this.#lastTime;

		// Loop and advance while we have accumulated enough time for the
		// current frame. Because frame rates may vary per frame, recompute
		// interval for each advanced frame.
		while (elapsed > 0) {
			const interval = this.#getFrameInterval(this.#frame);

			if (elapsed < interval) {
				break;
			}

			// Consume one interval worth of elapsed time and advance.
			elapsed -= interval;
			this.#frame++;

			// Handle wrapping / completion for the advanced frame
			if (this.#frame >= this.#numberOfFrames) {
				if (this.#loop) {
					this.#frame %= this.#numberOfFrames;
				} else {
					// Non-looping animations are considered finished; keep
					// a state that indicates a completed animation.
					this.#frame = this.#numberOfFrames;
					this.#isFinished = true;
					break;
				}
			}
		}

		// Preserve leftover fractional elapsed time so frames stay consistent
		// across calls; next tick will start from timestamp - leftover.
		this.#lastTime = timestamp - Math.max(0, elapsed);
		this.#lastAdvanceTimestamp = timestamp;
	}

	/**
	 * Calculate the interval (ms) for a given frame
	 * Uses BPM sync if beatsPerFrame is defined, otherwise uses frameRatesForFrames
	 * @param {number} frameIndex - The frame index
	 * @returns {number} - Interval in milliseconds
	 */
	#getFrameInterval(frameIndex) {
		if (this.#useBPMSync && this.#beatsPerFrame) {
			// BPM sync mode: interval = (beatsPerFrame * 60000) / bpm
			// beatsPerFrame[i] = number of beats this frame should last
			// e.g., beatsPerFrame=0.25 at 120 BPM = 125ms (16th note)
			const beats = this.#beatsPerFrame[frameIndex] ?? this.#beatsPerFrame[0] ?? 0.25;
			// Ensure BPM is at least the configured minimum to prevent extremely long intervals.
			// Fallback to 1 if settings.bpm.min is 0 or invalid to prevent division by zero.
			const minBPM = settings.bpm.min > 0 ? settings.bpm.min : 1;
			const bpm = Math.max(minBPM, appState.bpm);
			return (beats * 60000) / bpm;
		}

		// FPS mode (default when BPM sync is not used)
		const framesPerSecond = this.#frameRatesForFrames[frameIndex] ?? this.#defaultFrameRate;
		return 1000 / framesPerSecond;
	}

	/**
	 * Draw the current frame to a canvas context
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 */
	#drawToContext(ctx) {
		if (!this.#image || !ctx || this.#isFinished) {
			return;
		}

		// Draw the current frame (use clamped frame index for drawing)
		const drawFrame = Math.min(this.#frame, this.#numberOfFrames - 1);
		const posY = Math.floor(drawFrame / this.#framesPerRow);
		const posX = drawFrame - posY * this.#framesPerRow;
		ctx.drawImage(this.#image, this.#frameWidth * posX, this.#frameHeight * posY, this.#frameWidth, this.#frameHeight, 0, 0, this.#canvasWidth, this.#canvasHeight);
	}

	/**
	 * Whether this animation is completed and won't draw anymore.
	 * Useful for external managers or renderers to clear finished layers.
	 * @returns {boolean}
	 */
	get isFinished() {
		return this.#isFinished;
	}

	/**
	 * Get the bit depth for this animation (used for mask mixing)
	 * @returns {number|null} Bit depth (1, 2, 4, or 8) or null if not specified
	 */
	get bitDepth() {
		return this.#bitDepth;
	}

	/**
	 * Stop the animation and optionally reset to the first frame.
	 * Called when a MIDI note off event is received for this layer.
	 */
	stop() {
		if (this.#retrigger) {
			this.#resetState();
		}
	}

	/**
	 * Reset animation to first frame if retrigger is enabled.
	 * Called when a MIDI note on event activates this layer.
	 */
	reset() {
		if (this.#retrigger) {
			this.#resetState();
		}
	}

	#resetState() {
		this.#frame = 0;
		this.#lastTime = null;
		this.#isFinished = false;
		this.#pulseCount = 0; // Reset clock pulse counter
	}

	/**
	 * Dispose of image resources to help garbage collection
	 */
	dispose() {
		// Unsubscribe from clock events if using clock sync
		if (this.#unsubscribeClock) {
			this.#unsubscribeClock();
			this.#unsubscribeClock = null;
		}
		// Only clear image reference so GC can reclaim memory but leave the
		// canvas2dContext intact. Clearing the context is a breaking change;
		// if a layer is disposed while still referenced by the renderer, we
		// should still allow play() to return early safely.
		this.#image = null;
	}

	/**
	 * Handle MIDI clock pulse for real-time sync mode
	 * Advances frame when enough pulses have accumulated
	 * For beatsPerFrame, only active when MIDI clock is the BPM source
	 */
	#onClockPulse() {
		if (this.#isFinished || !this.#pulsesPerFrame) {
			return;
		}

		// For beatsPerFrame (useBPMSync without explicit useClockSync),
		// only process pulses when clock is the active BPM source
		if (this.#useBPMSync && !this.#useClockSync && appState.bpmSource !== 'clock') {
			return;
		}

		this.#pulseCount++;

		// Get pulses needed for current frame
		const pulsesNeeded = this.#pulsesPerFrame[this.#frame] ?? this.#pulsesPerFrame[0] ?? 6;

		if (this.#pulseCount >= pulsesNeeded) {
			this.#pulseCount = 0;
			this.#frame++;

			// Handle wrapping / completion
			if (this.#frame >= this.#numberOfFrames) {
				if (this.#loop) {
					this.#frame %= this.#numberOfFrames;
				} else {
					this.#frame = this.#numberOfFrames - 1;
					this.#isFinished = true;
				}
			}
		}
	}
}

export default AnimationLayer;
