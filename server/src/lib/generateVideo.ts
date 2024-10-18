import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';

export const generateVideo = async (
	commentary: TimestampText[],
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
