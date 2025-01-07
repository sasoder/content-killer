import { Hono } from 'hono';
import { generateDescription, getGenerationProgress } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo } from '@/lib/generateVideo';
import { generateAudio } from '@/lib/generateAudio';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import {
	VideoGenerationStep,
	DescriptionGenerationStep,
	VideoMetadata,
	DescriptionGenerationState,
} from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage, updateVideoGenerationState } from '@/db/storage';
import { generateProjectId } from '@/lib/util';
import { defaultProjectTemplate } from '@shared/types/options/defaultTemplates';
import { streamSSE } from 'hono/streaming';
import type { SSEStreamingApi } from 'hono/streaming';

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

const ProjectOptionsSchema = z.object({
	templateId: z.string().optional(),
});

const generateRouter = new Hono()
	.post('/project', zValidator('json', ProjectOptionsSchema), async c => {
		const { templateId } = c.req.valid('json');
		const id = generateProjectId();
		let optionTemplate = undefined;
		if (templateId) {
			const template = await projectStorage.getProjectTemplate(templateId);
			if (template) {
				optionTemplate = template;
			}
		}

		// Create project with template first
		const project = await projectStorage.createProject(id, optionTemplate);

		// Then initialize the generation states
		project.descriptionGenerationState = {
			currentStep: DescriptionGenerationStep.IDLE,
			completedSteps: [],
		};
		project.videoGenerationState = {
			currentStep: VideoGenerationStep.IDLE,
			completedSteps: [],
		};
		await projectStorage.updateProjectState(project);

		return c.json(project, 201);
	})
	.post('/projectTemplate', async c => {
		try {
			const template = {
				...defaultProjectTemplate,
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				pauseSoundFilename: 'pause_default.wav',
			};

			await projectStorage.createProjectTemplate(template);

			// Copy the default pause sound to the new template
			const defaultPauseSound = await projectStorage.getProjectTemplateFile('default', 'pause_default.wav');
			await projectStorage.updateTemplatePauseSound(template.id, template.pauseSoundFilename, defaultPauseSound);

			return c.json(template, 201);
		} catch (error) {
			console.error('Error creating project template:', error);
			return c.json({ message: 'Failed to create project template' }, 500);
		}
	})
	.post('/metadata/:id', zValidator('json', z.object({ url: z.string() })), async c => {
		const { url } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (project) {
			const metadata: Partial<VideoMetadata> = await generateMetadata(url);
			const fullMetadata = { ...metadata, url };
			project.metadata = { ...project.metadata, ...fullMetadata };
			await projectStorage.updateProjectState(project);
			return c.json(fullMetadata);
		}
		return c.json({ error: 'Project not found' }, 404);
	})
	.post('/commentary/:id', zValidator('json', CommentaryOptionsSchema), async c => {
		const { description, options } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		const commentary = await generateCommentary(description, options);
		if (project) {
			project.commentary = commentary;
			project.description = description;
			project.options.commentary = options;
			await projectStorage.updateProjectState(project);
		}
		return c.json(commentary);
	})
	.post('/video/:id', zValidator('json', VideoOptionsSchema), async c => {
		const { commentary, options } = c.req.valid('json');
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project?.metadata?.url && !project?.metadata?.url) {
				return c.json({ error: 'No video URL found' }, 400);
			}

			project.commentary = commentary;
			project.options.video = options;
			await updateVideoGenerationState(project, VideoGenerationStep.PREPARING);
			await updateVideoGenerationState(project, VideoGenerationStep.GENERATING_AUDIO);
			// remove existing audio files
			await projectStorage.deleteProjectCommentary(id);
			await generateAudio(id, commentary, options.audio);
			await generateVideo(project, options, (step, error) => updateVideoGenerationState(project, step, error));
			await updateVideoGenerationState(project, VideoGenerationStep.COMPLETED);

			return c.json({ success: true });
		} catch (error) {
			// Update error state
			const project = await projectStorage.getProject(id);
			if (project) {
				await updateVideoGenerationState(project, VideoGenerationStep.ERROR, {
					step: VideoGenerationStep.FINALIZING,
					message: error instanceof Error ? error.message : 'Unknown error',
				});
			}
			console.error('Error generating video:', error);
			return c.json({ error: 'Failed to generate video' }, 500);
		}
	})
	.post('/description/:id/start', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		console.log('url', url);
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project) {
				return c.json({ error: 'Project not found' }, 404);
			}

			// Start the process in the background
			generateDescription(id, url, options).catch(error => {
				console.error('Error in description generation:', error);
			});

			return c.json({ message: 'Generation started' });
		} catch (error) {
			console.error('Error starting generation:', error);
			return c.json({ error: 'Failed to start generation' }, 500);
		}
	})
	.get('/description/:id/status', async c => {
		const id = c.req.param('id');

		const progress = getGenerationProgress(id);
		const currentState = progress || {
			currentStep: DescriptionGenerationStep.IDLE,
			completedSteps: [],
			progress: 0,
		};

		// For regular state checks or if state is IDLE/ERROR/COMPLETED,
		// just return current state without streaming
		if (
			!c.req.header('Accept')?.includes('text/event-stream') ||
			currentState.currentStep === DescriptionGenerationStep.IDLE ||
			currentState.currentStep === DescriptionGenerationStep.ERROR ||
			currentState.currentStep === DescriptionGenerationStep.COMPLETED
		) {
			return c.json(currentState);
		}

		return streamSSE(
			c,
			async (stream: SSEStreamingApi) => {
				let lastState: DescriptionGenerationState | null = null;
				let retryCount = 0;
				const MAX_RETRIES = 100; // 10 seconds with 100ms sleep

				while (retryCount < MAX_RETRIES) {
					console.log('Getting progress for', id);
					const state = getGenerationProgress(id);

					if (!state) {
						await stream.sleep(100);
						retryCount++;
						continue;
					}

					// Reset retry count when we get valid state
					retryCount = 0;

					// Only send if state changed
					if (JSON.stringify(state) !== JSON.stringify(lastState)) {
						console.log('Sending progress for', id, state);
						await stream.writeSSE({
							data: JSON.stringify(state),
							// Remove event type to match client expectation
							id: `${id}-${Date.now()}`,
						});
						lastState = { ...state };
					}

					// Check if we should stop streaming
					if (
						state.currentStep === DescriptionGenerationStep.COMPLETED ||
						state.currentStep === DescriptionGenerationStep.ERROR ||
						state.currentStep === DescriptionGenerationStep.IDLE
					) {
						// Send final state
						await stream.writeSSE({
							data: JSON.stringify(state),
							id: `${id}-final-${Date.now()}`,
						});
						break;
					}

					await stream.sleep(100);
				}

				// Handle timeout
				if (retryCount >= MAX_RETRIES) {
					await stream.writeSSE({
						data: JSON.stringify({
							currentStep: DescriptionGenerationStep.ERROR,
							error: {
								step: DescriptionGenerationStep.ERROR,
								message: 'Generation timed out',
							},
						}),
						id: `${id}-timeout-${Date.now()}`,
					});
				}
			},
			async (err: Error, stream: SSEStreamingApi) => {
				console.error('SSE Stream error:', err);
				await stream.writeSSE({
					data: JSON.stringify({
						currentStep: DescriptionGenerationStep.ERROR,
						error: {
							step: DescriptionGenerationStep.ERROR,
							message: err.message,
						},
					}),
					id: `${id}-error-${Date.now()}`,
				});
			},
		);
	});

export { generateRouter };
