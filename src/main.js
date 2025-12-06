// Import styles
import './css/adventure-kid-video-jockey.css';

// Import elements
import './js/adventure-kid-video-jockey.js';

// Import functions
import './js/midi.js';
import Fullscreen from './js/fullscreen.js';

// Enable fullscreen functionality
const fullscreenManager = new Fullscreen();
fullscreenManager.init();

// Cleanup on hot module replacement (HMR)
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		fullscreenManager.destroy();
	});
}
