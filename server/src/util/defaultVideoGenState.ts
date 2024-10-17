import { VideoGenState, TimestampTextList, VideoMetadata } from '@shared/types/api/schema';

export const createDefaultVideoGenState = (id: string): VideoGenState => {
	return {
		description: { items: [] },
		commentary: { items: [] },
		audioFiles: [],
		videoFile: '',
		metadata: {
			url: '',
			title: 'New Project',
			duration: '0:00',
		},
	};
};
