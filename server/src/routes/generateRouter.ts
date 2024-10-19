import { Hono } from 'hono';
import { generateDescription } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo } from '@/lib/generateVideo';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { TimestampText, VideoGenState, VideoMetadata } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage } from '@/database/projectStorage';
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

const generateRouter = new Hono()
	.post('/description/:id', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		const id = c.req.param('id');
		const description = await generateDescription(id, url, options);
		const project = await projectStorage.getProject(id);
		if (project) {
			project.description = description;
			project.options.description = options;
			project.metadata = { ...project.metadata, url };
			await projectStorage.updateProjectState(project);
		}
		return c.json(description);
	})
	.post('/metadata/:id', zValidator('json', z.object({ url: z.string() })), async c => {
		const { url } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (project) {
			const metadata: Partial<VideoMetadata> = await generateMetadata(url);
			project.metadata = { ...project.metadata, ...metadata };
			console.log('------------METADATA-------------------');
			console.log(project.metadata);
			console.log('------------METADATA-------------------');
			await projectStorage.updateProjectState(project);
			return c.json(metadata);
		}
		return c.json({ message: 'Project not found' }, 404);
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
			console.log('options', options);
			await projectStorage.updateProjectState(project);
		}
		return c.json(commentary);
	})
	.post('/video/:id', zValidator('json', VideoOptionsSchema), async c => {
		const { commentary, options } = c.req.valid('json');
		const id = c.req.param('id');
		const { videoId, audioIds } = await generateVideo(commentary, options);
		const project = await projectStorage.getProject(id);
		if (project) {
			project.videoId = videoId;
			project.audioIds = audioIds;
			project.commentary = commentary;
			project.options.video = options;
			await projectStorage.updateProjectState(project);
		}
		return c.json({ videoId, audioIds });
	})
	.post('/project', async c => {
		try {
			const newId = generateProjectId();
			const project = await projectStorage.createProject(newId);
			return c.json(project);
		} catch (error) {
			console.error('Error creating project:', error);
			return c.json({ message: 'Internal server error' }, 500);
		}
	});

export { generateRouter };
