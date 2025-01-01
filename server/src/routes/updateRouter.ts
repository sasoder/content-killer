import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { OptionConfig } from '@shared/types/options/config';

const updateRouter = new Hono()
	.put('/optionConfig/:id', async c => {
		try {
			const id = c.req.param('id');
			const config = await c.req.json<OptionConfig>();
			if (id !== config.id) {
				return c.json({ message: 'ID mismatch' }, 400);
			}
			await projectStorage.updateOptionConfig(config);
			return c.json(config);
		} catch (error) {
			console.error('Error updating option config:', error);
			return c.json({ message: 'Failed to update option config' }, 500);
		}
	})
	.post('/optionConfig/:id/pauseSound', async c => {
		try {
			const id = c.req.param('id');
			const formData = await c.req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return c.json({ message: 'No file uploaded' }, 400);
			}

			const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp3';
			if (!['mp3', 'wav', 'm4a', 'aac'].includes(fileExt)) {
				return c.json({ message: 'Unsupported audio format' }, 400);
			}

			const buffer = await file.arrayBuffer();
			const fileName = await projectStorage.saveOptionConfigFile(id, `pause.${fileExt}`, Buffer.from(buffer));

			const config = await projectStorage.getOptionConfig(id);
			if (config) {
				config.pauseSoundPath = fileName;
				await projectStorage.updateOptionConfig(config);
			}

			return c.json({ fileName }, 201);
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
