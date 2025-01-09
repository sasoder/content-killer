import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { ProjectTemplate } from '@shared/types/options/template';
import { zValidator } from '@hono/zod-validator';
import { TimestampTextSchema } from '@/lib/serverSchema';
import { UpdateProjectTemplateSchema, UpdateProjectDataSchema, UploadPauseSoundSchema } from '@/lib/apiSchema';

const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac'];

const updateRouter = new Hono()
	.put('/projectTemplate/:id', zValidator('json', UpdateProjectTemplateSchema), async c => {
		try {
			const id = c.req.param('id');
			const template = c.req.valid('json');
			if (id !== template.id) {
				return c.json({ error: 'ID mismatch' }, 400);
			}
			await projectStorage.updateProjectTemplate(template);
			return c.json(template);
		} catch (error) {
			console.error('Error updating project template:', error);
			return c.json({ error: 'Failed to update project template' }, 500);
		}
	})
	.delete('/projectTemplate/:id', async c => {
		try {
			const id = c.req.param('id');
			await projectStorage.deleteProjectTemplate(id);
			return c.json({ message: 'Project template deleted successfully' });
		} catch (error) {
			console.error('Error deleting project template:', error);
			return c.json({ error: 'Failed to delete project template' }, 500);
		}
	})
	.put('/project/:id/description', zValidator('json', TimestampTextSchema), async c => {
		const id = c.req.param('id');
		const description = c.req.valid('json');
		const project = await projectStorage.getProject(id);

		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}

		project.description = description;
		await projectStorage.updateProjectState(project);
		return c.json({ message: 'Description updated' }, 200);
	})
	.put('/project/:id/commentary', zValidator('json', TimestampTextSchema), async c => {
		const id = c.req.param('id');
		const commentary = c.req.valid('json');
		const project = await projectStorage.getProject(id);

		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}

		project.commentary = commentary;
		await projectStorage.updateProjectState(project);
		return c.json({ message: 'Commentary updated' }, 200);
	})
	.put('/project/:id', zValidator('json', UpdateProjectDataSchema), async c => {
		const id = c.req.param('id');
		const { data } = c.req.valid('json');
		const project = await projectStorage.getProject(id);

		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}

		await projectStorage.updateProjectState({ ...project, ...data });
		return c.json({ message: 'Project updated' }, 200);
	})
	.post('/projectTemplate/:id/pauseSound', zValidator('form', UploadPauseSoundSchema), async c => {
		try {
			const id = c.req.param('id');

			const body = await c.req.parseBody();
			const file = body['file'] as File;
			const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
			if (!ALLOWED_AUDIO_EXTENSIONS.includes(fileExt)) {
				return c.json({ error: 'Unsupported audio format' }, 400);
			}

			const buffer = await file.arrayBuffer();
			const filename = file.name;
			await projectStorage.updateTemplatePauseSound(id, filename, Buffer.from(buffer));

			return c.json({ filename }, 201);
		} catch (error) {
			console.error('Error uploading pause sound:', error);
			return c.json({ error: 'Failed to upload pause sound' }, 500);
		}
	});

export { updateRouter };
