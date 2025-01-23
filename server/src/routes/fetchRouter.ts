import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { Project } from '@content-killer/shared/api/schema';
import { Voice } from '@content-killer/shared/options';
import { ElevenLabsClient } from 'elevenlabs';

const client = new ElevenLabsClient();

const fetchRouter = new Hono()
	.get('/projects', async c => {
		const projects = await projectStorage.getAllProjects();
		projects.sort(
			(a: Project, b: Project) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime(),
		);
		return c.json(projects);
	})
	.get('/project/:id', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}
		return c.json(project);
	})
	.get('/templates', async c => {
		const templates = await projectStorage.getAllTemplates();
		return c.json(templates);
	})
	.get('/template/:id', async c => {
		const id = c.req.param('id');
		const template = await projectStorage.getTemplate(id);
		if (!template) {
			return c.json({ error: 'Template not found' }, 404);
		}
		return c.json(template);
	})
	.get('/voices', async c => {
		try {
			const voices = await client.voices.getAll();
			return c.json(
				voices.voices
					.filter(voice => voice.voice_id && voice.name)
					.map(voice => ({
						id: voice.voice_id,
						name: voice.name || 'Unnamed Voice',
						previewUrl: voice.preview_url,
					})),
			);
		} catch (error) {
			return c.json({ error: 'Failed to fetch voices' }, 500);
		}
	})
	.get('/project/:id/download/audio', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}
		const zippedFiles = await projectStorage.getAudio(id);
		return new Response(zippedFiles, {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="audio-${id}.zip"`,
				'Content-Length': zippedFiles.length.toString(),
				'Cache-Control': 'no-cache',
			},
		});
	})
	.get('/project/:id/download/video', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}
		const video = await projectStorage.getVideo(id);
		return new Response(video, {
			headers: {
				'Content-Type': 'video/mp4',
				'Content-Disposition': `attachment; filename="video-${id}.mp4"`,
			},
		});
	});

export { fetchRouter };
