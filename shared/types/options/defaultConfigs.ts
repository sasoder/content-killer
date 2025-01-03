import { DescriptionOptions, CommentaryOptions, VideoOptions } from '.';
import { ProjectConfig } from './config';

export const defaultDescriptionOptions: DescriptionOptions = {
	sample: true,
};

export const defaultCommentaryOptions: CommentaryOptions = {
	intro: true,
	outro: true,
	temperature: 0.7,
};

export const defaultVideoOptions: VideoOptions = {
	audio: {
		stability: 0.7,
		voiceId: 'nPczCjzI2devNBz1zQrb',
	},
	video: {
		bw: true,
		playSound: true,
		subtitlesEnabled: true,
		subtitlesSize: 14,
		size: '1080p',
	},
};

export const defaultProjectConfig: ProjectConfig = {
	id: crypto.randomUUID(),
	name: 'New Configuration',
	description: 'A thought-provoking project configuration',
	createdAt: new Date().toISOString(),
	pauseSoundFilename: 'pause_default.wav',
	options: {
		description: defaultDescriptionOptions,
		commentary: defaultCommentaryOptions,
		video: defaultVideoOptions,
	},
};
