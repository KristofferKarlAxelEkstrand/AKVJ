/**
 * Renderer - Drives the render loop and delegates compositing/effects.
 *
 * Rendering order:
 * 1. Render Layer Group A (4 slots) → Compositor canvas A
 * 2. Render Layer Group B (4 slots) → Compositor canvas B
 * 3. Composite Layer Group A and Layer Group B using the mask → mixed canvas (Compositor)
 * 4. Apply Mixed output effects to mixed canvas (EffectsPipeline)
 * 5. Render Layer Group C (2 slots) on top of main canvas
 * 6. Apply Global effects to main canvas (EffectsPipeline)
 * 7. Output to visible canvas
 */
import Compositor from './Compositor.js';
import EffectsPipeline from './effects/EffectsPipeline.js';

class Renderer {
	#displayContext;
	#layerManager;
	#isRunning = false;
	#renderFrameId = null;
	#canvasWidth;
	#canvasHeight;
	#compositor;
	#effectsPipeline;
	#effectRenderContext;
	#compositingInput;
	#settings;
	// Any object exposing a numeric .bpm property (in production, the appState singleton)
	#bpmProvider;

	constructor(displayContext, layerManager, settings, bpmProvider) {
		this.#displayContext = displayContext;
		this.#layerManager = layerManager;
		this.#settings = settings;
		this.#bpmProvider = bpmProvider;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		this.#compositor = new Compositor(this.#canvasWidth, this.#canvasHeight, settings.rendering);
		this.#effectsPipeline = new EffectsPipeline(settings.effectParams, settings.effectRanges);
		// Reused every frame — allocating fresh objects per frame would churn GC in the hot path
		this.#effectRenderContext = {
			width: this.#canvasWidth,
			height: this.#canvasHeight,
			bpm: 0,
			bpmMin: settings.bpm.min,
			bpmDefault: settings.bpm.default
		};
		this.#compositingInput = {
			mask: null,
			bitDepth: 1,
			isLayerGroupAEmpty: true,
			isLayerGroupBEmpty: true
		};
	}

	/**
	 * Start the rendering loop
	 */
	start() {
		if (!this.#isRunning) {
			this.#isRunning = true;
			// Perform a lightweight warm-up render synchronously: clear canvases
			// and render active clips so tests and consumers see immediate
			// results (e.g., renderToContext calls, fillRect). Do NOT apply
			// effects yet — the first scheduled RAF will perform the full
			// frame (mixing + effects). This avoids double-mutation across
			// an initial synchronous pass and the first RAF-driven frame.
			this.#warmup(performance.now());
			this.#renderFrameId = requestAnimationFrame(this.#renderLoop);
		}
	}

	#clearCanvas(ctx) {
		if (!ctx) {
			return;
		}
		ctx.fillStyle = this.#settings.rendering.backgroundColor;
		ctx.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
	}

	/**
	 * Lightweight warm-up render called synchronously on start().
	 */
	#warmup(timestamp) {
		const ctxA = this.#compositor?.ctxA;
		const ctxB = this.#compositor?.ctxB;
		if (!ctxA || !ctxB) {
			return;
		}
		this.#compositor.clearLayerGroupCanvases();
		const layerGroupA = this.#layerManager?.getLayerGroupA();
		const layerGroupB = this.#layerManager?.getLayerGroupB();
		this.#renderLayerGroup(ctxA, layerGroupA, timestamp);
		this.#renderLayerGroup(ctxB, layerGroupB, timestamp);
		this.#clearCanvas(this.#displayContext);
	}

	/**
	 * Stop the rendering loop
	 */
	stop() {
		this.#isRunning = false;
		if (this.#renderFrameId) {
			cancelAnimationFrame(this.#renderFrameId);
			this.#renderFrameId = null;
		}
	}

	/**
	 * Destroy renderer and release references for GC
	 */
	destroy() {
		try {
			this.stop();
		} catch (error) {
			console.error('Error stopping renderer:', error);
		}
		this.#displayContext = null;
		this.#layerManager = null;
		try {
			this.#compositor?.destroy();
		} catch (error) {
			console.error('Error destroying compositor:', error);
		}
		this.#compositor = null;
		this.#effectsPipeline = null;
	}

	/**
	 * Main rendering loop - renders all layer groups with proper compositing
	 * @param {number} timestamp - Timestamp provided by requestAnimationFrame
	 */
	#renderLoop = timestamp => {
		if (!this.#isRunning) {
			return;
		}

		// Clear the main canvas
		this.#clearCanvas(this.#displayContext);

		const layerGroupA = this.#layerManager?.getLayerGroupA();
		const layerGroupB = this.#layerManager?.getLayerGroupB();
		const layerGroupC = this.#layerManager?.getLayerGroupC();
		const effectsManager = this.#layerManager?.getEffectsManager();

		if (!layerGroupA || !this.#compositor?.ctxA) {
			this.#renderFrameId = requestAnimationFrame(this.#renderLoop);
			return;
		}

		this.#compositor.clearLayerGroupCanvases();

		// Render Layer Group A and Layer Group B
		this.#renderLayerGroup(this.#compositor.ctxA, layerGroupA, timestamp);
		this.#renderLayerGroup(this.#compositor.ctxB, layerGroupB, timestamp);

		// Mix Layer Group A and Layer Group B using mask
		const maskManager = this.#layerManager?.getMaskManager();
		const mask = maskManager?.getCurrentMask() ?? null;
		this.#compositingInput.mask = mask;
		this.#compositingInput.bitDepth = mask ? (maskManager.getBitDepth() ?? 1) : 1;
		this.#compositingInput.isLayerGroupAEmpty = !layerGroupA?.hasActiveClips();
		this.#compositingInput.isLayerGroupBEmpty = !layerGroupB?.hasActiveClips();
		this.#compositor.mixLayerGroups(this.#compositingInput, timestamp);

		this.#effectRenderContext.bpm = this.#bpmProvider.bpm;

		// Apply mixed output effects
		if (effectsManager?.hasMixedOutputEffects()) {
			this.#effectsPipeline.apply(this.#compositor.ctxMixed, effectsManager.getActiveMixedOutputEffects(), timestamp, this.#effectRenderContext);
		}

		// Draw mixed result to main canvas
		this.#displayContext.drawImage(this.#compositor.canvasMixed, 0, 0);

		// Render Layer Group C (overlay) directly on main canvas
		this.#renderLayerGroup(this.#displayContext, layerGroupC, timestamp);

		// Apply global effects
		if (effectsManager?.hasGlobalEffects()) {
			this.#effectsPipeline.apply(this.#displayContext, effectsManager.getActiveGlobalEffects(), timestamp, this.#effectRenderContext);
		}

		this.#renderFrameId = requestAnimationFrame(this.#renderLoop);
	};

	/**
	 * Render a layer group to a specific canvas context
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 * @param {LayerGroup} layerGroup - Layer group to render
	 * @param {number} timestamp - Current timestamp
	 */
	#renderLayerGroup(ctx, layerGroup, timestamp) {
		if (!layerGroup) {
			return;
		}

		// getActiveClips() already filters out finished clips
		for (const clip of layerGroup.getActiveClips()) {
			clip.renderToContext(ctx, timestamp);
		}
	}
}

export default Renderer;
