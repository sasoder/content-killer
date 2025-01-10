import { CommentaryOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { projectStorage } from '@/db/storage';
import { TimestampTextSchema } from '@/lib/serverSchema';
import { COMMENTARY_BASE_PROMPT, generateCommentaryPrompt } from '@/lib/prompts';

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

	const prompt = generateCommentaryPrompt(JSON.stringify(description), options.intro, options.outro);

	const completion = await openai.beta.chat.completions.parse({
		model: 'gpt-4o-mini',
		messages: [
			{ role: 'system', content: COMMENTARY_BASE_PROMPT },
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
