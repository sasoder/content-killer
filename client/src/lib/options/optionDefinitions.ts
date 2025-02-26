import { VideoOptions, DescriptionOptions, CommentaryOptions } from '@content-killer/shared';

export type OptionDefinition = {
	label: string;
	description: string;
	type: 'boolean' | 'number' | 'string';
	min?: number;
	max?: number;
	step?: number;
	options?: string[];
};

type OptionsDefinitionMap<T> = {
	[K in keyof T]: OptionDefinition;
};

export type VideoOptionDefinitions = {
	audio: OptionsDefinitionMap<VideoOptions['audio']>;
	video: OptionsDefinitionMap<VideoOptions['video']>;
};

export const descriptionOptionDefinitions: OptionsDefinitionMap<DescriptionOptions> = {
	temperature: {
		label: 'Temperature',
		description: 'Controls randomness in the generated description',
		type: 'number',
		min: 0,
		max: 2,
		step: 0.01,
	},
};

export const commentaryOptionDefinitions: OptionsDefinitionMap<CommentaryOptions> = {
	intro: {
		label: 'Intro Commentary',
		description: 'Add an introduction to the commentary',
		type: 'boolean',
	},
	outro: {
		label: 'Outro Commentary',
		description: 'Add a conclusion to the commentary',
		type: 'boolean',
	},
	temperature: {
		label: 'Temperature',
		description: 'Controls randomness in the generated commentary',
		type: 'number',
		min: 0,
		max: 2,
		step: 0.01,
	},
	videoType: {
		label: 'Video Type',
		description: 'The type of video to generate',
		type: 'string',
		options: ['police bodycam', 'sports', 'interrogation', 'poker'],
	},
};

export const videoOptionDefinitions: VideoOptionDefinitions = {
	audio: {
		stability: {
			label: 'Stability',
			description: 'Higher values will make the voice more consistent and stable, but may sound less natural.',
			type: 'number',
			min: 0,
			max: 1,
			step: 0.01,
		},
		voiceId: {
			label: 'Voice',
			description: 'The voice to use for the audio narration.',
			type: 'string',
		},
		speedMultiplier: {
			label: 'Speed Multiplier',
			description: 'The speed multiplier for the audio narration.',
			type: 'number',
			min: 0.75,
			max: 1.75,
			step: 0.01,
		},
	},
	video: {
		bw: {
			label: 'Black & White',
			description: 'Convert the video to black and white during commentary.',
			type: 'boolean',
		},
		playSound: {
			label: 'Play Pause Sound',
			description: 'Play the original video sound during commentary.',
			type: 'boolean',
		},
		subtitlesEnabled: {
			label: 'Enable Subtitles',
			description: 'Show subtitles during commentary.',
			type: 'boolean',
		},
		subtitlesSize: {
			label: 'Subtitles Size',
			description: 'Size of the subtitles in pixels.',
			type: 'number',
			min: 8,
			max: 32,
			step: 1,
		},
		size: {
			label: 'Video Size',
			description: 'The size of the output video.',
			type: 'string',
			options: ['720p', '1080p', '1440p', '4k', 'source'],
		},
	},
};
