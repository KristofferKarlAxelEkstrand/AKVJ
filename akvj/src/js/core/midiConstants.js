/**
 * Shared MIDI value limits.
 */

/** Maximum value for any MIDI data byte (velocity, CC value, note, etc.). */
export const MAX_MIDI_DATA_BYTE = 127;

/** Maximum MIDI velocity value (0-127). Alias of MAX_MIDI_DATA_BYTE. */
export const MAX_MIDI_VELOCITY = MAX_MIDI_DATA_BYTE;

/** Maximum MIDI note value (0-127). */
export const MAX_MIDI_NOTE = 127;
