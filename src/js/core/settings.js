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
			noteOn: 9
		}
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
