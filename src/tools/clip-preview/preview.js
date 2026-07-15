/**
 * Clip Preview Tool
 *
 * Loads and plays clips from the clips.json manifest.
 */

// Allow overriding the clips path from the host page (useful in dev/proxy)
const ANIMATIONS_PATH = (window && window.AKVJ_ANIMATIONS_PATH) || '/clips/clips.json';

let clips = {};
let currentClipMeta = null;
let spriteImage = null;
let currentFrame = 0;
let isPlaying = true;
let lastFrameTime = 0;
let clipFrameId = null;

// DOM elements
const channelSelect = document.getElementById('channel');
const noteSelect = document.getElementById('note');
const velocitySelect = document.getElementById('velocity');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const playPauseBtn = document.getElementById('play-pause');
const prevFrameBtn = document.getElementById('prev-frame');
const nextFrameBtn = document.getElementById('next-frame');
const frameInfo = document.getElementById('frame-info');
const metaDisplay = document.getElementById('meta-display');
const reloadBtn = document.getElementById('reload');

/**
 * Load clips.json and populate selects.
 */
async function loadClips() {
	try {
		const response = await fetch(ANIMATIONS_PATH);
		clips = await response.json();
		populateChannels();
	} catch (err) {
		metaDisplay.textContent = `Error loading clips.json: ${err.message}`;
	}
}

/**
 * Populate channel select.
 */
function populateChannels() {
	const channels = Object.keys(clips).sort((a, b) => Number(a) - Number(b));
	channelSelect.innerHTML = channels.map(c => `<option value="${c}">${c}</option>`).join('');

	if (channels.length > 0) {
		populateNotes();
	}
}

/**
 * Populate note select based on selected channel.
 */
function populateNotes() {
	const channel = channelSelect.value;
	const notes = Object.keys(clips[channel] || {}).sort((a, b) => Number(a) - Number(b));
	noteSelect.innerHTML = notes.map(n => `<option value="${n}">${n}</option>`).join('');

	if (notes.length > 0) {
		populateVelocities();
	}
}

/**
 * Populate velocity select based on selected channel/note.
 */
function populateVelocities() {
	const channel = channelSelect.value;
	const note = noteSelect.value;
	const velocities = Object.keys(clips[channel]?.[note] || {}).sort((a, b) => Number(a) - Number(b));
	velocitySelect.innerHTML = velocities.map(v => `<option value="${v}">${v}</option>`).join('');

	if (velocities.length > 0) {
		loadClip();
	}
}

/**
 * Load the currently selected clip.
 */
async function loadClip() {
	const channel = channelSelect.value;
	const note = noteSelect.value;
	const velocity = velocitySelect.value;

	if (!channel || !note || !velocity) {
		return;
	}

	currentClipMeta = clips[channel]?.[note]?.[velocity];
	if (!currentClipMeta) {
		metaDisplay.textContent = 'Clip not found';
		return;
	}

	metaDisplay.textContent = JSON.stringify(currentClipMeta, null, 2);

	// Validate png field exists
	if (!currentClipMeta.png) {
		metaDisplay.textContent += `\n\nError: currentClipMeta.png is missing for ${channel}/${note}/${velocity}`;
		return;
	}

	// Load sprite image
	const basePath = (window && window.AKVJ_ANIMATIONS_BASE) || '/clips';
	const pngPath = `${basePath}/${channel}/${note}/${velocity}/${currentClipMeta.png}`;
	spriteImage = new Image();
	spriteImage.onload = () => {
		setupCanvas();
		currentFrame = 0;
		lastFrameTime = performance.now();
		if (!clipFrameId) {
			animate();
		}
	};
	spriteImage.onerror = () => {
		metaDisplay.textContent += `\n\nError loading: ${pngPath}`;
	};
	// Stop any previous clip frame while loading new image
	stopClip();
	spriteImage.src = pngPath;
}

/**
 * Set up canvas based on sprite dimensions.
 */
