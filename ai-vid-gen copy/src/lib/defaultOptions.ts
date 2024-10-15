import { DescriptionOptions, CommentaryOptions, AudioOptions, VideoOptions } from '@/lib/schema';

export const defaultDescriptionOptions: DescriptionOptions = {
	sample: {
		type: 'checkbox',
		label: 'Sample',
		key: 'sample',
		default: true,
	},
};

export const defaultCommentaryOptions: CommentaryOptions = {
	intro: {
		type: 'checkbox',
		label: 'Include Intro',
		key: 'intro',
		default: true,
	},
	outro: {
		type: 'checkbox',
		label: 'Include Outro',
		key: 'outro',
		default: true,
	},
	temperature: {
		type: 'slider',
		label: 'Temperature',
		key: 'temperature',
		default: 0.7,
		min: 0,
		max: 2,
		step: 0.01,
	},
};

export const defaultAudioOptions: AudioOptions = {
	stability: {
		type: 'slider',
		label: 'Emotion',
		key: 'stability',
		default: 0.7,
		min: 0,
		max: 1,
		step: 0.01,
	},
};

export const defaultVideoOptions: VideoOptions = {
	bw: {
		type: 'checkbox',
		label: 'B/W pauses',
		key: 'bw',
		default: true,
	},
	playSound: {
		type: 'checkbox',
		label: 'Play Sound',
		key: 'playSound',
		default: true,
	},
	subtitlesEnabled: {
		type: 'checkbox',
		label: 'Subtitles',
		key: 'subtitlesEnabled',
		default: true,
	},
	subtitlesSize: {
		type: 'slider',
		label: 'Subtitle Size',
		key: 'subtitlesSize',
		default: 14,
		min: 1,
		max: 30,
		step: 1,
	},
};
