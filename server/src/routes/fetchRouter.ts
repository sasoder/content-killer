import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { Voice } from '@shared/types/options';
import { ElevenLabsClient } from 'elevenlabs';
import * as path from 'path';
import * as fs from 'fs';
import JSZip from 'jszip';

const client = new ElevenLabsClient();

const fetchRouter = new Hono()
	.get('/videoGenStates', async c => {
		const videoGenStates = await projectStorage.getAllVideoGenStates();
		return c.json(
			videoGenStates.sort(
				(a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime(),
			),
		);
	})
	.get('/videoGenState/:id', async c => {
		const project = await projectStorage.getProject(c.req.param('id'));
		if (!project) return c.json({ message: 'Project not found' }, 404);
		return c.json(project);
	})
	.get('/projectConfigs', async c => {
		try {
			return c.json(
				(await projectStorage.getAllProjectConfigs()).sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				),
			);
		} catch (error) {
			return c.json({ message: 'Failed to fetch project configs' }, 500);
		}
	})
	.get('/projectConfig/:id', async c => {
		const config = await projectStorage.getProjectConfig(c.req.param('id'));
		if (!config) return c.json({ message: 'Project config not found' }, 404);
		return c.json(config);
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
	.get('/download/:id/:type', async c => {
		try {
			const id = c.req.param('id');
			const type = c.req.param('type');

			if (type !== 'video' && type !== 'audio') {
				return c.json({ error: 'Invalid type' }, 400);
			}

			const project = await projectStorage.getProject(id);
			if (!project) {
				return c.json({ error: 'Project not found' }, 404);
			}

			const sanitizedTitle = project.metadata.title
				.replace(/[^a-zA-Z0-9\s-]/g, '')
				.replace(/\s+/g, '-')
				.toLowerCase();

			if (type === 'video') {
				const videoPath = path.join('data', id, 'video', 'output.mp4');
				if (!fs.existsSync(videoPath)) {
					return c.json({ error: 'Video file not found' }, 404);
				}

				const fileBuffer = fs.readFileSync(videoPath);
				return new Response(fileBuffer, {
					headers: new Headers({
						'Content-Type': 'video/mp4',
						'Content-Disposition': `attachment; filename="${sanitizedTitle}.mp4"`,
						'Content-Length': fileBuffer.length.toString(),
					}),
				});
			} else {
				const commentaryDir = path.join('data', id, 'commentary');
				if (!fs.existsSync(commentaryDir)) {
					return c.json({ error: 'Audio files not found' }, 404);
				}

				const files = fs.readdirSync(commentaryDir).filter(file => file.endsWith('.mp3'));
				if (files.length === 0) {
					return c.json({ error: 'No audio files found' }, 404);
				}

				const zip = new JSZip();
				files.forEach(file => {
					zip.file(file, fs.readFileSync(path.join(commentaryDir, file)));
				});

				const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
				return new Response(zipBuffer, {
					headers: new Headers({
						'Content-Type': 'application/zip',
						'Content-Disposition': `attachment; filename="${sanitizedTitle}-commentary.zip"`,
						'Content-Length': zipBuffer.length.toString(),
					}),
				});
			}
		} catch (error) {
			return c.json({ error: 'Internal server error' }, 500);
		}
	});

export { fetchRouter };
