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
	audioStatus: AudioGenStatus;
	videoStatus: VideoGenStatus;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	metadata: VideoMetadata;
};

export type VideoGenStatus =
	| 'idle'
	| 'generating commentary audio'
	| 'downloading source'
	| 'transcribing source'
	| 'generating video'
	| 'completed'
	| 'error';
export type AudioGenStatus = 'idle' | 'generating' | 'completed' | 'error';
