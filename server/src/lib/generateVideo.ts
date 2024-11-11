import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';

export const generateVideo = async (
	commentary: TimestampText[],
	audioIds: string[],
	options: VideoOptions['video'],
	url: string,
): Promise<string> => {
	if (options.playSound) {
		return '123';
	}

	return '';
};
