import { DescriptionOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';

export const generateDescription = async (
	id: string,
	url: string,
	options: DescriptionOptions,
): Promise<TimestampText[]> => {
	if (options.sample) {
		return [
			{
				timestamp: '00:00',
				text: 'This is a test description, you have the options: ' + JSON.stringify(options),
			},
			{
				timestamp: '00:01',
				text: 'This is a test description, you have the url: ' + url,
			},
			{
				timestamp: '00:02',
				text: 'This is a test description',
			},
			{
				timestamp: '00:03',
				text: 'This is a test description',
			},
		];
	}

	return [];
};
