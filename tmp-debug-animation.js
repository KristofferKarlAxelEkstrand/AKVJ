import AnimationLayer from './src/js/visuals/AnimationLayer.js';

function createMockContext() {
	return {
		drawImage: (...args) => {
			console.log('draw:', args[1], args[2]);
		}
	};
}

function createMockImage() {
	return { width: 240, height: 135 };
}

const ctx = createMockContext();
const layer = new AnimationLayer({ canvas2dContext: ctx, image: createMockImage(), numberOfFrames: 2, framesPerRow: 2, loop: false, frameRatesForFrames: { 0: 1000 } });

console.log('play t=0');
layer.play(0);
console.log('isFinished:', layer.isFinished);
console.log('play t=10');
layer.play(10);
console.log('isFinished:', layer.isFinished);
console.log('play t=20');
layer.play(20);
console.log('isFinished:', layer.isFinished);
console.log('play t=30');
layer.play(30);
console.log('isFinished:', layer.isFinished);

console.log('DONE');
