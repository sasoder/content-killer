import { CommentaryOptions, DescriptionOptions, VideoOptions } from '.';

export type OptionConfig = {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	pauseSoundPath: string;
};
