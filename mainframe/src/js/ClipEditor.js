import { API, api } from './apiClient.js';

const PLAYBACK_MODES = ['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub'];
const TRIGGER_TYPES = ['momentary', 'latch', 'one-shot'];

/**
 * AkvjClipEditor — custom element encapsulating the clip metadata edit form.
 * Renders all metadata fields with validation, handles save via API,
 * and dispatches `clipsaved` event when metadata is successfully updated.
 *
 * @fires AkvjClipEditor#clipsaved - CustomEvent with `{ detail: { clipId } }`
 */
class AkvjClipEditor extends HTMLElement {
	#clip = null;

	/**
	 * @param {{clipId: string, meta: object}} clip
	 */
	set clip(clip) {
		this.#clip = clip;
		this.#render();
	}

	get clip() {
		return this.#clip;
	}

	connectedCallback() {
		if (this.#clip) {
			this.#render();
		}
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();
		const clipMetadata = this.#clip.meta;

		const form = document.createElement('div');
		form.className = 'clip-edit-form';

		const nameInput = this.#createTextInput('name', clipMetadata.name || '');
		const numberFramesInput = this.#createNumberInput('frames', clipMetadata.frames ?? clipMetadata.numberOfFrames, 1);
		const framesPerRowInput = this.#createNumberInput('framesPerRow', clipMetadata.framesPerRow, 1);

		const playbackInput = document.createElement('select');
		playbackInput.name = 'playback';
		for (const mode of PLAYBACK_MODES) {
			const option = document.createElement('option');
			option.value = mode;
			option.textContent = mode;
			if ((clipMetadata.playback ?? (clipMetadata.loop === false ? 'once' : 'loop')) === mode) {
				option.selected = true;
			}
			playbackInput.append(option);
		}

		const pngInput = this.#createTextInput('png', clipMetadata.png || 'sprite.png');
		const pngHint = document.createElement('span');
		pngHint.className = 'clip-edit-hint';

		const retriggerInput = this.#createCheckbox('retrigger', clipMetadata.retrigger);
		const roleInput = this.#createTextInput('role', clipMetadata.role || '');
		const bitDepthInput = this.#createNumberInput('bitDepth', clipMetadata.bitDepth, 0);

		const triggerTypeInput = document.createElement('select');
		triggerTypeInput.name = 'triggerType';
		for (const type of TRIGGER_TYPES) {
			const option = document.createElement('option');
			option.value = type;
			option.textContent = type;
			if (clipMetadata.triggerType === type) {
				option.selected = true;
			}
			triggerTypeInput.append(option);
		}

		const triggerGroupInput = this.#createTextInput('triggerGroup', clipMetadata.triggerGroup || '');

		const frameRatesTextarea = document.createElement('textarea');
		frameRatesTextarea.className = 'clip-edit-textarea';
		frameRatesTextarea.name = 'frameRatesForFrames';
		frameRatesTextarea.rows = 2;
		frameRatesTextarea.placeholder = '{"0": 15}';
		frameRatesTextarea.value = clipMetadata.frameRatesForFrames ? JSON.stringify(clipMetadata.frameRatesForFrames) : '';

		const frameRatesHint = document.createElement('span');
		frameRatesHint.className = 'clip-edit-hint';

		const frameDurationBeatsTextarea = document.createElement('textarea');
		frameDurationBeatsTextarea.className = 'clip-edit-textarea';
		frameDurationBeatsTextarea.name = 'frameDurationBeats';
		frameDurationBeatsTextarea.rows = 2;
		frameDurationBeatsTextarea.placeholder = '0.25 or [0.25, 0.5, 0.25]';
		frameDurationBeatsTextarea.value = clipMetadata.frameDurationBeats !== null && clipMetadata.frameDurationBeats !== undefined ? JSON.stringify(clipMetadata.frameDurationBeats) : '';

		const frameDurationBeatsHint = document.createElement('span');
		frameDurationBeatsHint.className = 'clip-edit-hint';

		function validateFrameRatesForFrames() {
			const raw = frameRatesTextarea.value.trim();
			if (!raw) {
				frameRatesHint.textContent = '';
				frameRatesHint.className = 'clip-edit-hint';
				return true;
			}
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				frameRatesHint.textContent = 'Invalid JSON';
				frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
				frameRatesHint.textContent = 'Must be a JSON object like {"0": 15}';
				frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			const expectedFrames = Number(numberFramesInput.value);
			const keys = Object.keys(parsed).map(Number);
			const outOfRange = keys.filter(key => !Number.isInteger(key) || key < 0 || key >= expectedFrames);
			if (outOfRange.length > 0) {
				frameRatesHint.textContent = `Keys must be 0–${expectedFrames - 1}. Invalid: ${outOfRange.join(', ')}`;
				frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			const values = Object.values(parsed);
			const invalidValues = values.filter(value => typeof value !== 'number' || !Number.isFinite(value) || value <= 0);
			if (invalidValues.length > 0) {
				frameRatesHint.textContent = `Values must be positive numbers. Invalid: ${invalidValues.join(', ')}`;
				frameRatesHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			frameRatesHint.textContent = '';
			frameRatesHint.className = 'clip-edit-hint';
			return true;
		}

		function validateFrameDurationBeats() {
			const raw = frameDurationBeatsTextarea.value.trim();
			if (!raw) {
				frameDurationBeatsHint.textContent = '';
				frameDurationBeatsHint.className = 'clip-edit-hint';
				return true;
			}
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				frameDurationBeatsHint.textContent = 'Invalid JSON';
				frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			const values = Array.isArray(parsed) ? parsed : [parsed];
			if (!Array.isArray(parsed) && typeof parsed !== 'number') {
				frameDurationBeatsHint.textContent = 'Must be a number or array of numbers';
				frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			if (Array.isArray(parsed)) {
				const expectedLength = Number(numberFramesInput.value);
				if (parsed.length !== expectedLength) {
					frameDurationBeatsHint.textContent = `Array length ${parsed.length} must equal frames (${expectedLength})`;
					frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
					return false;
				}
			}
			const invalidValues = values.filter(value => typeof value !== 'number' || !Number.isFinite(value) || value <= 0);
			if (invalidValues.length > 0) {
				frameDurationBeatsHint.textContent = `Values must be positive numbers. Invalid: ${invalidValues.join(', ')}`;
				frameDurationBeatsHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			frameDurationBeatsHint.textContent = '';
			frameDurationBeatsHint.className = 'clip-edit-hint';
			return true;
		}

		frameDurationBeatsTextarea.addEventListener('input', validateFrameDurationBeats);
		frameRatesTextarea.addEventListener('input', validateFrameRatesForFrames);
		numberFramesInput.addEventListener('input', validateFrameDurationBeats);
		numberFramesInput.addEventListener('input', validateFrameRatesForFrames);

		form.append(this.#createField('Name', nameInput), this.#createField('PNG file', pngInput), pngHint, this.#createField('Frames', numberFramesInput), this.#createField('Frames/row', framesPerRowInput), this.#createField('Playback', playbackInput), this.#createField('Retrigger', retriggerInput), this.#createField('Role', roleInput), this.#createField('Bit depth', bitDepthInput), this.#createField('Trigger type', triggerTypeInput), this.#createField('Trigger group', triggerGroupInput), this.#createField('Frame rates (JSON)', frameRatesTextarea), frameRatesHint, this.#createField('Duration beats (JSON)', frameDurationBeatsTextarea), frameDurationBeatsHint);

		const saveButton = document.createElement('button');
		saveButton.type = 'button';
		saveButton.textContent = 'Save metadata';
		const statusSpan = document.createElement('span');
		statusSpan.className = 'status';

		const clipId = this.#clip.clipId;

		async function validatePngFilename() {
			const filename = pngInput.value.trim();
			if (!filename) {
				pngHint.textContent = '';
				pngHint.className = 'clip-edit-hint';
				return true;
			}
			if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/i.test(filename)) {
				pngHint.textContent = 'Invalid filename — alphanumeric, dot, hyphen, underscore, ending in .png';
				pngHint.className = 'clip-edit-hint clip-edit-hint--err';
				return false;
			}
			try {
				const response = await fetch(`${API}/clips/${encodeURIComponent(clipId)}/sprite`, { method: 'HEAD' });
				if (response.status === 404) {
					pngHint.textContent = `Warning: "${filename}" not found in clip directory`;
					pngHint.className = 'clip-edit-hint clip-edit-hint--err';
					return false;
				}
				pngHint.textContent = 'File exists';
				pngHint.className = 'clip-edit-hint';
				return true;
			} catch {
				pngHint.textContent = '';
				pngHint.className = 'clip-edit-hint';
				return true;
			}
		}

		pngInput.addEventListener('blur', validatePngFilename);

		saveButton.addEventListener('click', async () => {
			if (!validateFrameRatesForFrames()) {
				this.#setStatus(statusSpan, 'Fix frameRatesForFrames errors first', 'is-err');
				return;
			}
			if (!validateFrameDurationBeats()) {
				this.#setStatus(statusSpan, 'Fix frameDurationBeats errors first', 'is-err');
				return;
			}
			this.#setStatus(statusSpan, 'Saving…');
			try {
				const updates = {
					name: nameInput.value.trim() || undefined,
					frames: Number(numberFramesInput.value),
					framesPerRow: Number(framesPerRowInput.value),
					playback: playbackInput.value,
					retrigger: retriggerInput.checked,
					bitDepth: bitDepthInput.value ? Number(bitDepthInput.value) : undefined,
					png: pngInput.value.trim() || undefined
				};
				if (roleInput.value.trim()) {
					updates.role = roleInput.value.trim();
				}
				updates.triggerType = triggerTypeInput.value;
				if (triggerGroupInput.value.trim()) {
					updates.triggerGroup = triggerGroupInput.value.trim();
				}
				const frameRatesRaw = frameRatesTextarea.value.trim();
				if (frameRatesRaw) {
					updates.frameRatesForFrames = JSON.parse(frameRatesRaw);
				}
				const frameDurationBeatsRaw = frameDurationBeatsTextarea.value.trim();
				if (frameDurationBeatsRaw) {
					updates.frameDurationBeats = JSON.parse(frameDurationBeatsRaw);
				}
				await api(`/clips/${encodeURIComponent(this.#clip.clipId)}`, {
					method: 'PUT',
					body: JSON.stringify(updates)
				});
				this.#setStatus(statusSpan, 'Saved', 'is-ok');
				this.dispatchEvent(new CustomEvent('clipsaved', { bubbles: true, detail: { clipId: this.#clip.clipId } }));
			} catch (error) {
				this.#setStatus(statusSpan, error.message, 'is-err');
			}
		});

		const actionsRow = document.createElement('div');
		actionsRow.className = 'clip-edit-actions';
		actionsRow.append(saveButton, statusSpan);
		form.append(actionsRow);

		this.append(form);
	}

	#setStatus(statusElement, message, kind = '') {
		statusElement.textContent = message;
		statusElement.classList.remove('is-ok', 'is-err');
		if (kind) {
			statusElement.classList.add(kind);
		}
	}

	#createField(labelText, input) {
		const label = document.createElement('label');
		label.className = 'clip-edit-field';
		label.append(labelText, input);
		return label;
	}

	#createNumberInput(name, value, min) {
		const input = document.createElement('input');
		input.type = 'number';
		input.name = name;
		input.min = min;
		if (value !== null && value !== undefined) {
			input.value = value;
		}
		return input;
	}

	#createCheckbox(name, checked) {
		const input = document.createElement('input');
		input.type = 'checkbox';
		input.name = name;
		input.checked = !!checked;
		return input;
	}

	#createTextInput(name, value) {
		const input = document.createElement('input');
		input.type = 'text';
		input.name = name;
		input.value = value;
		return input;
	}
}

customElements.define('akvj-clip-editor', AkvjClipEditor);

export default AkvjClipEditor;
