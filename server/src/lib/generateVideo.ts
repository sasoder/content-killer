import { VideoOptions } from '@shared/types/options';
import { TimestampTextList } from '@shared/types/api/schema';

export const generateVideo = async (
	commentary: TimestampTextList,
	options: VideoOptions,
): Promise<{ videoId: string; audioIds: string[] }> => {
	if (options.playSound) {
		return {
			videoId: '123',
			audioIds: ['123', '456', '789'],
		};
	}

	return {
		videoId: '',
		audioIds: [],
	};
};
