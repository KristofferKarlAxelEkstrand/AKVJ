import '../scss/ClipFramesPanel.scss';
import './ClipFrames.js';
import './ClipFrame.js';
import { ACCEPTED_IMAGE_ACCEPT, ACCEPTED_IMAGE_LABEL } from './acceptedImageFiles.js';

/**
 * ClipFramesPanel — combines the clip-frames strip and the import drop zone
 * side-by-side in a single 100%-wide container. Used for create and edit.
 * The frames pane scrolls horizontally; the drop area stays visible and matches the pane height.
 */
class ClipFramesPanel extends HTMLElement {
	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	/**
	 * Expose the inner <clip-frames> element so consumers can coordinate
	 * without reaching into the rendered children or racing connectedCallback.
	 * @returns {HTMLElement|null}
	 */
	get clipFramesElement() {
		return this.querySelector('clip-frames#clip-frames');
	}

	#render() {
		this.replaceChildren();

		const panel = document.createElement('section');
		panel.className = 'clip-frames-panel';

		const frames = document.createElement('clip-frames');
		frames.id = 'clip-frames';

		const dropPane = document.createElement('div');
		dropPane.className = 'clip-frames-panel-drop';

		const dropLabel = `Drop ${ACCEPTED_IMAGE_LABEL} frames here or click to browse`;

		const dropZone = document.createElement('div');
		dropZone.id = 'clip-editor-drop-zone';
		dropZone.className = 'drop-zone';
		dropZone.tabIndex = 0;
		dropZone.setAttribute('role', 'button');
		dropZone.setAttribute('aria-label', dropLabel);

		const dropText = document.createElement('p');
		dropText.className = 'drop-zone-text';
		dropText.textContent = dropLabel;

		const fileInput = document.createElement('input');
		fileInput.id = 'clip-editor-files';
		fileInput.name = 'files';
		fileInput.type = 'file';
		fileInput.accept = ACCEPTED_IMAGE_ACCEPT;
		fileInput.multiple = true;
		fileInput.hidden = true;

		dropZone.append(dropText, fileInput);
		dropPane.append(dropZone);
		panel.append(frames, dropPane);
		this.append(panel);
	}
}

customElements.define('clip-frames-panel', ClipFramesPanel);

export default ClipFramesPanel;
