import { Hono } from 'hono';
import { generateDescription, getDescriptionGenerationProgress } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo, getVideoGenerationProgress } from '@/lib/generateVideo';
import { VideoGenerationStep, DescriptionGenerationStep, DescriptionGenerationState } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage } from '@/db/storage';
import { generateProjectId } from '@/lib/util';
import { defaultProjectTemplate } from '@shared/types/options/defaultTemplates';
import { streamSSE } from 'hono/streaming';
import type { SSEStreamingApi } from 'hono/streaming';
import {
	ProjectOptionsSchema,
	DescriptionOptionsSchema,
	CommentaryOptionsSchema,
	VideoOptionsSchema,
} from '@/lib/serverSchema';

const generateRouter = new Hono()
	.post('/project', zValidator('json', ProjectOptionsSchema), async c => {
		const { templateId } = c.req.valid('json');
		const id = generateProjectId();
		let projectTemplate = defaultProjectTemplate;
		if (templateId) {
			const template = await projectStorage.getProjectTemplate(templateId);
			if (template) {
				projectTemplate = template;
			}
		}

		// Create project with template first
		const project = await projectStorage.createProject(id, projectTemplate);

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

		try {
			const project = await projectStorage.getProject(id);
			if (!project) {
				return c.json({ error: 'Project not found' }, 404);
			}
			const metadata = await generateMetadata(id, url);
			return c.json(metadata, 200);
		} catch (error) {
			console.error('Error starting generation:', error);
			return c.json({ error: 'Failed to start generation' }, 500);
		}
	})
	.post('/commentary/:id', zValidator('json', CommentaryOptionsSchema), async c => {
		const { options } = c.req.valid('json');
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project) {
				return c.json({ error: 'Project not found' }, 404);
			}
			const description = project?.description;
			if (!description) {
				return c.json({ error: 'No description found' }, 400);
			}

			// Wait for the commentary to be generated
			const commentary = await generateCommentary(id, description, options);
			return c.json({ commentary });
		} catch (error) {
			console.error('Error generating commentary:', error);
			return c.json({ error: 'Failed to generate commentary' }, 500);
		}
	})
	.post('/video/:id/start', zValidator('json', VideoOptionsSchema), async c => {
		const { options } = c.req.valid('json');
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project?.metadata?.url) {
				return c.json({ error: 'No video URL found' }, 400);
			}

			if (!project || !project.commentary) {
				return c.json({ error: 'Project not found' }, 404);
			}

			// Start the process in the background
			generateVideo(id, project.commentary, options).catch(error => {
				console.error('Error in video generation:', error);
			});

			return c.json({ message: 'Generation started' });
		} catch (error) {
			console.error('Error starting generation:', error);
			return c.json({ error: 'Failed to start generation' }, 500);
		}
	})
	.get('/video/:id/status', async c => {
		const id = c.req.param('id');
		const progress = getVideoGenerationProgress(id);
		return c.json(
			progress || {
				currentStep: VideoGenerationStep.IDLE,
				completedSteps: [],
			},
		);
	})
	.post('/description/:id/start', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project) {
				return c.json({ error: 'Project not found' }, 404);
			}

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

		const progress = getDescriptionGenerationProgress(id);
		const currentState = progress || {
			currentStep: DescriptionGenerationStep.IDLE,
			completedSteps: [],
			progress: undefined,
		};

		// only use SSE for downloading
		if (
			!c.req.header('Accept')?.includes('text/event-stream') ||
			currentState.currentStep !== DescriptionGenerationStep.DOWNLOADING
		) {
			return c.json(currentState, 200);
		}

		return streamSSE(
			c,
			async (stream: SSEStreamingApi) => {
				let lastState: DescriptionGenerationState | null = null;
				let retryCount = 0;
				const MAX_RETRIES = 100; // 10 seconds with 100ms sleep

				while (retryCount < MAX_RETRIES) {
					const state = getDescriptionGenerationProgress(id);

					if (!state) {
						await stream.sleep(100);
						retryCount++;
						continue;
					}

					// reset retry count when we get valid state
					retryCount = 0;

					// only send if state changed
					if (JSON.stringify(state) !== JSON.stringify(lastState)) {
						await stream.writeSSE({
							data: JSON.stringify(state),
							// remove event type to match client expectation
							id: `${id}-${Date.now()}`,
						});
						lastState = { ...state };
					}

					// check if we should stop streaming
					if (
						state.currentStep === DescriptionGenerationStep.COMPLETED ||
						state.currentStep === DescriptionGenerationStep.ERROR ||
						state.currentStep === DescriptionGenerationStep.IDLE ||
						state.currentStep === DescriptionGenerationStep.UPLOADING
					) {
						// send final state
						await stream.writeSSE({
							data: JSON.stringify(state),
							id: `${id}-final-${Date.now()}`,
						});
						break;
					}

					await stream.sleep(100);
				}

				// handle timeout
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
