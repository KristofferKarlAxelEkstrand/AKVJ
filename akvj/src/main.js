import './css/adventure-kid-video-jockey.css';
import './css/loading-overlay.css';
import './css/debug-overlay.css';
import './css/user-message.css';
import './css/user-messages.css';
import './js/core/AdventureKidVideoJockey.js';

import Midi from './js/midi-input/Midi.js';
import Fullscreen from './js/utils/Fullscreen.js';
import DebugOverlay from './js/utils/DebugOverlay.js';

const midi = new Midi();

const fullscreenManager = new Fullscreen();
fullscreenManager.setup();

// Press 'D' to toggle
const debugOverlay = new DebugOverlay();
debugOverlay.setup();

// Cleanup on hot module replacement (HMR)
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		try {
			fullscreenManager.destroy();
		} catch (error) {
			console.warn('Error destroying fullscreenManager during HMR:', error);
		}
		try {
			debugOverlay.destroy();
		} catch (error) {
			console.warn('Error destroying debugOverlay during HMR:', error);
		}
		try {
			midi?.destroy?.();
		} catch (error) {
			console.warn('Error destroying midi singleton during HMR:', error);
		}
	});
}
