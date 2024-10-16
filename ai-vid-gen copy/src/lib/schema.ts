import { GenerateOptions, OptionValues } from '@/lib/types';

export type TimestampText = {
	timestamp: string;
	text: string;
};

export type TimestampTextList = {
	items: TimestampText[];
};

export type DescriptionOptions = GenerateOptions;
export type CommentaryOptions = GenerateOptions;
export type AudioOptions = GenerateOptions;
export type VideoOptions = GenerateOptions;

export type DescriptionOptionValues = OptionValues<DescriptionOptions>;
export type CommentaryOptionValues = OptionValues<CommentaryOptions>;
export type AudioOptionValues = OptionValues<AudioOptions>;
export type VideoOptionValues = OptionValues<VideoOptions>;

export type VideoMetadata = {
	url: string;
	title: string;
	duration: string;
};

export type VideoGenState = {
	description: TimestampTextList;
	commentary: TimestampTextList;
	audioFiles: string[];
	videoFile: string;
	metadata: VideoMetadata;
};

export const VideoGenStateType = {
	default: (): VideoGenState => ({
		description: { items: [] },
		commentary: { items: [] },
		audioFiles: [],
		videoFile: '',
		metadata: { url: '', title: '', duration: '' },
	}),
};
