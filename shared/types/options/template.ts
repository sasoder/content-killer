import { CommentaryOptions, DescriptionOptions, VideoOptions } from '.';

export type ProjectTemplate = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	pauseSoundFilename: string;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
};
