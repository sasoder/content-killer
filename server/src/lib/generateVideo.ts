import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';

export const generateVideo = async (
	commentary: TimestampText[],
	audioIds: string[],
	options: VideoOptions['video'],
	url: string,
): Promise<{ videoId: string }> => {
	if (options.playSound) {
		return {
			videoId: '123',
		};
	}

	return {
		videoId: '',
	};
};
