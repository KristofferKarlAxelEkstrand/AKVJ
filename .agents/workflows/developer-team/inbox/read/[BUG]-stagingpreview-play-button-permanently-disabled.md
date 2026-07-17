# [BUG] StagingPreview Play/Pause Button Is Permanently Disabled

## Issue Description
`mainframe/src/js/StagingPreview.js` (`AkvjStagingPreview`, the live canvas preview used in the asset-ingestion staging UI) sets its play/pause button to `disabled = true` at creation time and never re-enables it:

```javascript
this.#playPauseButton = document.createElement('button');
this.#playPauseButton.type = 'button';
this.#playPauseButton.className = 'clip-preview-play';
this.#playPauseButton.textContent = 'Play';
this.#playPauseButton.disabled = true;  // line 135
```

There is no other reference to `#playPauseButton.disabled` anywhere in the file (confirmed via full-file grep). Compare to the scrub slider in the same component, which correctly follows a disable-during-load / enable-after-load lifecycle:
```javascript
// in loadFrames(), while loading:
this.#scrubSlider.disabled = true;
// ...
// after frames finish loading successfully:
this.#scrubSlider.disabled = false;   // line 103
```
No equivalent `this.#playPauseButton.disabled = false;` exists anywhere after `loadFrames()` succeeds. The button's native `disabled` DOM property blocks all click events at the browser level — CSS/JS can't work around it — so the button is inert for the entire lifetime of the component, even after frames load and playback is actively running via `#setPlaying(true)` (which only updates `textContent` between "Play"/"Pause", not the `disabled` state).

Practical effect: a user staging new clip frames (via the asset-ingestion UI) can watch the auto-playing preview but can never pause it, and if they do stop it some other way, can never resume it — the JSDoc's claim that the component "provides play/pause, scrub, and speed controls" is only true for 2 of the 3.

This looks like a copy/adapt slip from `ClipList.js`'s preview player (the JSDoc explicitly says StagingPreview "reuses the preview player pattern from ClipList"): `ClipList.js`'s equivalent button (`mainframe/src/js/ClipList.js:239-242`) is never disabled in the first place, so it never needed a re-enable step. Whoever added the `disabled = true` initial state to `StagingPreview.js` (reasonably, since there's nothing to play before frames load) missed adding the matching re-enable that the scrub slider got right next to it.

## How to Fix
In `loadFrames()`, wherever the scrub slider is re-enabled after a successful load (`mainframe/src/js/StagingPreview.js:101-104`), also re-enable the play/pause button:
```javascript
if (this.#scrubSlider) {
	this.#scrubSlider.max = String(Math.max(0, this.#stagedImages.length - 1));
	this.#scrubSlider.disabled = false;
}
if (this.#playPauseButton) {
	this.#playPauseButton.disabled = false;
}
```
Also worth double-checking the early-return path at line 68-73 (`if (!files || files.length === 0)`) correctly leaves both controls disabled — it does today only because neither gets re-enabled at all, so once the real fix is in, confirm that path doesn't also flip `disabled = false` incorrectly (it shouldn't, since it returns before reaching the scrub-slider re-enable block).

## Key Files
- `mainframe/src/js/StagingPreview.js` (`loadFrames`, `#render`)

## Dependencies
- None. Related to Task 62 (add tests for StagingPreview) — a test asserting the button becomes enabled after `loadFrames()` resolves would have caught this and should be added alongside the fix.
