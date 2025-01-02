import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { ProjectConfig } from '@shared/types/options/config';
import * as fs from 'fs';

const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac'];

const updateRouter = new Hono()
	.put('/projectConfig/:id', async c => {
		try {
			const id = c.req.param('id');
			const config = await c.req.json<ProjectConfig>();
			if (id !== config.id) {
				return c.json({ message: 'ID mismatch' }, 400);
			}
			await projectStorage.updateProjectConfig(config);
			return c.json(config);
		} catch (error) {
			console.error('Error updating project config:', error);
			return c.json({ message: 'Failed to update project config' }, 500);
		}
	})
	.delete('/projectConfig/:id', async c => {
		try {
			const id = c.req.param('id');
			await projectStorage.deleteProjectConfig(id);
			return c.json({ message: 'Project config deleted successfully' });
		} catch (error) {
			console.error('Error deleting project config:', error);
			return c.json({ message: 'Failed to delete project config' }, 500);
		}
	})
	.post('/projectConfig/:id/pauseSound', async c => {
		try {
			const id = c.req.param('id');
			const formData = await c.req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return c.json({ message: 'No file uploaded' }, 400);
			}

			const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
			if (!ALLOWED_AUDIO_EXTENSIONS.includes(fileExt)) {
				return c.json({ message: 'Unsupported audio format' }, 400);
			}

			const buffer = await file.arrayBuffer();
			const filename = file.name;
			await projectStorage.saveProjectConfigFile(id, filename, Buffer.from(buffer));

			return c.json({ filename }, 201);
		} catch (error) {
			console.error('Error uploading pause sound:', error);
			return c.json({ message: 'Failed to upload pause sound' }, 500);
		}
	})
	.post('/:id/:fileName', async c => {
		const id = c.req.param('id');
		const fileName = c.req.param('fileName');

		try {
			const formData = await c.req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return c.json({ message: 'No file uploaded' }, 400);
			}

			const buffer = await file.arrayBuffer();
			await projectStorage.saveFile(id, fileName, Buffer.from(buffer));

			return c.json({ message: 'File uploaded successfully' }, 201);
		} catch (error) {
			console.error('Error uploading file:', error);
			return c.json({ message: 'Internal server error' }, 500);
		}
	});

export { updateRouter };
