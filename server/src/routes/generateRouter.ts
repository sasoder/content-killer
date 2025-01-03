import { Hono } from 'hono';
import { generateDescription } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo } from '@/lib/generateVideo';
import { generateAudio } from '@/lib/generateAudio';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { GenerationStep, TimestampText, VideoGenState, VideoMetadata } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage } from '@/db/storage';
import { generateProjectId } from '@/lib/util';
import { defaultProjectTemplate } from '@shared/types/options/defaultTemplates';

const DescriptionOptionsSchema = z.object({
	url: z.string(),
	options: z.custom<DescriptionOptions>(),
});

const CommentaryOptionsSchema = z.object({
	description: z.array(
		z.object({
			timestamp: z.string(),
			text: z.string(),
		}),
	),
	options: z.custom<CommentaryOptions>(),
});

const VideoOptionsSchema = z.object({
	commentary: z.array(
		z.object({
			timestamp: z.string(),
			text: z.string(),
		}),
	),
	options: z.custom<VideoOptions>(),
});

const ProjectOptionsSchema = z.object({
	templateId: z.string().optional(),
});

const generateRouter = new Hono()
	.post('/project', zValidator('json', ProjectOptionsSchema), async c => {
		const { templateId } = c.req.valid('json');
		const id = generateProjectId();
		let optionTemplate = undefined;
		if (templateId) {
			const template = await projectStorage.getProjectTemplate(templateId);
			if (template) {
				optionTemplate = template;
			}
		}

		const project = await projectStorage.createProject(id, optionTemplate);
		return c.json(project, 201);
	})
	.post('/projectTemplate', async c => {
		try {
			const template = {
				...defaultProjectTemplate,
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				pauseSoundFilename: 'pause_default.wav',
			};

			await projectStorage.createProjectTemplate(template);

			// Copy the default pause sound to the new template
			const defaultPauseSound = await projectStorage.getProjectTemplateFile('default', 'pause_default.wav');
			await projectStorage.updateTemplatePauseSound(template.id, template.pauseSoundFilename, defaultPauseSound);

			return c.json(template, 201);
		} catch (error) {
			console.error('Error creating project template:', error);
			return c.json({ message: 'Failed to create project template' }, 500);
		}
	})
	.post('/description/:id', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		if (!url && !options.sample) {
			return c.json({ error: 'No URL provided' }, 400);
		}
		const id = c.req.param('id');
		const description = await generateDescription(url, options);
		const project = await projectStorage.getProject(id);
		if (project) {
			project.description = description;
			project.options.description = options;
			project.metadata = { ...project.metadata, url };
			await projectStorage.updateProjectState(project);
		}
		return c.json(description ?? []);
	})
	.post('/metadata/:id', zValidator('json', z.object({ url: z.string() })), async c => {
		const { url } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (project) {
			const metadata: Partial<VideoMetadata> = await generateMetadata(url);
			project.metadata = { ...project.metadata, ...metadata };
			await projectStorage.updateProjectState(project);
			return c.json(metadata);
		}
		return c.json({ error: 'Project not found' }, 404);
	})
	.post('/commentary/:id', zValidator('json', CommentaryOptionsSchema), async c => {
		const { description, options } = c.req.valid('json');
		const id = c.req.param('id');
		const commentary = await generateCommentary(description, options);
		const project = await projectStorage.getProject(id);
		if (project) {
			project.commentary = commentary;
			project.description = description;
			project.options.commentary = options;
			await projectStorage.updateProjectState(project);
		}
		return c.json(commentary);
	})
	.post('/video/:id', zValidator('json', VideoOptionsSchema), async c => {
		const { commentary, options } = c.req.valid('json');
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project?.metadata?.url && !project?.metadata?.url) {
				return c.json({ error: 'No video URL found' }, 400);
			}

			project.generationState.completedSteps = [];
			project.commentary = commentary;
			project.options.video = options;
			await updateState(project, GenerationStep.PREPARING);
			await updateState(project, GenerationStep.GENERATING_AUDIO);
			await generateAudio(id, commentary, options.audio);
			await generateVideo(project, options, (step, error) => updateState(project, step, error));
			await updateState(project, GenerationStep.COMPLETED);

			return c.json({ success: true });
		} catch (error) {
			// Update error state
			const project = await projectStorage.getProject(id);
			if (project) {
				project.generationState.currentStep = GenerationStep.ERROR;
				project.generationState.error = {
					step: GenerationStep.FINALIZING,
					message: error instanceof Error ? error.message : 'Unknown error',
				};
				await projectStorage.updateProjectState(project);
			}
			console.error('Error generating video:', error);
			return c.json({ error: 'Failed to generate video' }, 500);
		}
	});

const updateState = async (
	project: VideoGenState,
	step: GenerationStep,
	error?: { step: GenerationStep; message: string },
) => {
	if (!project) throw new Error('Project not found');

	if (!project.generationState.completedSteps) {
		project.generationState.completedSteps = [];
	}

	if (step === GenerationStep.PREPARING) {
		project.generationState.completedSteps = [];
	} else if (!error && step !== GenerationStep.ERROR && project.generationState.currentStep !== GenerationStep.IDLE) {
		if (!project.generationState.completedSteps.includes(project.generationState.currentStep)) {
			project.generationState.completedSteps.push(project.generationState.currentStep);
		}
	}

	project.generationState = {
		currentStep: step,
		completedSteps: project.generationState.completedSteps,
		...(error && { error }),
	};

	await projectStorage.updateProjectState(project);
};

export { generateRouter };
