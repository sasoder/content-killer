import { CommentaryOptions } from '@content-killer/shared';
import { TimestampText } from '@content-killer/shared';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { projectStorage } from '@/db/storage';
import { TimestampTextSchema } from '@/lib/serverSchema';
import {
	COMMENTARY_INTERROGATION_PROMPT,
	COMMENTARY_POKER_PROMPT,
	COMMENTARY_POLICE_PROMPT,
	COMMENTARY_SPORTS_PROMPT,
	generateCommentaryPrompt,
} from '@/lib/prompts';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const CommentarySchema = z.object({
	data: TimestampTextSchema,
});

export const generateCommentary = async (id: string, description: TimestampText[], options: CommentaryOptions) => {
	const project = await projectStorage.getProject(id);
	if (!project) {
		throw new Error('Project not found');
	}

	const prompt = generateCommentaryPrompt(JSON.stringify(description), options.intro, options.outro, options.videoType);
	let commentaryPrompt = '';
	switch (options.videoType) {
		case 'police':
			commentaryPrompt = COMMENTARY_POLICE_PROMPT;
			break;
		case 'sports':
			commentaryPrompt = COMMENTARY_SPORTS_PROMPT;
			break;
		case 'poker':
			commentaryPrompt = COMMENTARY_POKER_PROMPT;
			break;
		case 'interrogation':
			commentaryPrompt = COMMENTARY_INTERROGATION_PROMPT;
			break;
		default:
			throw new Error(`Unsupported video type: ${options.videoType}`);
	}

	const completion = await openai.beta.chat.completions.parse({
		model: process.env.OPENAI_COMMENTARY_MODEL || 'gpt-4o-mini',
		messages: [
			{ role: 'system', content: commentaryPrompt },
			{ role: 'user', content: prompt },
		],
		response_format: zodResponseFormat(CommentarySchema, 'commentary'),
	});

	// Update project state
	project.commentary = completion.choices[0].message.parsed?.data ?? [];
	project.options.commentary = options;
	await projectStorage.updateProjectState(project);

	return project.commentary;
};
