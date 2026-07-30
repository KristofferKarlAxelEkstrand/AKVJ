/**
 * Shared MIDI value limits.
 */

/** Maximum value for any MIDI data byte (velocity, CC value, note, etc.). */
export const MAX_MIDI_DATA_BYTE = 127;

/** Maximum MIDI velocity value (0-127). Alias of MAX_MIDI_DATA_BYTE. */
export const MAX_MIDI_VELOCITY = MAX_MIDI_DATA_BYTE;

/** Maximum MIDI note value (0-127). Alias of MAX_MIDI_DATA_BYTE. */
export const MAX_MIDI_NOTE = MAX_MIDI_DATA_BYTE;

/** Maximum value for a raw MIDI message byte (status or data, 0–255). */
export const MAX_MIDI_MESSAGE_BYTE = 255;

/** Default max length for an incoming MIDI message (DoS guard). */
export const DEFAULT_MAX_MIDI_MESSAGE_LENGTH = 256;

/** Default max MIDI clock pulses accepted per second (rate limit). */
export const DEFAULT_MAX_CLOCK_PULSES_PER_SECOND = 1000;
