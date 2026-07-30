import './css/adventure-kid-video-jockey.css';
import './css/loading-overlay.css';
import './css/debug-overlay.css';
import './css/midi-settings-overlay.css';
import './css/user-message.css';
import './css/user-messages.css';
import './js/core/AdventureKidVideoJockey.js';

import appState from './js/core/AppState.js';
import settings from './js/core/settings.js';
import Midi from './js/midi-input/Midi.js';
import Fullscreen from './js/utils/Fullscreen.js';
import DebugOverlay from './js/utils/DebugOverlay.js';
import MidiSettingsOverlay from './js/utils/MidiSettingsOverlay.js';

const midi = new Midi({ appState, settings });

const fullscreenManager = new Fullscreen();
fullscreenManager.enable();

// Press 'D' to toggle
const debugOverlay = new DebugOverlay();
debugOverlay.mount();

// Press 'T' to toggle MIDI settings overlay
const midiSettingsOverlay = new MidiSettingsOverlay({ midi, appState });
midiSettingsOverlay.mount();

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
			midiSettingsOverlay.destroy();
		} catch (error) {
			console.warn('Error destroying midiSettingsOverlay during HMR:', error);
		}
		try {
			midi?.destroy?.();
		} catch (error) {
			console.warn('Error destroying midi singleton during HMR:', error);
		}
	});
}
