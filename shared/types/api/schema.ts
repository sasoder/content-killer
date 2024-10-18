import { DescriptionOptions, CommentaryOptions, VideoOptions } from '../options';

export type TimestampText = {
	timestamp: string;
	text: string;
};

export type VideoMetadata = {
	url: string;
	title: string;
	duration: string;
	createdAt: string;
};

export type VideoGenState = {
	id: string;
	description: TimestampText[];
	commentary: TimestampText[];
	audioIds: string[];
	videoId: string;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	metadata: VideoMetadata;
};
