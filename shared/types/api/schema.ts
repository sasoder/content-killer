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
	errorStep?: {
		video?: VideoGenStatus;
		audio?: AudioGenStatus;
	};
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	metadata: VideoMetadata;
};

export enum VideoGenStatus {
	IDLE,
	STARTING,
	GENERATING_COMMENTARY_AUDIO,
	DOWNLOADING_SOURCE,
	TRANSCRIBING_SOURCE,
	GENERATING_VIDEO,
	COMPLETED,
	ERROR,
}

export enum AudioGenStatus {
	IDLE,
	STARTING,
	GENERATING,
	COMPLETED,
	ERROR,
}
