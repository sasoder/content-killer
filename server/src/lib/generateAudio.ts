import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';

export const generateAudio = async (
	commentary: TimestampText[],
	options: VideoOptions['audio'],
	url: string,
): Promise<string[]> => {
	if (options.stability > 0.5) {
		return ['123', '456', '789'];
	}

	return [];
};
