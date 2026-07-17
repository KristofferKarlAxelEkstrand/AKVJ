/**
 * Centralized configuration for AKVJ
 * Contains all configurable settings for canvas, MIDI, and performance
 */
const settings = {
	canvas: {
		width: 240,
		height: 135
	},
	midi: {
		// MIDI command codes (upper nibble of status byte)
		commands: {
			noteOff: 8,
			noteOn: 9,
			controlChange: 11
		},
		// System Real-Time messages (single-byte, no channel)
		systemRealTime: {
			clock: 0xf8, // MIDI Clock pulse (24 per beat)
			start: 0xfa, // Start playback
			continue: 0xfb, // Continue playback
			stop: 0xfc // Stop playback
		},
		// Pulses Per Quarter Note (PPQN) for MIDI clock pulses. Standard MIDI clock is 24 PPQN.
		ppqn: 24,
		// Minimum byte length for channel messages (note on/off, CC)
		channelMessageMinLength: 3
	},
	/**
	 * BPM (Beats Per Minute) synchronization settings
	 * Used for tempo-synced clip playback
	 */
	bpm: {
		default: 120, // Default BPM when no clock/CC received
		min: 10, // Minimum BPM value (must be > 0 to prevent division by zero)
		max: 522, // Maximum BPM value (512 range + 10 minimum)
		clockTimeoutMs: 500, // Fall back to CC/default if no clock pulses for this long
		// MIDI CC (fallback when no clock)
		controlCC: 0, // CC number (0-127)
		controlChannel: 0 // MIDI channel (0-15)
	},
	/**
	 * Channel assignments for the multi-layer-group architecture
	 * Maps MIDI channels (0-15) to layer groups and functions
	 */
	channelMapping: {
		// Layer Group A - Primary clip deck (4 slots)
		layerGroupA: [0, 1, 2, 3],
		// Mixer - B&W bitmask clips for Layer Group A and Layer Group B crossfading
		mixer: 4,
		// Layer Group B - Secondary clip deck (4 slots)
		layerGroupB: [5, 6, 7, 8],
		// Mixed output effects - applied to mixed Layer Group A and Layer Group B output
		mixedOutputEffects: 9,
		// Layer Group C - Overlay layer (logos, persistent graphics)
		layerGroupC: [10, 11],
		// Global effects - Effects applied to entire output
		globalEffects: 12,
		// Reserved channels (ignored by layer group system)
		reserved: [13, 14, 15]
	},
	/**
	 * Scrub configuration
	 * Maps Layer Groups to their dedicated CC for scrubbing
	 */
	scrub: {
		layerGroupA_CC: 16,
		layerGroupB_CC: 17,
		layerGroupC_CC: 18,
		mixer_CC: 19
	},
	/**
	 * Effect note ranges for channel 9 (mixed output effects) and channel 12 (global effects)
	 * Each range defines a category of effects
	 */
	effectRanges: {
		split: { min: 0, max: 15 }, // Split/Divide effects
		mirror: { min: 16, max: 31 }, // Mirror effects
		offset: { min: 32, max: 47 }, // Offset/Shift effects
		color: { min: 48, max: 63 }, // Color effects (invert, posterize, etc.)
		glitch: { min: 64, max: 79 }, // Glitch effects
		strobe: { min: 80, max: 95 }, // Strobe/Flash effects
		reserved: { min: 96, max: 127 } // Reserved for future use
	},
	/**
	 * Effect parameters for tuning visual effects
	 * These control thresholds, probabilities, and intensities
	 */
	effectParams: {
		// Note range threshold within each effect range (0-15 notes per range).
		// Notes with noteInRange < threshold use variant A (e.g., horizontal).
		// Notes with noteInRange >= threshold use variant B (e.g., vertical).
		// Value of 8 splits the 16-note range evenly: 0-7 = A, 8-15 = B.
		effectVariantThreshold: 8,
		// Maximum pixel displacement for glitch effect (scaled by intensity)
		glitchMaxDisplacement: 20,
		// Probability that a pixel will be glitched (scaled by intensity)
		glitchPixelProbability: 0.1,
		// Posterize: base levels and intensity scale
		posterizeBaseLevels: 8,
		posterizeIntensityScale: 6,
		// Split effect: min and max number of splits
		splitMin: 2,
		splitMax: 8
	},

	performance: {
		// Flat clip catalog (keyed by clipId)
		clipsJsonUrl: '/clips/clips.json',
		// MIDI → clipId mapping (DAW channels 1–16)
		keyMapJsonUrl: '/clips/key-map.json',
		// Optional base path for clip assets. For apps served under a subpath
		// this should include a trailing slash, e.g. '/subpath/'. Falls back to
		// `import.meta.env.BASE_URL` or '/'.
		clipsBasePath: import.meta.env?.BASE_URL ?? '/',
		// Cross origin policy to apply to loaded clip images. Set to null to
		// disable crossOrigin attribute.
		imageCrossOrigin: 'anonymous',
		/**
		 * Maximum number of concurrent clip image loads to run at once.
		 * Recommended range: 4-16. Larger values improve load speed at the cost of higher
		 * memory usage and potentially increased network saturation. This is used by
		 * `ClipLoader` for batching image load requests.
		 */
		maxConcurrentClipLoads: 8
	},
	rendering: {
		imageSmoothingEnabled: false,
		imageSmoothingQuality: 'low',
		backgroundColor: '#000000'
	}
};

export default settings;
