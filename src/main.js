// Import styles
import './css/adventure-kid-video-jockey.css';

// Import elements
import './js/core/AdventureKidVideoJockey.js';

// Import functions
import midi from './js/midi-input/midi.js';
import Fullscreen from './js/utils/Fullscreen.js';

// Enable fullscreen functionality
const fullscreenManager = new Fullscreen();
fullscreenManager.init();

// Cleanup on hot module replacement (HMR)
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		try {
			fullscreenManager.destroy();
		} catch (error) {
			console.warn('Error destroying fullscreenManager during HMR:', error);
		}
		try {
			midi?.destroy?.();
		} catch (error) {
			console.warn('Error destroying midi singleton during HMR:', error);
		}
	});
}