function setupCanvas() {
	if (!spriteImage || !currentClipMeta) {
		return;
	}

	const frameWidth = spriteImage.width / currentClipMeta.framesPerRow;
	const rows = Math.ceil(currentClipMeta.numberOfFrames / currentClipMeta.framesPerRow);
	const frameHeight = spriteImage.height / rows;

	// Scale up for visibility (pixel art is small)
	const scale = Math.min(4, Math.floor(400 / frameWidth));
	canvas.width = frameWidth * scale;
	canvas.height = frameHeight * scale;
	canvas.style.width = `${canvas.width}px`;
	canvas.style.height = `${canvas.height}px`;

	ctx.imageSmoothingEnabled = false;
}

/**
 * Get frame rate for current frame.
 */
function getFrameRate() {
	if (!currentClipMeta?.frameRatesForFrames) {
		return 12;
	}

	// Find the applicable frame rate (last defined rate <= current frame)
	let rate = 12;
	const entries = Object.entries(currentClipMeta.frameRatesForFrames)
		.map(([k, v]) => [Number(k), v])
		.sort((a, b) => a[0] - b[0]);

	for (const [frame, r] of entries) {
		if (Number(frame) <= currentFrame) {
			rate = r;
		}
	}
	return rate;
}

/**
 * Draw current frame.
 */
function drawFrame() {
	if (!spriteImage || !currentClipMeta) {
		return;
	}

	const frameWidth = spriteImage.width / currentClipMeta.framesPerRow;
	const rows = Math.ceil(currentClipMeta.numberOfFrames / currentClipMeta.framesPerRow);
	const frameHeight = spriteImage.height / rows;

	const col = currentFrame % currentClipMeta.framesPerRow;
	const row = Math.floor(currentFrame / currentClipMeta.framesPerRow);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(spriteImage, col * frameWidth, row * frameHeight, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);

	frameInfo.textContent = `Frame: ${currentFrame + 1} / ${currentClipMeta.numberOfFrames}`;
}

/**
 * Clip loop.
 */
function animate() {
	const now = performance.now();
	const frameRate = getFrameRate();
	const frameDuration = 1000 / frameRate;

	if (isPlaying && now - lastFrameTime >= frameDuration) {
		currentFrame = (currentFrame + 1) % (currentClipMeta?.numberOfFrames || 1);
		lastFrameTime = now;
	}

	drawFrame();
	clipFrameId = requestClipFrame(animate);
}

/**
 * Stop the clip frame loop.
 */
function stopClip() {
	if (clipFrameId) {
		cancelClipFrame(clipFrameId);
		clipFrameId = null;
	}
}

// Pause/Resume on page visibility to avoid unnecessary CPU usage
document.addEventListener('visibilitychange', () => {
	if (document.hidden) {
		stopClip();
	} else {
		if (currentClipMeta && !clipFrameId) {
			lastFrameTime = performance.now();
			animate();
		}
	}
});

// Ensure clip loop is cleaned up on page unload
window.addEventListener('beforeunload', () => {
	stopClip();
});

// Event listeners
channelSelect.addEventListener('change', populateNotes);
noteSelect.addEventListener('change', populateVelocities);
velocitySelect.addEventListener('change', loadClip);
reloadBtn.addEventListener('click', loadClips);

playPauseBtn.addEventListener('click', () => {
	isPlaying = !isPlaying;
	playPauseBtn.textContent = isPlaying ? 'Pause' : 'Play';
});

prevFrameBtn.addEventListener('click', () => {
	isPlaying = false;
	playPauseBtn.textContent = 'Play';
	currentFrame = (currentFrame - 1 + (currentClipMeta?.numberOfFrames || 1)) % (currentClipMeta?.numberOfFrames || 1);
	drawFrame();
});

nextFrameBtn.addEventListener('click', () => {
	isPlaying = false;
	playPauseBtn.textContent = 'Play';
	currentFrame = (currentFrame + 1) % (currentClipMeta?.numberOfFrames || 1);
	drawFrame();
});

// Initialize
loadClips();
