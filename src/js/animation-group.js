import settings from './settings.js';

class AnimationGroup {
	constructor({}) {
		this.animationInstances = [];
	}

	addAnimationInstance({ animationInstance }) {
		this.animationInstances.push(animationInstance);
	}

	play({ channel, note }) {
		console.log('play animation group');
	}
}

export default AnimationGroup;
