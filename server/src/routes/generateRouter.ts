import { Hono } from 'hono';
import { generateDescription } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo } from '@/lib/generateVideo';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { TimestampTextList, VideoGenState } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage } from '@/database/projectStorage';
import { generateProjectId } from '@/lib/util';

const DescriptionOptionsSchema = z.object({
	url: z.string(),
	options: z.custom<DescriptionOptions>(),
});

const CommentaryOptionsSchema = z.object({
	description: z.custom<TimestampTextList>(),
	options: z.custom<CommentaryOptions>(),
});

const VideoOptionsSchema = z.object({
	commentary: z.custom<TimestampTextList>(),
	options: z.custom<VideoOptions>(),
});

const generateRouter = new Hono()
	.post('/description/:id', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		const id = c.req.param('id');
		const description = await generateDescription(id, url, options);
		const project = await projectStorage.getProject(id);
		if (project) {
			project.state.description = description;
			await projectStorage.updateProjectState(id, project.state);
		}
		return c.json(description);
	})
	.post('/metadata/:id', zValidator('json', z.object({ url: z.string() })), async c => {
		const { url } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (project) {
			const metadata: VideoGenState['metadata'] = await generateMetadata(url);
			project.state.metadata = metadata;
			await projectStorage.updateProjectState(id, project.state);
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
			project.state.commentary = commentary;
			await projectStorage.updateProjectState(id, project.state);
		}
		return c.json(commentary);
	})
	.post('/video/:id', zValidator('json', VideoOptionsSchema), async c => {
		const { commentary, options } = c.req.valid('json');
		const id = c.req.param('id');
		const { videoId, audioFiles } = await generateVideo(commentary, options);
		const project = await projectStorage.getProject(id);
		if (project) {
			project.state.videoFile = videoId;
			project.state.audioFiles = audioFiles;
			await projectStorage.updateProjectState(id, project.state);
		}
		return c.json({ videoId, audioFiles });
	})
	.post('/project', async c => {
		try {
			const newId = generateProjectId();
			await projectStorage.createProject(newId);
			return c.json({ id: newId });
		} catch (error) {
			console.error('Error creating project:', error);
			return c.json({ message: 'Internal server error' }, 500);
		}
	});

export { generateRouter };
