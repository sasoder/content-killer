import { Hono } from 'hono';
import { generateDescription } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo } from '@/lib/generateVideo';
import { generateAudio } from '@/lib/generateAudio';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { AudioGenStatus, TimestampText, VideoGenState, VideoGenStatus, VideoMetadata } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage } from '@/db/storage';
import { generateProjectId } from '@/lib/util';

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
			const config = await projectStorage.getOptionConfig(configId);
			if (config) {
				optionConfig = config;
			}
		}

		const project = await projectStorage.createProject(id, optionConfig);
		return c.json(project);
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
			if (!project?.metadata?.url) {
				return c.json({ error: 'No video URL found' }, 400);
			}

			// Set initial status
			project.videoStatus = VideoGenStatus.STARTING;
			project.audioStatus = AudioGenStatus.STARTING;
			await projectStorage.updateProjectState(project);

			// Generate audio first
			project.audioStatus = AudioGenStatus.GENERATING;
			await projectStorage.updateProjectState(project);

			const updateAudioStatus = async (status: AudioGenStatus, errorStep?: AudioGenStatus) => {
				project.audioStatus = status;
				if (errorStep) {
					project.errorStep = { ...project.errorStep, audio: errorStep };
				} else if (status === AudioGenStatus.COMPLETED) {
					project.errorStep = { ...project.errorStep, audio: undefined };
				}
				await projectStorage.updateProjectState(project);
			};

			const audioIds = await generateAudio(id, commentary, options.audio, updateAudioStatus);
			if (audioIds.length === 0) {
				throw new Error('Failed to generate audio');
			}

			// Generate video with status updates
			const updateVideoStatus = async (status: VideoGenStatus, errorStep?: VideoGenStatus) => {
				project.videoStatus = status;
				if (errorStep) {
					project.errorStep = { ...project.errorStep, video: errorStep };
				} else if (status === VideoGenStatus.COMPLETED) {
					project.errorStep = { ...project.errorStep, video: undefined };
				}
				await projectStorage.updateProjectState(project);
			};

			await generateVideo(id, project.metadata.url, audioIds, options, updateVideoStatus);

			// Update final state
			project.commentary = commentary;
			project.options.video = options;
			await projectStorage.updateProjectState(project);

			return c.json({ success: true });
		} catch (error) {
			// Update error state
			const project = await projectStorage.getProject(id);
			if (project) {
				project.videoStatus = VideoGenStatus.ERROR;
				project.audioStatus = AudioGenStatus.ERROR;
				project.errorStep = {
					video: VideoGenStatus.GENERATING_VIDEO, // Default to last step if unknown
					audio: AudioGenStatus.GENERATING,
				};
				await projectStorage.updateProjectState(project);
			}
			console.error('Error generating video:', error);
			return c.json({ error: 'Failed to generate video' }, 500);
		}
	});

export { generateRouter };
