import { CommentaryOptions } from '@shared/types/options';
import { TimestampTextList } from '@shared/types/api/schema';

export const generateCommentary = async (
	description: TimestampTextList,
	options: CommentaryOptions,
): Promise<TimestampTextList> => {
	console.log('generateCommentary', description, options);
	return {
		items: [
			{
				timestamp: '00:00',
				text: 'This is a test commentary' + description.items.length,
			},
			{
				timestamp: '00:01',
				text: `This is a test commentary, you have the options: ${JSON.stringify(options)}`,
			},
			{
				timestamp: '00:02',
				text: 'This is a test commentary',
			},
		],
	};
};
