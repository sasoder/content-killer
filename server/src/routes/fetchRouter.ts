import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { Voice } from '@shared/types/options';
import { ElevenLabsClient } from 'elevenlabs';
import { ProjectConfig } from '@shared/types/options/config';
import * as path from 'path';
import * as fs from 'fs';
import JSZip from 'jszip';

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
	.get('/projectConfigs', async c => {
		try {
			const configs = await projectStorage.getAllProjectConfigs();
			return c.json(configs);
		} catch (error) {
			console.error('Error fetching project configs:', error);
			return c.json({ message: 'Failed to fetch project configs' }, 500);
		}
	})
	.get('/projectConfig/:id', async c => {
		const id = c.req.param('id');
		const config = await projectStorage.getProjectConfig(id);
		if (!config) {
			return c.json({ message: 'Project config not found' }, 404);
		}
		return c.json(config);
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

			if (type === 'video') {
				const videoPath = path.join('data', id, 'video', 'output.mp4');
				if (!fs.existsSync(videoPath)) {
					return c.json({ error: 'Video file not found' }, 404);
				}

				const filename = `${project.metadata.title || 'video'}-${id}.mp4`;
				c.header('Content-Disposition', `attachment; filename="${filename}"`);
				c.header('Content-Type', 'video/mp4');

				const fileBuffer = fs.readFileSync(videoPath);
				const stream = new ReadableStream({
					start(controller) {
						controller.enqueue(fileBuffer);
						controller.close();
					},
				});

				return new Response(stream);
			} else {
				const commentaryDir = path.join('data', id, 'commentary');
				if (!fs.existsSync(commentaryDir)) {
					return c.json({ error: 'Audio files not found' }, 404);
				}

				const files = fs.readdirSync(commentaryDir).filter(file => file.endsWith('.mp3'));
				if (files.length === 0) {
					return c.json({ error: 'No audio files found' }, 404);
				}

				if (files.length === 1) {
					const audioPath = path.join(commentaryDir, files[0]);
					c.header('Content-Disposition', `attachment; filename="${files[0]}"`);
					c.header('Content-Type', 'audio/mpeg');

					const fileBuffer = fs.readFileSync(audioPath);
					const stream = new ReadableStream({
						start(controller) {
							controller.enqueue(fileBuffer);
							controller.close();
						},
					});

					return new Response(stream);
				} else {
					const zip = new JSZip();
					files.forEach(file => {
						const filePath = path.join(commentaryDir, file);
						zip.file(file, fs.readFileSync(filePath));
					});

					const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
					c.header('Content-Disposition', `attachment; filename="commentary-${id}.zip"`);
					c.header('Content-Type', 'application/zip');

					const stream = new ReadableStream({
						start(controller) {
							controller.enqueue(zipBuffer);
							controller.close();
						},
					});

					return new Response(stream);
				}
			}
		} catch (error) {
			const errorType = c.req.param('type');
			console.error(`Error downloading ${errorType}:`, error);
			return c.json({ error: 'Internal server error' }, 500);
		}
	});

export { fetchRouter };
