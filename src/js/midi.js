import appState from './app-state.js';

class MIDI {
	constructor() {
		this.midiAccess = null;
		this.adventureKidVideoJockey = null;

		// Subscribe to state changes
		appState.subscribe('adventureKidVideoJockeyChanged', event => {
			this.adventureKidVideoJockey = event.detail.newValue;
		});

		this.init();
	}

	init() {
		if (this.isSupported()) {
			this.requestAccess();
		} else {
			console.log('WebMIDI is not supported in this browser.');
		}
	}

	isSupported() {
		return !!navigator.requestMIDIAccess;
	}

	async requestAccess() {
		try {
			this.midiAccess = await navigator.requestMIDIAccess();
			this.onMIDISuccess(this.midiAccess);
		} catch (error) {
			this.onMIDIFailure(error);
		}
	}

	onMIDISuccess(midiAccess) {
		console.log('This browser supports WebMIDI!');
		console.log('MIDI Access Object:', midiAccess);
		this.setupMIDIInputs(midiAccess);
		appState.midiConnected = true;
	}

	onMIDIFailure(error) {
		console.error('Failed to get MIDI access:', error);
		appState.midiConnected = false;
	}

	setupMIDIInputs(midiAccess) {
		const inputs = midiAccess.inputs.values();
		for (let input of inputs) {
			input.onmidimessage = this.handleMIDIMessage.bind(this);
			console.log(`Connected to MIDI input: ${input.name}`);
		}
	}

	handleMIDIMessage(message) {
		const [status, data1, data2] = message.data;
		const command = status >> 4;
		const channel = status & 0xf;
		const note = data1;
		const velocity = data2;

		// Ensure we have a reference to the VJ component
		if (!this.adventureKidVideoJockey) {
			this.adventureKidVideoJockey = appState.adventureKidVideoJockey;
		}

		if (!this.adventureKidVideoJockey) {
			console.warn('No adventure kid video jockey component available for MIDI');
			return;
		}

		switch (command) {
			case 9: // Note on
				if (velocity > 0) {
					this.adventureKidVideoJockey.noteOn(channel, note, velocity);
				} else {
					this.adventureKidVideoJockey.noteOff(channel, note);
				}
				break;
			case 8: // Note off
				this.adventureKidVideoJockey.noteOff(channel, note);
				break;
			default:
				break;
		}
	}
}

const midi = new MIDI();

export default midi;
