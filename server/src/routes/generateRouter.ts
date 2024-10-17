import { Hono } from 'hono';
import { generateDescription } from '@/util/generateDescription';
import { generateMetadata } from '@/util/generateMetadata';
import { generateCommentary } from '@/util/generateCommentary';
import { DescriptionOptions, CommentaryOptions } from '@shared/types/options';
import { TimestampTextList, VideoMetadata, VideoGenState } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage } from '@/database/projectStorage';

const DescriptionOptionsSchema = z.object({
	url: z.string(),
	options: z.custom<DescriptionOptions>(),
});

const CommentaryOptionsSchema = z.object({
	description: z.custom<TimestampTextList>(),
	options: z.custom<CommentaryOptions>(),
});

const VideoGenStateSchema = z.object({
	id: z.string(),
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
			const metadata: VideoMetadata = await generateMetadata(url);
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
	.post('/createVideoGenState/:id', zValidator('json', VideoGenStateSchema), async c => {
		const { id } = c.req.valid('json');
		const existingProject = await projectStorage.getProject(id);
		if (existingProject) {
			return c.json({ message: 'Project already exists' }, 400);
		}
		await projectStorage.createProject(id);
		const newProject = await projectStorage.getProject(id);
		return c.json(newProject!.state, 201);
	});

export { generateRouter };
