import { CommentaryOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';

export const generateCommentary = async (
	description: TimestampText[],
	options: CommentaryOptions,
): Promise<TimestampText[]> => {
	console.log('generateCommentary', description, options);
	return [
		{
			timestamp: '00:00',
			text: 'This is a test commentary' + description.length,
		},
		{
			timestamp: '00:01',
			text: `This is a test commentary, you have the options: ${JSON.stringify(options)}`,
		},
		{
			timestamp: '00:02',
			text: 'This is a test commentary',
		},
	];
};
