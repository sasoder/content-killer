import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { Voice } from '@shared/types/options';
import { ElevenLabsClient } from 'elevenlabs';
import { OptionConfig } from '@shared/types/options/config';

const client = new ElevenLabsClient();

const fetchRouter = new Hono()
	.get('/videoGenStates', async c => {
		const videoGenStates = await projectStorage.getAllVideoGenStates();
		const sortedVideoGenStates = videoGenStates.sort((a, b) => {
			return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
		});
		return c.json(sortedVideoGenStates);
	})
	.get('/videoGenState/:id', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ message: 'Project not found' }, 404);
		}
		return c.json(project);
	})
	.get('/optionConfigs', async c => {
		try {
			const configs = await projectStorage.getAllOptionConfigs();
			return c.json(configs);
		} catch (error) {
			console.error('Error fetching option configs:', error);
			return c.json({ message: 'Failed to fetch option configs' }, 500);
		}
	})
	.get('/optionConfig/:id', async c => {
		const id = c.req.param('id');
		const config = await projectStorage.getOptionConfig(id);
		if (!config) {
			return c.json({ message: 'Option config not found' }, 404);
		}
		return c.json(config);
	})
	.post('/optionConfig', async c => {
		try {
			const config = await c.req.json<OptionConfig>();
			await projectStorage.createOptionConfig(config);
			return c.json(config, 201);
		} catch (error) {
			console.error('Error creating option config:', error);
			return c.json({ message: 'Failed to create option config' }, 500);
		}
	})
	.get('/voices', async c => {
		try {
			const voices = await client.voices.getAll();
			const formattedVoices: Voice[] = voices.voices
				.filter(voice => voice.voice_id && voice.name)
				.map(voice => ({
					id: voice.voice_id,
					name: voice.name || 'Unnamed Voice',
					previewUrl: voice.preview_url,
				}));
			return c.json(formattedVoices);
		} catch (error) {
			console.error('Error fetching voices:', error);
			return c.json({ error: 'Failed to fetch voices' }, 500);
		}
	});

export { fetchRouter };
