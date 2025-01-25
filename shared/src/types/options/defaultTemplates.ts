import { DescriptionOptions, CommentaryOptions, VideoOptions } from '.';
import { Template } from './template';

export const defaultDescriptionOptions: DescriptionOptions = {
	temperature: 1,
};

export const defaultCommentaryOptions: CommentaryOptions = {
	intro: true,
	outro: true,
	temperature: 0.7,
	videoType: 'police bodycam',
};

export const defaultVideoOptions: VideoOptions = {
	audio: {
		stability: 0.7,
		voiceId: 'nPczCjzI2devNBz1zQrb',
		speedMultiplier: 1,
	},
	video: {
		bw: true,
		playSound: true,
		subtitlesEnabled: true,
		subtitlesSize: 14,
		size: '1080p',
	},
};

export const defaultTemplate: Template = {
	id: crypto.randomUUID(),
	name: 'New Template',
	description: 'A thought-provoking project template',
	createdAt: new Date().toISOString(),
	pauseSoundFilename: 'pause_default.wav',
	options: {
		description: defaultDescriptionOptions,
		commentary: defaultCommentaryOptions,
		video: defaultVideoOptions,
	},
};
