export type TimestampText = {
	timestamp: string;
	text: string;
};

export type TimestampTextList = {
	items: TimestampText[];
};

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
