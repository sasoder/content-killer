import { CommentaryOptions, DescriptionOptions, VideoOptions } from '.';

export type ProjectConfig = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	pauseSoundFilename: string | null;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
};
