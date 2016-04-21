export function fullscreen(context) {
	document.addEventListener(
		'keydown',
		(e) => {
			if (e.key === 'Enter') {
				toggleFullScreen();
			}
		},
		false
	);
}

function toggleFullScreen() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
	} else if (document.exitFullscreen) {
		document.exitFullscreen();
	}
}
