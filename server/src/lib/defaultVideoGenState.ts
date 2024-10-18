import { VideoGenState } from '@shared/types/api/schema';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import {
	defaultDescriptionOptions,
	defaultCommentaryOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultOptions';

export const createDefaultVideoGenState = (id: string): VideoGenState => {
	return {
		id,
		description: [],
		commentary: [],
		audioIds: [],
		videoId: '',
		metadata: {
			url: '',
			title: 'New Project',
			duration: '0:00',
			createdAt: new Date().toISOString(),
		},
		options: {
			description: defaultDescriptionOptions,
			commentary: defaultCommentaryOptions,
			video: defaultVideoOptions,
		},
	};
};
