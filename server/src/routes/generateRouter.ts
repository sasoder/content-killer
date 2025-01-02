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
import { defaultProjectConfig } from '@shared/types/options/defaultOptions';
import { ProjectConfig } from '@shared/types/options/config';

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
	configId: z.string().optional(),
});

const generateRouter = new Hono()
	.post('/project', zValidator('json', ProjectOptionsSchema), async c => {
		const { configId } = c.req.valid('json');
		const id = generateProjectId();

		let optionConfig = undefined;
		if (configId) {
			const config = await projectStorage.getProjectConfig(configId);
			if (config) {
				optionConfig = config;
			}
		}

		const project = await projectStorage.createProject(id, optionConfig);
		return c.json(project);
	})
	.post('/projectConfig', async c => {
		try {
			await projectStorage.createProjectConfig(defaultProjectConfig);
			return c.json(defaultProjectConfig, 201);
		} catch (error) {
			console.error('Error creating project config:', error);
			return c.json({ message: 'Failed to create project config' }, 500);
		}
	})
	.post('/description/:id', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		if (!url && !options.sample) {
			return c.json({ error: 'No URL provided' }, 400);
		}
		const id = c.req.param('id');
		const description = await generateDescription(url, options);
		console.log('description', description);
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
			console.log('project time', project);
			if (!project?.metadata?.url && !project?.metadata?.url) {
				return c.json({ error: 'No video URL found' }, 400);
			}

			// Set initial status
			console.log('initial status set');

			// Generate audio first
			project.generationState.currentStep = GenerationStep.GENERATING_AUDIO;
			await projectStorage.updateProjectState(project);
			console.log('audio status set');

			// Generate video with status updates
			const updateGenerationStatus = async (status: GenerationStep, errorStep?: GenerationStep) => {
				project.generationState.currentStep = status;
				if (errorStep) {
					project.generationState.error = { ...project.generationState.error, step: errorStep, message: '' };
				} else if (status === GenerationStep.COMPLETED) {
					project.generationState.error = { ...project.generationState.error, step: GenerationStep.IDLE, message: '' };
				}
				await projectStorage.updateProjectState(project);
			};

			console.log('updateAudioStatus set');
			const audioIds = await generateAudio(id, commentary, options.audio);
			if (audioIds.length === 0) {
				throw new Error('Failed to generate audio');
			}

			console.log('updateVideoStatus set');
			await generateVideo(id, project.metadata.url, audioIds, options, updateGenerationStatus);
			console.log('generateVideo called');
			// Update final state
			project.commentary = commentary;
			project.options.video = options;
			await projectStorage.updateProjectState(project);

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

export { generateRouter };
