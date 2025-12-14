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
		// Default MIDI channel mappings
		channels: {
			min: 0,
			max: 15
		},
		notes: {
			min: 0,
			max: 127
		},
		messageMinLength: 3,
		velocity: {
			min: 0,
			max: 127
		},
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
		}
	},
	/**
	 * BPM (Beats Per Minute) synchronization settings
	 * Used for tempo-synced animation playback
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
	 * Channel assignments for the multi-layer architecture
	 * Maps MIDI channels (0-15) to layer groups and functions
	 */
	channelMapping: {
		// Layer A - Primary animation deck (4 slots)
		layerA: [0, 1, 2, 3],
		// Mixer - B&W bitmask animations for A/B crossfading
		mixer: 4,
		// Layer B - Secondary animation deck (4 slots)
		layerB: [5, 6, 7, 8],
		// Effects A/B - Effects applied to mixed A/B output
		effectsAB: 9,
		// Layer C - Overlay layer (logos, persistent graphics)
		layerC: [10, 11],
		// Global Effects - Effects applied to entire output
		effectsGlobal: 12,
		// Reserved channels (ignored by layer system)
		reserved: [13, 14, 15]
	},
	/**
	 * Effect note ranges for channel 9 (Effects A/B) and channel 12 (Global Effects)
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
		// Note range threshold: notes below this use variant A, at/above use variant B
		// (e.g., horizontal vs vertical for mirror/split/offset effects)
		effectVariantThreshold: 8,
		// Maximum pixel displacement for glitch effect (scaled by intensity)
		glitchMaxDisplacement: 20,
		// Probability that a pixel will be glitched (scaled by intensity)
		glitchPixelProbability: 0.1,
		// Base probability for strobe flash (scaled by intensity)
		strobeFlashProbability: 0.3,
		// Posterize: base levels and intensity scale
		posterizeBaseLevels: 8,
		posterizeIntensityScale: 6,
		// Split effect: min and max number of splits
		splitMin: 2,
		splitMax: 8
	},
	performance: {
		// Target frame rate for animations
		targetFPS: 60,
		// Animation JSON URL
		animationsJsonUrl: '/animations/animations.json',
		// Optional base path for animation assets. For apps served under a subpath
		// this should include a trailing slash, e.g. '/subpath/'. Falls back to
		// `import.meta.env.BASE_URL` or '/'.
		animationsBasePath: import.meta.env?.BASE_URL ?? '/',
		// Cross origin policy to apply to loaded animation images. Set to null to
		// disable crossOrigin attribute.
		imageCrossOrigin: 'anonymous',
		/**
		 * Maximum number of concurrent animation image loads to run at once.
		 * Recommended range: 4-16. Larger values improve load speed at the cost of higher
		 * memory usage and potentially increased network saturation. This is used by
		 * `AnimationLoader` for batching image load requests.
		 */
		maxConcurrentAnimationLoads: 8
	},
	rendering: {
		// Canvas rendering settings
		imageSmoothingEnabled: false,
		imageSmoothingQuality: 'low',
		backgroundColor: '#000000'
	}
};

export default settings;
