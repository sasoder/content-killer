import { DescriptionOptions, CommentaryOptions, VideoOptions } from '.';

export interface Template {
	id: string;
	name: string;
	description: string;
	createdAt: string;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	pauseSoundFilename: string;
}
