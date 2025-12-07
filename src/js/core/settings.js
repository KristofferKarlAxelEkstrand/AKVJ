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
		// Maximum number of concurrent animation image loads to run at once
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
