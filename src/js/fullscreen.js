/**
 * Toggle fullscreen mode on/off
 */
const toggleFullScreen = () => {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen().catch(err => {
			console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
		});
	} else if (document.exitFullscreen) {
		document.exitFullscreen().catch(err => {
			console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
		});
	}
};

/**
 * Initialize fullscreen toggle listeners
 * Enter key, Space bar, and double-click toggle fullscreen mode
 */
export function fullscreen() {
	document.addEventListener('keydown', e => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleFullScreen();
		}
	});

	document.addEventListener('dblclick', toggleFullScreen);
}
