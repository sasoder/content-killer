import { VideoOptions } from '@shared/types/options';
import { TimestampTextList } from '@shared/types/api/schema';

export const generateVideo = async (
	commentary: TimestampTextList,
	options: VideoOptions,
): Promise<{ videoId: string; audioFiles: string[] }> => {
	if (options.playSound) {
		return {
			videoId: '123',
			audioFiles: ['123', '456', '789'],
		};
	}

	return {
		videoId: '',
		audioFiles: [],
	};
};
