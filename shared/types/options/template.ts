import { DescriptionOptions, CommentaryOptions, VideoOptions } from '.';

export interface ProjectTemplate {
	id: string;
	name?: string;
	description?: string;
	createdAt: string;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	pauseSoundFilename: string;
}
