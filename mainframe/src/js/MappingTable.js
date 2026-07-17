/**
 * AkvjMappingTable — custom element encapsulating the mapping table and summary.
 * Renders mapping entries with remove buttons, and a summary showing
 * mapped slot count and unmapped clips.
 *
 * @fires AkvjMappingTable#mappingremove - CustomEvent with `{ detail: { channel, note, velocity, clipId } }`
 */
class AkvjMappingTable extends HTMLElement {
	#mappings = [];
	#clipCatalog = [];

	/**
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} mappings
	 */
	set mappings(mappings) {
		this.#mappings = mappings;
		this.#render();
	}

	get mappings() {
		return this.#mappings;
	}

	/**
	 * @param {Array<{clipId: string, pipelineReady: boolean}>} clipCatalog
	 */
	set clipCatalog(clipCatalog) {
		this.#clipCatalog = clipCatalog;
		this.#render();
	}

	get clipCatalog() {
		return this.#clipCatalog;
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();

		this.#renderSummary();
		this.#renderTable();
	}

	#renderSummary() {
		const summary = document.createElement('div');
		summary.className = 'mapping-summary';

		const mappedClipIds = new Set(this.#mappings.map(entry => entry.clipId));
		const readyClips = this.#clipCatalog.filter(clip => clip.pipelineReady);
		const unmappedClips = readyClips.filter(clip => !mappedClipIds.has(clip.clipId));

		const slotCount = document.createElement('span');
		slotCount.className = 'mapping-summary-count';
		slotCount.textContent = `${this.#mappings.length} mapped slot${this.#mappings.length === 1 ? '' : 's'}`;
		summary.append(slotCount);

		if (unmappedClips.length > 0) {
			const unmappedLabel = document.createElement('span');
			unmappedLabel.className = 'mapping-summary-unmapped';
			const clipNames = unmappedClips.map(clip => clip.clipId).sort();
			unmappedLabel.textContent = `Unmapped: ${clipNames.join(', ')}`;
			summary.append(unmappedLabel);
		}

		this.append(summary);
	}

	#renderTable() {
		const table = document.createElement('table');
		table.className = 'mapping-table';

		const thead = document.createElement('thead');
		const headerRow = document.createElement('tr');
		for (const headerText of ['Channel', 'Note', 'Velocity', 'Clip', '']) {
			const th = document.createElement('th');
			th.textContent = headerText;
			headerRow.append(th);
		}
		thead.append(headerRow);

		const tbody = document.createElement('tbody');
		const sorted = [...this.#mappings].sort(
			(a, b) => a.channel - b.channel || a.note - b.note || a.velocity - b.velocity
		);

		for (const entry of sorted) {
			const tr = document.createElement('tr');

			const channelCell = document.createElement('td');
			channelCell.textContent = String(entry.channel);

			const noteCell = document.createElement('td');
			noteCell.textContent = String(entry.note);

			const velocityCell = document.createElement('td');
			velocityCell.textContent = String(entry.velocity);

			const clipIdCell = document.createElement('td');
			clipIdCell.textContent = entry.clipId;

			const actionCell = document.createElement('td');
			const removeButton = document.createElement('button');
			removeButton.type = 'button';
			removeButton.textContent = 'Remove';
			removeButton.addEventListener('click', () => {
				this.dispatchEvent(
					new CustomEvent('mappingremove', {
						bubbles: true,
						detail: { channel: entry.channel, note: entry.note, velocity: entry.velocity, clipId: entry.clipId }
					})
				);
			});
			actionCell.append(removeButton);

			tr.append(channelCell, noteCell, velocityCell, clipIdCell, actionCell);
			tbody.append(tr);
		}

		table.append(thead, tbody);
		this.append(table);
	}
}

customElements.define('akvj-mapping-table', AkvjMappingTable);

export default AkvjMappingTable;
